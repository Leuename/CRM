export function maskPhone(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "—";
  // Already masked (by the server, for a session without view_contact_pii).
  // Re-masking would slide the window and print a different number of digits.
  if (s.includes("•")) return s;
  const digits = s.replace(/\D/g, "");
  // Four digits or fewer is all tail: keeping it would print the whole number.
  if (digits.length <= 4) return s.replace(/\d/g, "•");
  const tailFrom = digits.length - 4;
  let i = 0;
  return s.replace(/\d/g, (d) => (i++ >= tailFrom ? d : "•"));
}

/** `avery.sample@aster.example` -> `a••••@aster.example`. The dot count is fixed
 *  so the mask does not leak the local part's length. */
export function maskEmail(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "—";
  if (s.includes("•")) return s; // already masked by the server — see maskPhone
  const at = s.lastIndexOf("@");
  // No local part to keep (no "@", or "@example.com") — mask the whole thing.
  if (at <= 0) return "•••••";
  return `${s[0]}••••${s.slice(at)}`;
}

/** Avatar initials for the kiosk's large touch rows. At most two letters. */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
