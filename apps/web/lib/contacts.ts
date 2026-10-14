// Single source of truth for client-status presentation. The server owns the
// status vocabulary ( keeps it configurable, no DB CHECK); this maps the
// known values to a DS Tag tone + human label and titlecases anything else.
// Replaces the dead `STATUS_TONE` map whose keys never matched the real
// NEW_CLIENT / EXISTING_CLIENT values (the grey-tag defect).
import type { Tone } from "@/lib/api";

export interface ClientStatusMeta {
  value: string;
  label: string;
  tone: Tone;
}

const KNOWN: Record<string, ClientStatusMeta> = {
  NEW_CLIENT: { value: "NEW_CLIENT", label: "New Client", tone: "blue" },
  EXISTING_CLIENT: {
    value: "EXISTING_CLIENT",
    label: "Existing Client",
    tone: "blue",
  },
};

// Options for the create/edit dropdown — the two writable statuses.
export const CLIENT_STATUS_OPTIONS: ClientStatusMeta[] = Object.values(KNOWN);

function titlecase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Never throws: an unknown status (e.g. a future lifecycle value) renders as a
// grey titlecased tag rather than a raw enum token.
export function clientStatus(value: string): ClientStatusMeta {
  return KNOWN[value] ?? { value, label: titlecase(value), tone: "grey" };
}
