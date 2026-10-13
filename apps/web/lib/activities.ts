// Single source of truth for activity-type presentation. The server owns the
// vocabulary (, an app-level enum of 9 types); this maps each to a Line
// Awesome icon + DS Tag tone + human label and titlecases anything unknown.
// `system: true` marks the two server-only types (STATUS_CHANGE / SYSTEM_EVENT)
// that users cannot create or edit — the add form offers only the manual types.
import type { Tone } from "@/lib/api";

export interface ActivityTypeMeta {
  value: string;
  label: string;
  icon: string;
  tone: Tone;
  system: boolean;
}

const KNOWN: Record<string, ActivityTypeMeta> = {
  NOTE: {
    value: "NOTE",
    label: "Note",
    icon: "las la-sticky-note",
    tone: "grey",
    system: false,
  },
  CALL: {
    value: "CALL",
    label: "Call",
    icon: "las la-phone",
    tone: "blue",
    system: false,
  },
  EMAIL: {
    value: "EMAIL",
    label: "Email",
    icon: "lar la-envelope",
    tone: "lightblue",
    system: false,
  },
  MEETING: {
    value: "MEETING",
    label: "Meeting",
    icon: "las la-users",
    tone: "primary",
    system: false,
  },
  SITE_VISIT: {
    value: "SITE_VISIT",
    label: "Consultation",
    icon: "las la-map-marker-alt",
    tone: "blue",
    system: false,
  },
  FOLLOW_UP: {
    value: "FOLLOW_UP",
    label: "Follow-up",
    icon: "las la-redo",
    tone: "yellow",
    system: false,
  },
  PROPOSAL_SENT: {
    value: "PROPOSAL_SENT",
    label: "Proposal sent",
    icon: "las la-file-invoice",
    tone: "primary",
    system: false,
  },
  STATUS_CHANGE: {
    value: "STATUS_CHANGE",
    label: "Status change",
    icon: "las la-random",
    tone: "grey",
    system: true,
  },
  SYSTEM_EVENT: {
    value: "SYSTEM_EVENT",
    label: "System event",
    icon: "las la-cog",
    tone: "grey",
    system: true,
  },
};

// All types in display order.
export const ACTIVITY_TYPES: ActivityTypeMeta[] = Object.values(KNOWN);

// The types a user may create/edit — the only options the add form offers.
export const MANUAL_ACTIVITY_TYPES: ActivityTypeMeta[] = ACTIVITY_TYPES.filter((t) => !t.system);

function titlecase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Never throws: an unknown type (e.g. a future value) renders as a grey
// titlecased entry with a generic icon rather than a raw enum token.
export function activityType(value: string): ActivityTypeMeta {
  return (
    KNOWN[value] ?? {
      value,
      label: titlecase(value),
      icon: "las la-dot-circle",
      tone: "grey",
      system: false,
    }
  );
}
