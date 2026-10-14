// New-inquiry wizard: the pure part. No React, no network — the rules an
// operator runs into (what a mobile number looks like, what is still missing
// before Review opens) live here so they can be tested directly and read in one
// place. The browser-local demo simulator models submission behavior; these
// client-side rules are not production validation or write authorization.

import type { Product } from "@/lib/api";

export const STEPS = ["who", "what", "details", "review"] as const;
export type StepId = (typeof STEPS)[number];

/** The screens the wizard can be on. "match" sits inside step 1. */
export type Screen = StepId | "match" | "confirm" | "offline";

export const STEP_LABELS: Record<StepId, string> = {
  who: "Who",
  what: "What they need",
  details: "Details",
  review: "Review",
};

/** Philippine mobile numbers are 10 digits after the +63 the design locks in. */
export const MOBILE_DIGITS = 10;

export interface Draft {
  /** Digits only, at most 10 — the +63 is chrome, never part of the value. */
  mobile: string;
  /** Set when step 1 matched an existing record and the operator confirmed it. */
  contactId: string | null;
  name: string;
  company: string;
  email: string;
  notes: string;
  productId: string | null;
  category: string | null;
  consent: boolean;
  marketing: boolean;
}

export const EMPTY_DRAFT: Draft = {
  mobile: "",
  contactId: null,
  name: "",
  company: "",
  email: "",
  notes: "",
  productId: null,
  category: null,
  consent: false,
  marketing: false,
};

/** Groups the ten national digits as the operator types. */
export function formatMobile(digits: string): string {
  const d = digitsOnly(digits);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(" ");
}

/**
 * The ten national digits, whatever form the number arrived in.
 *
 * Every Philippine mobile number is 9XXXXXXXXX nationally, so the field holds
 * nothing that does not start with a 9. That one rule does all the work: the
 * "+63" a card is printed with, the trunk "0" a customer reads aloud, and a
 * stray keypress before the number begins are all leading non-9 digits, and all
 * fall away the same way. What is left is the number itself.
 *
 * Deliberately a mask on the way in, not a rejection afterwards: an operator is
 * typing while a customer talks, and a field that quietly refuses the first
 * character teaches faster than an error message under the button. The +63
 * beside the field is chrome and never part of the value.
 *
 * This shapes what is typed; the demo simulator applies its own demo checks.
 */
export function digitsOnly(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  const start = digits.indexOf("9");
  // No 9 at all: nothing here is the start of a mobile number yet.
  return start === -1 ? "" : digits.slice(start, start + MOBILE_DIGITS);
}

/** The phone value submitted to the browser-local demo simulator. */
export function e164(digits: string): string {
  return `+63${digitsOnly(digits)}`;
}

/** The search term for the step-1 lookup. Contacts are matched on `phone`,
 *  which is stored however whoever typed it chose to — so the bare digits are
 *  a worse query than the grouped form only when the stored value is grouped.
 *  The digits are used: they are the one form every variant contains. */
export function lookupQuery(digits: string): string {
  return digitsOnly(digits);
}

export function splitName(full: string): { first_name: string; last_name: string | null } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "", last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

const EMAIL_RE = /^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/;

export function emailLooksValid(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function missingFields(draft: Draft): string[] {
  const missing: string[] = [];
  if (!draft.name.trim()) missing.push("name");
  // Two different gaps: nothing typed, and something typed that is not an
  // address. The second used to pass here and fail at Submit, with the customer
  // still standing at the counter.
  if (draft.contactId !== null) {
    // Matched record: nothing to validate — see above.
  } else if (!draft.email.trim()) missing.push("email");
  else if (!emailLooksValid(draft.email)) missing.push("a valid email");
  if (digitsOnly(draft.mobile).length !== MOBILE_DIGITS) missing.push("10-digit mobile");
  if (!draft.productId) missing.push("what they need");
  if (!draft.consent) missing.push("consent");
  return missing;
}

export function canReview(draft: Draft): boolean {
  return missingFields(draft).length === 0;
}

export function missingHint(draft: Draft): string {
  const missing = missingFields(draft);
  return missing.length === 0 ? "" : `Still needed: ${missing.join(", ")}.`;
}

/** Categories in the design's order; anything the catalogue adds later follows. */
const CATEGORY_ORDER = ["Strategy & advisory", "Systems & analytics", "Training & support"];

export function categoriesOf(products: Product[]): string[] {
  const found = [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))];
  return found.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function rateLabel(product: Product): string {
  if (product.default_price === null) return "Rate on request";
  const amount = Number(product.default_price);
  if (Number.isNaN(amount)) return "Rate on request";
  const figure = `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return product.price_unit ? `${figure} / ${product.price_unit}` : figure;
}

/** The review-screen summary; the demo simulator stores its own fixed consent label. */
export function consentSummary(draft: Draft): string {
  if (!draft.consent) return "Not given";
  return `Data processing agreed · ${draft.marketing ? "marketing opted in" : "no marketing"}`;
}
