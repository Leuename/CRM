"use client";

import Link from "next/link";
import { OpportunityForm } from "@/components/opportunity-form";
import { OpportunityFormHeader } from "@/components/opportunity-form/PageHeader";

export default function NewOpportunityPage() {
  return (
    <div style={{ paddingTop: 28 }}>
      <OpportunityFormHeader
        crumb="New opportunity"
        title="New opportunity"
        titleLevel={2}
        subtitle="Capture key details to start tracking this opportunity."
        back={
          <Link href="/sales/opportunities" className="opp-page-back">
            <i className="las la-arrow-left" aria-hidden="true" />
            Back to opportunities
          </Link>
        }
      />
      <OpportunityForm />
    </div>
  );
}
