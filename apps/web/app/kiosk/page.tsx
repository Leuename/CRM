"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useKioskChrome } from "./KioskShell";
import {
  CalendarGlyph,
  ChevronRight,
  ClockGlyph,
  CustomerGlyph,
  FolderGlyph,
  InquiryGlyph,
  ShieldGlyph,
} from "./KioskIcons";

// Home. The design ships two alternates (search-first, split) explicitly labelled
// as alternates of this same resting state — only the primary 2x2 is built.
const TILES = [
  {
    href: "/kiosk/new-inquiry",
    label: "New inquiry",
    desc: "Create an inquiry for a scheduled consultation or new service request.",
    glyph: <InquiryGlyph />,
  },
  {
    href: "/kiosk/customers",
    label: "Find customer",
    desc: "Search for an existing customer using name, phone, or email.",
    glyph: <CustomerGlyph />,
  },
  {
    href: "/kiosk/inquiries",
    label: "Find inquiry",
    desc: "Look up a previous inquiry using customer details or reference.",
    glyph: <FolderGlyph />,
  },
  {
    href: "/kiosk/visits",
    label: "Today's appointments",
    desc: "View consultations and appointments scheduled for today.",
    glyph: <CalendarGlyph />,
  },
];

export default function KioskHome() {
  useKioskChrome("", "");

  return (
    <div className="k-screen k-home">
      <nav className="k-tiles" aria-label="Front desk">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="k-tile">
            <span className="k-tile-icon" aria-hidden="true">
              {t.glyph}
            </span>
            <span className="k-tile-text">
              <span className="k-tile-label">{t.label}</span>
              <span className="k-tile-desc">{t.desc}</span>
            </span>
            <span className="k-tile-go" aria-hidden="true">
              <ChevronRight size={24} />
            </span>
          </Link>
        ))}
      </nav>
      <DateStrip />
    </div>
  );
}

// Rendered only after mount: the server has no idea what time it is at the front
// desk, and printing its guess first would hydrate into a mismatch.
function DateStrip() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="k-datestrip">
      <span className="k-datestrip-mark" aria-hidden="true">
        <ShieldGlyph />
      </span>
      <span aria-hidden="true" style={{ display: "flex", color: "var(--k-muted)" }}>
        <ClockGlyph />
      </span>
      {now && (
        <>
          <span>
            {now.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="k-dot-sep">•</span>
          <span>
            {now.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </>
      )}
    </div>
  );
}
