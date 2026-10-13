"use client";

import Link from "next/link";

// The content header of visual reference: breadcrumb + back link on
// one row, then the h1 and its subtitle. The TopBar already says
// "Opportunities", so this h1 names the task rather than repeating the section
// (global-constraints §"Do not duplicate the page h1").
export function OpportunityFormHeader({
  crumb,
  title,
  subtitle,
  back,
}: {
  crumb: string;
  title: string;
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
      <h1 className="opp-page-title">{title}</h1>
      <p className="opp-page-sub">{subtitle}</p>
    </header>
  );
}
