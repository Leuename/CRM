"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag } from "@/lib/ds";
import { listContacts, type Contact, type Page } from "@/lib/api";
import { clientStatus } from "@/lib/contacts";
import { initials, maskPhone } from "@/lib/kiosk-mask";
import { useKioskChrome } from "../KioskShell";
import { ChevronRight, SearchGlyph } from "../KioskIcons";
import { KioskEmpty, KioskError, KioskLoadingRows, MIN_QUERY, useKioskSearch } from "../KioskState";

// Module scope so the reference is stable across renders — useKioskSearch takes
// it as a dependency, and a fresh closure per keystroke would refire the effect.
const search = (q: string, signal: AbortSignal): Promise<Page<Contact>> =>
  listContacts({ limit: 20, offset: 0, q }, signal);

function fullName(c: Contact): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

export default function FindCustomer() {
  useKioskChrome("Find customer", "Search by name, mobile, or email", "/kiosk");
  const [query, setQuery] = useState("");
  const state = useKioskSearch(query, search);

  return (
    <div className="k-screen k-pad">
      <div className="k-searchbar">
        <SearchGlyph />
        <input
          type="search"
          autoFocus
          aria-label="Search customers by name, mobile, or email"
          placeholder="Name, mobile, or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="k-count" role="status" aria-live="polite">
          {state.status === "ready"
            ? `${state.data.total} ${state.data.total === 1 ? "match" : "matches"}`
            : ""}
        </span>
      </div>

      {state.status === "idle" && (
        <KioskEmpty title="Who are we helping?">
          Type at least {MIN_QUERY} letters of their name, or their mobile number or email.
        </KioskEmpty>
      )}
      {state.status === "loading" && <KioskLoadingRows />}
      {state.status === "error" && <KioskError error={state.error} />}

      {state.status === "ready" &&
        (state.data.items.length === 0 ? (
          <KioskEmpty title="No one by that name yet.">
            {/* Their WHOLE number, not the last four digits: a front-desk
                session is shown the mobile masked, so the server matches that
                column on the complete value only ( view_contact_pii). Part
                of a number finds nobody from this screen. */}
            Try a shorter spelling, or their whole mobile number. If they are new, start a new
            inquiry for them.
          </KioskEmpty>
        ) : (
          <div className="k-results">
            {state.data.items.map((c) => {
              const status = clientStatus(c.client_status);
              return (
                <Link key={c.id} href={`/kiosk/customers/${c.id}`} className="k-row">
                  <span className="k-row-avatar" aria-hidden="true">
                    {initials(fullName(c))}
                  </span>
                  <span className="k-row-text">
                    <span className="k-row-name">{fullName(c)}</span>
                    <span className="k-row-meta">
                      {[c.company_name, maskPhone(c.phone)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <Tag tone={status.tone}>{status.label}</Tag>
                  <span className="k-chev" aria-hidden="true">
                    <ChevronRight />
                  </span>
                </Link>
              );
            })}
          </div>
        ))}

      <div className="k-foot">Contact details stay masked on this screen.</div>
    </div>
  );
}
