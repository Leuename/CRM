"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeStage,
  createOpportunity,
  updateOpportunity,
  updateContact,
  type DuplicateMatch,
  type OpportunityUpdateInput,
  type OpportunityDetail,
} from "@/lib/api";
import { Button, Card } from "@/lib/ds";
import { SectionOpportunityInfo } from "./SectionOpportunityInfo";
import { NEW_CONTACT_VALUE, SectionContact } from "./SectionContact";
import { SectionProductLine } from "./SectionProductLine";
import { SectionSalesStatus } from "./SectionSalesStatus";
import { SectionNotes } from "./SectionNotes";
import { usePickers } from "./usePickers";
import {
  apiErrorMessage,
  buildCreatePayload,
  commonFields,
  emptyLine,
  emptyNewCompany,
  emptyNewContact,
  errorBanner,
  errorToFormState,
  lineFromDetail,
  retryBtn,
  seedPriceOnProductChange,
  seedServiceSchedule,
  validateForm,
  warnBanner,
  type ContactMode,
  type FormValues,
  type LeadType,
  type LineRow,
  type NewCompanyDraft,
  type NewContactDraft,
} from "./shared";

// The source clause of the partial-failure banner. Kept as one constant so the
// Retry button can strip exactly its own clause and leave a stage failure alone.
const SOURCE_WARN = "Opportunity saved, but the lead source did not update: ";

