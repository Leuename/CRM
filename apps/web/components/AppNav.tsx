"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { useAuth } from "@/components/AuthProvider";

// The application navigation uses local SVG icons and keeps its links keyboard reachable.
// Categories group links while preserving the compact layout on narrow screens.
// `adminOnly` hides a link; route authorization remains the server's responsibility.
export type NavItem = {
  value: string;
  label: string;
  icon: IconName;
  href: string;
  adminOnly?: boolean;
};
export type NavCategory = { label: string; items: NavItem[] };
type NavEntry = NavItem | NavCategory;

const isCategory = (e: NavEntry): e is NavCategory => "items" in e;

const NAV: NavEntry[] = [
  {
    value: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    href: "/dashboard",
  },
  {
    label: "Sales",
    items: [
      {
        value: "opportunities",
        label: "Opportunities",
        icon: "opportunities",
        href: "/sales/opportunities",
      },
      {
        value: "pipeline",
        label: "Pipeline",
        icon: "pipeline",
        href: "/pipeline",
      },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        value: "individuals",
        label: "Individuals",
        icon: "contacts",
        href: "/customers/individuals",
      },
      {
        value: "companies",
        label: "Companies",
        icon: "companies",
        href: "/customers/companies",
      },
      // The catalog is readable by all signed-in roles; write controls are Admin-only.
      {
        value: "products",
        label: "Products",
        icon: "products",
        href: "/customers/products",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      // General settings include sales-representative management.
      {
        value: "settings-general",
        label: "General",
        icon: "settings",
        href: "/settings/general",
      },
      {
        value: "settings-pipeline",
        label: "Pipeline stages",
        icon: "settings",
        href: "/settings/pipeline",
      },
      {
        value: "activities",
        label: "Activities",
        icon: "activities",
        href: "/settings/activities",
      },
      // The audit log is available to administrators.
      {
        value: "audit",
        label: "Audit log",
        icon: "audit",
        href: "/settings/audit",
        adminOnly: true,
      },
    ],
  },
];

export function useNavItems(): {
  entries: NavEntry[];
  active: NavItem | undefined;
} {
  const pathname = usePathname();
  const { user } = useAuth();
  const entries = useMemo(() => {
    const visible = (i: NavItem) => !i.adminOnly || user.role === "ADMIN";
    return NAV.flatMap<NavEntry>((e) =>
      isCategory(e) ? [{ ...e, items: e.items.filter(visible) }] : visible(e) ? [e] : [],
    );
  }, [user.role]);
  // Route prefixes keep nested pages attached to their parent navigation item.
  const active = entries
    .flatMap((e) => (isCategory(e) ? e.items : [e]))
    .find((i) => pathname.startsWith(i.href));
  return { entries, active };
}

export function AppNav() {
  const { entries, active } = useNavItems();
  return (
    <nav className="app-nav" aria-label="Main">
      <Link href="/dashboard" className="app-nav-brand" aria-label="Aster dashboard">
        <span className="app-nav-mark" aria-hidden="true">
          A
        </span>
        <span className="app-nav-word">Aster</span>
      </Link>
      <ul className="app-nav-list">
        {entries.map((entry) =>
          isCategory(entry) ? (
            <li key={entry.label} className="app-nav-group">
              {/* The sublist carries the category name for assistive tech, so the
                  visible label is decorative — and can hide on the collapsed rail
                  without taking the group's accessible name with it. */}
              <span
                className={`app-nav-cat${entry.items.some((i) => i.value === active?.value) ? " is-active" : ""}`}
                aria-hidden="true"
              >
                {entry.label}
              </span>
              <ul className="app-nav-sublist" aria-label={entry.label}>
                {entry.items.map((item) => (
                  <NavLink key={item.value} item={item} active={active} />
                ))}
              </ul>
            </li>
          ) : (
            <NavLink key={entry.value} item={entry} active={active} />
          ),
        )}
      </ul>
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: NavItem | undefined }) {
  return (
    <li>
      <Link
        href={item.href}
        className="app-nav-item"
        // aria-label carries the name when the collapsed rail hides the visible
        // label below 1024px; it is the same string either way.
        aria-label={item.label}
        aria-current={item.value === active?.value ? "page" : undefined}
      >
        <Icon name={item.icon} size={18} />
        <span className="app-nav-label">{item.label}</span>
      </Link>
    </li>
  );
}
