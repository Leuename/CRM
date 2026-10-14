"use client";

/* -----------------------------------------------------------------------------
   New inquiry — the kiosk's one write.

   The wizard is a state machine over a single draft. Submit sends one request
   to the browser-local demo simulator, which creates associated demo records
   in this tab's session. Nothing is written before Submit — Start over clears
   the draft. This flow does not use a CRM server or database.

   The steps live in Steps.tsx, the after-Submit screens in Outcome.tsx, and the
   rules (what a mobile looks like, what is still missing) in wizard.ts.
   -------------------------------------------------------------------------- */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ApiError,
  type Contact,
  type DuplicateMatch,
  type KioskInquiry,
  type OpportunityRef,
  type PipelineStage,
  type Product,
  createKioskInquiry,
  getContactOpportunities,
  listContacts,
  listPipelineStages,
  listAllProducts,
} from "@/lib/api";
import { fullName } from "../kiosk-format";
import { presentationFor } from "./rooms";
import { useKioskChrome } from "../KioskShell";
import { MatchFound, StepDetails, StepRail, StepReview, StepWhat, StepWho } from "./Steps";
import { Confirmation, DiscardDialog, DuplicateDialog, Unreachable } from "./Outcome";
import {
  type Draft,
  type Screen,
  type StepId,
  EMPTY_DRAFT,
  MOBILE_DIGITS,
  digitsOnly,
  e164,
  lookupQuery,
  rateLabel,
  splitName,
} from "./wizard";

const CHROME: Record<Screen, [string, string]> = {
  who: ["New inquiry", "Step 1 of 4"],
  match: ["New inquiry", "Step 1 of 4"],
  what: ["New inquiry", "Step 2 of 4"],
  details: ["New inquiry", "Step 3 of 4"],
  review: ["New inquiry", "Step 4 of 4"],
  confirm: ["New inquiry", "Demo complete"],
  offline: ["New inquiry", "Not submitted"],
};

const isStep = (s: Screen): s is StepId =>
  s === "who" || s === "what" || s === "details" || s === "review";

