"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CompanyForm } from "@/components/CompanyForm";
import { useCompany } from "@/components/useCompany";
import { Button, EmptyState } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

export default function EditCompanyPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useCompany(id);

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/customers/companies/${id}`}
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to company
        </Link>
        <h1
          style={{
            font: "700 22px/32px var(--font-ui)",
            margin: "8px 0 0",
            color: "var(--text-primary)",
          }}
        >
          Edit company
        </h1>
      </div>

      {state.status === "loading" ? (
        <DetailSkeleton label="Loading company" />
      ) : state.status === "notfound" ? (
        <EmptyState
          icon="las la-building"
          title="Company not found"
          body="This company may have been removed."
          action={
            <Link href="/customers/companies">
              <Button>Back to companies</Button>
            </Link>
          }
        />
      ) : state.status === "error" ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Company could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : (
        <CompanyForm initial={state.company} />
      )}
    </div>
  );
}
