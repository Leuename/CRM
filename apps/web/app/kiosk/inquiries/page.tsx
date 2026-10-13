"use client";

import { useState } from "react";
import { Tag } from "@/lib/ds";
import { listOpportunities, type OpportunitySummary, type Page } from "@/lib/api";
import { stageTone } from "@/lib/opportunities";
import { ageLabel } from "../kiosk-format";
import { useKioskChrome } from "../KioskShell";
import { SearchGlyph } from "../KioskIcons";
import { KioskEmpty, KioskError, KioskLoadingRows, MIN_QUERY, useKioskSearch } from "../KioskState";

// Stable reference — see useKioskSearch.
const search = (q: string, signal: AbortSignal): Promise<Page<OpportunitySummary>> =>
  listOpportunities({ limit: 20, offset: 0, q }, signal);

export default function FindInquiry() {
  useKioskChrome("Find inquiry", "Look up by reference or name", "/kiosk");
  const [query, setQuery] = useState("");
  const state = useKioskSearch(query, search);

  return (
    <div className="k-screen" style={{ padding: "34px 46px 0" }}>
      <h2 className="k-h2">Look up an inquiry</h2>
      <p className="k-p">Reference, name, or mobile number — whichever they have.</p>

      <div className="k-searchbar k-searchbar-lg">
        <SearchGlyph />
        <input
          type="search"
          autoFocus
          aria-label="Search inquiries by reference, name, or mobile"
          placeholder="INQ-1001 or Amara Bennett"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="k-scroll">
        {state.status === "idle" && (
          <KioskEmpty title="What have they got with them?">
            The reference from their slip works best. A name or a mobile number will do — at least{" "}
            {MIN_QUERY} characters.
          </KioskEmpty>
        )}
        {state.status === "loading" && <KioskLoadingRows count={2} />}
        {state.status === "error" && <KioskError error={state.error} />}

        {state.status === "ready" &&
          (state.data.items.length === 0 ? (
            <KioskEmpty title="Nothing matches that yet.">
              Double-check the reference, or try their surname. If they have never been in, start a
              new inquiry from the home screen.
            </KioskEmpty>
          ) : (
            state.data.items.map((o) => <InquiryCard key={o.id} opportunity={o} />)
          ))}
      </div>
    </div>
  );
}

function InquiryCard({ opportunity: o }: { opportunity: OpportunitySummary }) {
  return (
    <article className="k-inq-card">
      <div className="k-inq-head">
        <span className="k-inq-code">{o.reference}</span>
        <Tag tone={stageTone(o.stage_color)} dot>
          {o.stage_name}
        </Tag>
        <span style={{ flex: 1 }} />
        <span className="k-inq-raised">Raised {ageLabel(o.created_at).toLowerCase()}</span>
      </div>
      <div className="k-rule" />
      <div className="k-cols">
        <div>
          <div className="k-col-label">Customer</div>
          <div className="k-col-value">{o.contact_name ?? "—"}</div>
        </div>
        <div>
          <div className="k-col-label">Interested in</div>

          <div className="k-col-value">{o.title}</div>
        </div>
        <div>
          <div className="k-col-label">Value</div>
          {/* Not conditional, and never computed: revenue is masked for OPERATIONS
              server-side ( view_revenue) and no figure belongs on a screen that
              faces the lobby. */}
          <div className="k-col-value k-masked">•••••</div>
        </div>
      </div>
      {o.owner_name && (
        <div className="k-inq-note">
          Owner: {o.owner_name}. Let the customer know someone will be in touch.
        </div>
      )}
    </article>
  );
}
