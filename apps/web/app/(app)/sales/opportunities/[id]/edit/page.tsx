"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OpportunityForm } from "@/components/opportunity-form";
import { OpportunityFormHeader } from "@/components/opportunity-form/PageHeader";
import { useOpportunity } from "@/components/useOpportunity";
import { Button, EmptyState } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

export default function EditOpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useOpportunity(id);

  return (
    <div style={{ paddingTop: 28 }}>
      <OpportunityFormHeader
        crumb="Edit opportunity"
        title="Edit opportunity"
        subtitle="Update the details of this opportunity."
        back={
          <Link href={`/sales/opportunities/${id}`} className="opp-page-back">
            <i className="las la-arrow-left" aria-hidden="true" />
            Back to opportunity
          </Link>
        }
      />

      {state.status === "loading" ? (
        <DetailSkeleton label="Loading opportunity" />
      ) : state.status === "notfound" ? (
        <EmptyState
          icon="las la-briefcase"
          title="Opportunity not found"
          body="This opportunity may have been removed."
          action={
            <Link href="/sales/opportunities">
              <Button>Back to opportunities</Button>
            </Link>
          }
        />
      ) : state.status === "error" ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Opportunity could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : (
        <OpportunityForm initial={state.opportunity} />
      )}
    </div>
  );
}
