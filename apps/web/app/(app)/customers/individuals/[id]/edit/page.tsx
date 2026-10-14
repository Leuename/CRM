"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { useContact } from "@/components/useContact";
import { Button, EmptyState } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useContact(id);

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/customers/individuals/${id}`}
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to individual
        </Link>
        <h1
          style={{
            font: "700 22px/32px var(--font-ui)",
            margin: "8px 0 0",
            color: "var(--text-primary)",
          }}
        >
          Edit individual
        </h1>
      </div>

      {state.status === "loading" ? (
        <DetailSkeleton label="Loading individual" />
      ) : state.status === "notfound" ? (
        <EmptyState
          icon="las la-user-slash"
          title="Individual not found"
          body="This individual may have been removed."
          action={
            <Link href="/customers/individuals">
              <Button>Back to individuals</Button>
            </Link>
          }
        />
      ) : state.status === "error" ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Individual could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : (
        <ContactForm initial={state.contact} />
      )}
    </div>
  );
}