export function OpportunityForm({ initial }: { initial?: OpportunityDetail }) {
  const router = useRouter();
  const isEdit = initial !== undefined;

  //  — Opportunity Information
  const [leadType, setLeadType] = useState<LeadType>(
    // An existing deal with a company was, by definition, a company lead. Not
    // stored anywhere: the type is a form affordance, so it is re-derived.
    initial?.company_id ? "COMPANY" : "INDIVIDUAL",
  );
  const [sourceId, setSourceId] = useState("");
  const [salesRepId, setSalesRepId] = useState(initial?.sales_representative_id ?? "");
  const [teamSize, setTeamSize] = useState(
    initial?.team_size != null ? String(initial.team_size) : "",
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(initial?.expected_close_date ?? "");

  const [serviceTerm, setServiceTerm] = useState<string>(initial?.service_term ?? "");

  //  — Contact
  const [contactMode, setContactMode] = useState<ContactMode>("existing");
  const [contactId, setContactId] = useState(initial?.primary_contact_id ?? "");
  const [newContact, setNewContact] = useState<NewContactDraft>(emptyNewContact);
  const [newCompany, setNewCompany] = useState<NewCompanyDraft>(emptyNewCompany);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  //  — Product Line
  const [lines, setLines] = useState<LineRow[]>(
    initial?.products?.length
      ? seedServiceSchedule(initial.products.map(lineFromDetail), initial)
      : [],
  );
  const [sellingPrice, setSellingPrice] = useState(initial?.selling_price_ex_vat ?? "");
  const [discountPercent, setDiscountPercent] = useState(initial?.discount_percent ?? "");
  const [dealDiscountOn, setDealDiscountOn] = useState(
    (initial?.discount_percent ?? "").trim() !== "" && Number(initial?.discount_percent) > 0,
  );

  // own exemption once it does.
  const [dealVatExempt, setDealVatExempt] = useState(initial?.vat_exempt ?? false);

  // a historical amount is still labelled with the currency it was stored in.
  const currency = initial?.currency ?? "USD";

  //  — Sales Status
  const [stageId, setStageId] = useState(initial?.stage_id ?? "");
  const [stageReason, setStageReason] = useState("");

  //  — Additional Requirements
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const { contacts, products, salesReps, leadSources, stages, repOptions } = usePickers(
    initial,
    setContactId,
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [sourceFailed, setSourceFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Set only when a create succeeded but its follow-up write did not: the deal
  // exists, so the form must stop offering to create it again.
  const [savedId, setSavedId] = useState<string | null>(null);

  const selectedContact = useMemo(
    () => (contacts ?? []).find((c) => c.id === contactId),
    [contacts, contactId],
  );

  const prefilledFor = useRef<string | null>(null);
  useEffect(() => {
    // Leaving "existing" forgets which contact was prefilled, so picking A →
    // New contact → A again re-reads A's own source. Without the reset the box
    // would still hold whatever was typed for the new person and the save would
    // PATCH it onto A.
    if (contactMode !== "existing") {
      prefilledFor.current = null;
      return;
    }
    if (!selectedContact) return;
    if (prefilledFor.current === selectedContact.id) return;
    prefilledFor.current = selectedContact.id;
    setSourceId(selectedContact.source_id ?? "");
  }, [contactMode, selectedContact]);

  // Writes the chosen lead source onto the selected contact when it differs.
  // Returns null when there was nothing to do or it worked, otherwise why it
  // did not — the deal is already saved by the time this runs, so a failure is
  // reported as a partial success rather than as a failed save.
  async function syncContactSource(): Promise<string | null> {
    if (contactMode !== "existing" || !selectedContact) return null;
    if ((sourceId || null) === (selectedContact.source_id ?? null)) return null;
    try {
      await updateContact(selectedContact.id, { source_id: sourceId || null });
      return null;
    } catch (err: unknown) {
      return apiErrorMessage(err, "You are not permitted to change this contact.");
    }
  }

  // Re-runs ONLY the contact PATCH — the deal is saved and the stage move, if it
  // was asked for, already had its own attempt. On success the source clause
  // leaves the banner; anything before it (the stage failure) stays.
  async function retrySource() {
    setRetrying(true);
    const why = await syncContactSource();
    setRetrying(false);
    setSourceFailed(why !== null);
    setFormWarning((w) => {
      const rest = (w ?? "").split(SOURCE_WARN)[0].trim();
      return why ? [rest, SOURCE_WARN + why].filter(Boolean).join(" ") : rest || null;
    });
  }

  function patchNewContact(patch: Partial<NewContactDraft>) {
    setNewContact((c) => ({ ...c, ...patch }));
    // A changed email is a different person as far as the duplicate check is
    // concerned, so a stale warning must not keep the confirm button live.
    if ("email" in patch) setDuplicates(null);
  }
  function patchNewCompany(patch: Partial<NewCompanyDraft>) {
    setNewCompany((c) => ({ ...c, ...patch }));
  }

  function onPickContact(value: string) {
    setDuplicates(null);
    if (value === NEW_CONTACT_VALUE) {
      setContactMode("new");
      setContactId("");
      return;
    }
    setContactMode("existing");
    setContactId(value);
  }

  function updateLine(key: string, patch: Partial<LineRow>) {
    // Every rep edit to a line routes through here, and changeProduct does not.
    // So this is the one place a hand touches the price: the moment it does, the
    // price becomes the rep's and a later product change must not overwrite it
    // (a prior form update). Guarding here rather than at the input keeps the invariant true
    // for any future caller that sets unit_price.
    const next = "unit_price" in patch ? { ...patch, priceSeeded: false } : patch;
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...next } : r)));
  }

  // ours (empty, or a default we seeded and the rep never touched). A price the
  // rep typed is theirs and is never overwritten, tracked by priceSeeded rather
  // than by comparing values (a prior form update: a hand-entered price equal to the previous
  // default used to be mistaken for ours). The old form seeded nothing, so a
  // blank price reached the server, which reads a null unit price as 0.00 and
  // books the deal at zero revenue without saying so.
  function changeProduct(key: string, productId: string) {
    setLines((rows) =>
      rows.map((r) => {
        if (r.key !== key) return r;
        const nextDefault = (products ?? []).find((p) => p.id === productId)?.default_price ?? "";
        return {
          ...r,
          product_id: productId,
          ...seedPriceOnProductChange(r, nextDefault),
        };
      }),
    );
  }

  function addLine() {
    setLines((rows) => [...rows, emptyLine()]);
  }
  function removeLine(key: string) {
    setLines((rows) => rows.filter((r) => r.key !== key));
  }

  // What validation and the payload builders read. Assembled here so the rules
  // themselves stay pure and out of this file — see shared.ts.
  const values: FormValues = {
    leadType,
    contactMode,
    contactId,
    newContact,
    newCompany,
    lines,
    sellingPrice,
    discountPercent,
    dealDiscountOn,
    dealVatExempt,
    teamSize,
    expectedCloseDate,
    serviceTerm,
    salesRepId,
    notes,
  };

  async function submit(confirmDuplicate = false) {
    const errs = validateForm(values);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setLineError(errs.products ?? null);
      setFormError(null);
      setFormWarning(null);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setFormWarning(null);
    setLineError(null);

    try {
      if (!isEdit) {
        const saved = await createOpportunity(
          buildCreatePayload(values, {
            sourceId,
            confirmDuplicate,
            selectedContactCompanyId: selectedContact?.company_id ?? null,
          }),
        );
        const sourceWhy = await syncContactSource();
        if (sourceWhy) {
          // The deal exists. Saying "save failed" would be a lie and would
          // invite a second, duplicate deal — so the button stops offering one
          // and points at the record that was created instead.
          setSavedId(saved.id);
          setSourceFailed(true);
          setFormWarning(SOURCE_WARN + sourceWhy);
          setSubmitting(false);
          return;
        }
        router.push(`/sales/opportunities/${saved.id}`);
        return;
      }

      // --- edit: details first, then the stage move as its own request -------
      const payload: OpportunityUpdateInput = {
        primary_contact_id: contactId,
        ...commonFields(values),
      };
      // company_id is sent ONLY when the contact actually changed. An older deal
      // may legitimately carry a company that is not this contact's, and
      // rewriting it on every save would be the silent-strip trap from S4.
      if (contactId !== initial.primary_contact_id) {
        payload.company_id = selectedContact?.company_id ?? null;
      }
      await updateOpportunity(initial.id, payload);

      // ORDER: details → stage move → lead source. Each is its own request and
      // each can fail alone, so none of them may return early past a later one:
      // the stage move used to sit behind the lead-source sync, and a refused
      // PATCH on the contact silently skipped a move the rep had asked for.
      // Both failures are collected and reported together instead.
      let stageWhy: string | null = null;
      if (stageId && stageId !== initial.stage_id) {
        try {
          await changeStage(initial.id, {
            to_stage_id: stageId,
            reason: stageReason.trim() || null,
          });
        } catch (stageErr: unknown) {
          // The details are already saved. Say exactly that, keep every entry on
          // screen, and let the user retry — reporting this as a plain failure
          // would send them re-typing work that is already stored.
          stageWhy = apiErrorMessage(stageErr, "You are not permitted to move this deal.");
        }
      }

      const sourceWhy = await syncContactSource();
      if (stageWhy || sourceWhy) {
        setSourceFailed(sourceWhy !== null);
        setFormWarning(
          [
            stageWhy && `Details saved, but the stage did not move: ${stageWhy}`,
            sourceWhy && SOURCE_WARN + sourceWhy,
          ]
            .filter(Boolean)
            .join(" "),
        );
        setSubmitting(false);
        return;
      }
      router.push(`/sales/opportunities/${initial.id}`);
    } catch (err: unknown) {
      const next = errorToFormState(err);
      if (next.duplicates) setDuplicates(next.duplicates);
      setFieldErrors(next.fieldErrors);
      setLineError(next.lineError);
      setFormError(next.formError);
      setSubmitting(false);
    }
  }

  return (
    // Full width, like every other page's content Card (list/table pages
    // never cap either) — the old 940px pin left a dead zone the width of
    // the form itself on anything wider than a laptop. Individual fields stay
    // human-sized regardless (.opp-form-grid-2 etc. below): the extra room
    // goes into fitting more fields per row and giving the product-line table
    // real breathing space, not into stretching a single input across 500px.
    <Card padding={0} style={{ width: "100%" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        {(formError || formWarning) && (
          <div className="opp-form-banners">
            {formError && (
              <div role="alert" style={errorBanner}>
                {formError}
              </div>
            )}
            {formWarning && (
              <div role="alert" style={warnBanner}>
                {formWarning}
                {sourceFailed && (
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={() => void retrySource()}
                    style={retryBtn}
                  >
                    {retrying ? "Retrying…" : "Retry"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <SectionOpportunityInfo
          leadType={leadType}
          setLeadType={setLeadType}
          leadSources={leadSources}
          sourceId={sourceId}
          setSourceId={setSourceId}
          repOptions={repOptions}
          salesReps={salesReps}
          salesRepId={salesRepId}
          setSalesRepId={setSalesRepId}
          teamSize={teamSize}
          setTeamSize={setTeamSize}
          expectedCloseDate={expectedCloseDate}
          setExpectedCloseDate={setExpectedCloseDate}
          serviceTerm={serviceTerm}
          setServiceTerm={setServiceTerm}
          fieldErrors={fieldErrors}
        />

        <SectionContact
          isEdit={isEdit}
          leadType={leadType}
          contacts={contacts}
          contactMode={contactMode}
          contactId={contactId}
          onPickContact={onPickContact}
          newContact={newContact}
          patchNewContact={patchNewContact}
          newCompany={newCompany}
          patchNewCompany={patchNewCompany}
          duplicates={duplicates}
          onConfirmDuplicate={() => void submit(true)}
          submitting={submitting}
          fieldErrors={fieldErrors}
        />

        <SectionProductLine
          lines={lines}
          products={products}
          currency={currency}
          updateLine={updateLine}
          changeProduct={changeProduct}
          addLine={addLine}
          removeLine={removeLine}
          lineError={lineError}
          sellingPrice={sellingPrice}
          setSellingPrice={setSellingPrice}
          dealDiscountOn={dealDiscountOn}
          setDealDiscountOn={setDealDiscountOn}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          dealVatExempt={dealVatExempt}
          setDealVatExempt={setDealVatExempt}
          fieldErrors={fieldErrors}
        />

        <SectionSalesStatus
          isEdit={isEdit}
          stages={stages}
          currentStageId={initial?.stage_id ?? null}
          currentStageName={initial?.stage_name ?? null}
          stageId={stageId}
          setStageId={setStageId}
          stageReason={stageReason}
          setStageReason={setStageReason}
        />

        <SectionNotes notes={notes} setNotes={setNotes} fieldErrors={fieldErrors} />

        <div className="opp-form-footer">
          {savedId ? (
            <Button
              type="button"
              icon="las la-arrow-right"
              onClick={() => router.push(`/sales/opportunities/${savedId}`)}
            >
              Go to opportunity
            </Button>
          ) : (
            <Button type="submit" icon="las la-save" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create opportunity"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() =>
              router.push(isEdit ? `/sales/opportunities/${initial.id}` : "/sales/opportunities")
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
