"use client";

import { Section } from "./ui";
import { fieldErrStyle } from "./shared";

export function SectionNotes({
  notes,
  setNotes,
  fieldErrors,
}: {
  notes: string;
  setNotes: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <Section
      index={5}
      title="Additional requirements / notes"
      subtitle="Anything else the team should know about this deal."
    >
      {/* The old form carried `notes` in state and in the payload but rendered
          no control for it, so the only way to write one was the API. */}
      {/* Capped for a comfortable reading measure — a paragraph box a page wide
          is harder to scan, not easier, even once the section body is wide. */}
      <label className="crm-field" style={{ paddingTop: 0, maxWidth: 760 }}>
        {/* The section heading is the visible label (mock section 5); the name
            still reaches a screen reader and the e2e hooks. */}
        <span className="sr-only">Notes</span>
        <textarea
          aria-label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Type your notes here…"
          className="crm-field-box"
        />
        {/* Display only (mock section 5). Nothing truncates here and the API
            sets no length on notes — this counts, it does not police. */}
        <span className="crm-field-count">{notes.length} / 1000</span>
      </label>
      {fieldErrors.notes && <div style={fieldErrStyle}>{fieldErrors.notes}</div>}
    </Section>
  );
}
