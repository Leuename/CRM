"use client";

import Link from "next/link";

// Breadcrumb + back link, followed by the subpage title and subtitle. The
// TopBar is the section H1; nested opportunity routes use an H2 for their title.
export function OpportunityFormHeader({
  crumb,
  title,
  titleLevel = 1,
  subtitle,
  back,
}: {
  crumb: string;
  title: string;
  // Nested opportunity routes sit under the Opportunities TopBar heading.
  titleLevel?: 1 | 2;
  // A node, not a string: the detail page's subtitle carries contact/company links.
  subtitle: React.ReactNode;
  back: React.ReactNode;
}) {
  return (
    <header className="opp-page-head">
      <div className="opp-page-head-row">
        <nav className="opp-crumbs" aria-label="Breadcrumb">
          <Link href="/sales/opportunities">Opportunities</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{crumb}</span>
        </nav>
        {back}
      </div>
      {titleLevel === 1 ? (
        <h1 className="opp-page-title">{title}</h1>
      ) : (
        <h2 className="opp-page-title">{title}</h2>
      )}
      <p className="opp-page-sub">{subtitle}</p>
    </header>
  );
}
