export const INVALID_EXTERNAL_URL_MESSAGE = "Enter a valid http:// or https:// web address.";

const WEB_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const input = value.trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    if (!WEB_PROTOCOLS.has(url.protocol) || !url.hostname || url.username || url.password) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
