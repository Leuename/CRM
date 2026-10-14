// Inline SVG, `currentColor`, no icon font and no CDN — the same rule
// components/Icon.tsx follows (the Line Awesome font the DS assumes does not
// load here). The four tile glyphs are ports of the prototype's `icon(kind)`
// method in front-desk concept; the rest are the small
// chrome glyphs used by the header and the search fields.
//
// Every icon is aria-hidden: each one sits next to its own visible label or
// inside a button that carries an accessible name.

type Props = { className?: string };

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function InquiryGlyph() {
  return (
    <Tile>
      <path
        d="M10 4h16l10 10v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 0-4z"
        fill="currentColor"
      />
      <path d="M26 4l10 10H26z" fill="#fff" opacity=".45" />
      <circle cx="35" cy="35" r="10" fill="currentColor" stroke="#fff" strokeWidth="3" />
      <path d="M35 30v10M30 35h10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </Tile>
  );
}

export function CustomerGlyph() {
  return (
    <Tile>
      <circle cx="20" cy="14" r="8" fill="currentColor" />
      <path d="M6 40c0-8 6.5-13 14-13 3 0 5.7.8 8 2.2A12 12 0 0 0 26 40z" fill="currentColor" />
      <circle cx="33" cy="31" r="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M39 37l6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </Tile>
  );
}

export function FolderGlyph() {
  return (
    <Tile>
      <path
        d="M4 12a4 4 0 0 1 4-4h9l4 5h13a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"
        fill="currentColor"
      />
      <circle cx="26" cy="27" r="8" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M32 33l6 6" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </Tile>
  );
}

export function CalendarGlyph() {
  return (
    <Tile>
      <path d="M8 8h32a3 3 0 0 1 3 3v8H5v-8a3 3 0 0 1 3-3z" fill="currentColor" />
      <path d="M14 4v8M34 4v8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M5 22h38v16a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="currentColor" />
      <circle cx="35" cy="34" r="10" fill="currentColor" stroke="#fff" strokeWidth="3" />
      <path d="M35 29v5.5l4 2.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </Tile>
  );
}

export function ChevronRight({ size = 22, width = 2.4 }: { size?: number; width?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeft() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronDown() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SearchGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  );
}

export function ShieldGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2l8 3v6c0 5.2-3.4 9.4-8 11-4.6-1.6-8-5.8-8-11V5l8-3zm-1.2 13.2l5-5-1.6-1.6-3.4 3.4-1.6-1.6L7.6 12l3.2 3.2z" />
    </svg>
  );
}

export function ClockGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function SignOutGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    </svg>
  );
}

/** Compact Aster mark used in the front-desk header. */
export function BrandMark({ className }: Props) {
  return (
    <svg viewBox="0 0 36 36" className={className} role="img" aria-label="Aster Advisory">
      <path
        d="M18 1.5c9.1 0 16.5 7.4 16.5 16.5S27.1 34.5 18 34.5 1.5 27.1 1.5 18 8.9 1.5 18 1.5Z"
        fill="#fff"
        fillRule="nonzero"
      />
      <path
        d="M10.5 24.5 18 10l7.5 14.5M13.2 19.7h9.6"
        fill="none"
        stroke="var(--primary-dark)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Wizard glyphs. Same rules as the rest of this file: inline paths, currentColor,
   no icon font — the design system's Line Awesome CDN font does not load here. */

export function WarningGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2l10 18H2L12 2zm-1 6v6h2V8h-2zm0 8v2h2v-2h-2z" />
    </svg>
  );
}

export function CheckGlyph({ size = 52 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function OfflineGlyph() {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a9 9 0 0 1 4-2.3M19 13a9 9 0 0 0-6-2.9M2 9.5A14 14 0 0 1 12 6c1.2 0 2.3.1 3.4.4" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}

/* The four catalogue-category glyphs, ported from the design's own icon(kind)
   (front-desk concept): 48x48 viewBox, filled, currentColor.
   Matched to the category by name, because that is what the products table
   carries — a category the catalogue grows later renders the generic mark. */

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function CategoryGlyph({ category }: { category: string }) {
  const kind = category.toLowerCase();

  if (kind.includes("strategy")) {
    return (
      <Glyph>
        <path d="M10 6h22l6 6v30H10z" fill="currentColor" />
        <path d="M17 20h14M17 27h14M17 34h9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </Glyph>
    );
  }
  if (kind.includes("system") || kind.includes("analytics")) {
    return (
      <Glyph>
        <path
          d="m11 33 10-11 8 6 9-13"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="33" r="4" fill="currentColor" />
        <circle cx="21" cy="22" r="4" fill="currentColor" />
        <circle cx="29" cy="28" r="4" fill="currentColor" />
        <circle cx="38" cy="15" r="4" fill="currentColor" />
      </Glyph>
    );
  }
  if (kind.includes("training") || kind.includes("support")) {
    return (
      <Glyph>
        <path d="M6 11h36v25H6z" fill="currentColor" />
        <path
          d="M18 42h12M24 36v6M16 20h16M16 27h10"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Glyph>
    );
  }
  return (
    <Glyph>
      <path d="M6 10h36v10H6z" fill="currentColor" />
      <path d="M6 24h36v14H6z" fill="currentColor" />
      <circle cx="24" cy="31" r="4" fill="#fff" />
    </Glyph>
  );
}