export default function NewInquiry() {
  const router = useRouter();
  const { user } = useAuth();

  const [screen, setScreen] = useState<Screen>("who");
  const previousScreen = useRef<Screen>("who");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [overlay, setOverlay] = useState<"discard" | "duplicate" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [result, setResult] = useState<KioskInquiry | null>(null);

  // Step 1's match, and the record it belongs to.
  const [match, setMatch] = useState<Contact | null>(null);
  const [matchInquiries, setMatchInquiries] = useState<OpportunityRef[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsState, setProductsState] = useState<"loading" | "ready" | "error">("loading");
  const [productsError, setProductsError] = useState<unknown>(null);
  const [stages, setStages] = useState<Map<string, PipelineStage>>(new Map());
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  const [title, subtitle] = CHROME[screen];
  // Back from step 1 leaves the wizard; from anywhere else it is handled below,
  // so the header's back button is only ever "out of here".
  useKioskChrome(title, subtitle, "/kiosk");

  useEffect(() => {
    if (previousScreen.current === screen) return;
    previousScreen.current = screen;

    const target =
      document.querySelector<HTMLElement>("#kiosk-main [data-kiosk-screen-focus]") ??
      document.querySelector<HTMLElement>("#kiosk-main [data-kiosk-screen-heading]");
    target?.focus();
  }, [screen]);

  /* --- reference data ---------------------------------------------------- */

  // The catalogue and the stage list are small, cached by the browser, and both
  // are needed before the operator reaches the screen that uses them. Loading
  // them once on mount keeps step 2 instant with a customer standing there.
  useEffect(() => {
    const controller = new AbortController();
    listAllProducts({ active: true }, controller.signal)
      .then((all) => {
        if (controller.signal.aborted) return;
        // The kiosk offers the published demo catalogue and nothing else. The
        // products table also carries demo data, which is deliberate and stays
        // live everywhere else — but the inquiry flow only offers products it
        // can present with a description and illustration.
        //
        // `presentationFor` is the predicate because the presentation map has
        // an entry per demo product, keyed by id. A product the kiosk cannot
        // present is a product the kiosk should not offer.
        setProducts(all.filter((product) => presentationFor(product.id)));
        setProductsState("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setProductsError(err);
        setProductsState("error");
      });
    listPipelineStages(controller.signal)
      .then((list) => {
        if (!controller.signal.aborted) setStages(new Map(list.map((s) => [s.id, s])));
      })
      .catch(() => {
        // Stage names are decoration on the match screen; a failure there must
        // not block taking the inquiry. The row falls back to "In progress".
      });
    return () => controller.abort();
  }, []);

  const product = useMemo(
    () => products.find((p) => p.id === draft.productId) ?? null,
    [products, draft.productId],
  );

  /* --- edits ------------------------------------------------------------- */

  const patch = useCallback((changes: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...changes }));
  }, []);

  const setMobile = useCallback((raw: string) => {
    const digits = digitsOnly(raw);
    // Changing the number invalidates whoever step 1 matched: the draft must not
    // keep pointing at a record this number no longer belongs to.
    setDraft((d) => ({ ...d, mobile: digits, contactId: null }));
    setMatch(null);
    setError(null);
  }, []);

  /* --- step 1: does this number already belong to someone? --------------- */

  async function lookup() {
    if (digitsOnly(draft.mobile).length !== MOBILE_DIGITS) return;
    setBusy(true);
    setError(null);
    try {
      const page = await listContacts({ limit: 5, offset: 0, q: lookupQuery(draft.mobile) });
      const hit = page.items[0] ?? null;
      if (!hit) {
        setScreen("what");
        return;
      }
      setMatch(hit);
      setScreen("match");
      setMatchLoading(true);
      getContactOpportunities(hit.id)
        .then((list) => setMatchInquiries(list))
        .catch(() => setMatchInquiries([]))
        .finally(() => setMatchLoading(false));
    } catch (err) {
      // A failed lookup must not block a walk-in: the operator is told, and can
      // press Continue again. It is a convenience, not a gate.
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function useMatched() {
    if (!match) return;
    setDraft((d) => ({
      ...d,
      contactId: match.id,
      name: fullName(match),
      company: match.company_name ?? "",
      email: match.email ?? "",
    }));
    setScreen("what");
  }

  function asNewPerson() {
    // Same number, different person (a colleague on one company line). The draft
    // keeps the mobile and drops the identity.
    setDraft((d) => ({ ...d, contactId: null, name: "", company: "", email: "" }));
    setScreen("what");
  }

  /* --- submit ------------------------------------------------------------ */

  async function submit(confirmDuplicate = false) {
    if (!draft.productId) return;
    setBusy(true);
    setError(null);
    try {
      const name = splitName(draft.name);
      const inquiry = await createKioskInquiry({
        // An existing record is referenced, never re-sent. The demo simulator
        // models the kiosk's limited role and does not edit existing contacts here.
        ...(draft.contactId
          ? { contact_id: draft.contactId }
          : {
              new_contact: {
                first_name: name.first_name,
                last_name: name.last_name,
                email: draft.email.trim(),
                phone: e164(draft.mobile),
              },
              company_name: draft.company.trim() || null,
            }),
        product_id: draft.productId,
        notes: draft.notes.trim() || null,
        consent: draft.consent,
        marketing_opt_in: draft.marketing,
        confirm_duplicate: confirmDuplicate,
      });
      setResult(inquiry);
      setOverlay(null);
      setScreen("confirm");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.duplicates?.length) {
        setDuplicates(err.duplicates);
        setOverlay("duplicate");
        return;
      }
      // Transport failures keep the draft; validation responses from the local
      // simulator are shown in place so the operator can see which field failed.
      if (err instanceof ApiError) setError(err);
      else {
        setScreen("offline");
        setError(null);
      }
    } finally {
      setBusy(false);
    }
  }

  /* --- reset ------------------------------------------------------------- */

  function reset() {
    setDraft(EMPTY_DRAFT);
    setMatch(null);
    setMatchInquiries([]);
    setResult(null);
    setDuplicates([]);
    setError(null);
    setOpenRoom(null);
  }

  function discard() {
    reset();
    setOverlay(null);
    router.push("/kiosk");
  }

  return (
    <div className="k-screen">
      {isStep(screen) || screen === "match" ? (
        <StepRail
          current={screen === "match" ? "who" : screen}
          draft={draft}
          onGo={(step) => setScreen(step)}
        />
      ) : null}

      {screen === "who" && (
        <StepWho
          draft={draft}
          onMobile={setMobile}
          onContinue={lookup}
          onDiscard={() => setOverlay("discard")}
          busy={busy}
          error={error}
        />
      )}

      {screen === "match" && match && (
        <MatchFound
          contact={match}
          inquiries={matchInquiries}
          stages={stages}
          inquiriesLoading={matchLoading}
          onUse={useMatched}
          onCreateNew={asNewPerson}
          onDiscard={() => setOverlay("discard")}
        />
      )}

      {screen === "what" && (
        <StepWhat
          draft={draft}
          products={products}
          loading={productsState === "loading"}
          error={productsState === "error" ? productsError : null}
          openRoom={openRoom}
          onCategory={(category) => patch({ category })}
          onPick={(p) => {
            // Choosing a room shows it: the design's own `pick` sets the
            // selection AND opens that room's panel, so one tap answers both
            // "which one" and "what does it look like".
            patch({ productId: p.id, category: p.category });
            setOpenRoom(p.id);
          }}
          onToggleRoom={(id) => setOpenRoom((cur) => (cur === id ? null : id))}
          onContinue={() => setScreen("details")}
          onDiscard={() => setOverlay("discard")}
        />
      )}

      {screen === "details" && (
        <StepDetails
          draft={draft}
          locked={draft.contactId !== null}
          onChange={patch}
          onContinue={() => setScreen("review")}
          onDiscard={() => setOverlay("discard")}
        />
      )}

      {screen === "review" && (
        <StepReview
          draft={draft}
          productName={product?.name ?? "—"}
          productRate={product ? rateLabel(product) : "—"}
          operator={user.display_name}
          onEdit={(step) => setScreen(step)}
          onSubmit={() => submit()}
          onDiscard={() => setOverlay("discard")}
          busy={busy}
          error={error}
        />
      )}

      {screen === "confirm" && result && (
        <Confirmation
          inquiry={result}
          operator={user.display_name}
          onAnother={() => {
            reset();
            setScreen("who");
          }}
          onDone={() => router.push("/kiosk")}
        />
      )}

      {screen === "offline" && (
        <Unreachable
          draft={draft}
          onBack={() => setScreen("review")}
          onRetry={() => submit()}
          busy={busy}
        />
      )}

      {overlay === "discard" && (
        <DiscardDialog onKeep={() => setOverlay(null)} onDiscard={discard} />
      )}

      {overlay === "duplicate" && (
        <DuplicateDialog
          duplicates={duplicates}
          onEdit={() => {
            setOverlay(null);
            setScreen("details");
          }}
          onConfirm={() => submit(true)}
          busy={busy}
        />
      )}
    </div>
  );
}
