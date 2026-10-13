"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { StageForm } from "@/components/StageForm";
import { usePipelineStage } from "@/components/usePipelineStage";
import { Button, EmptyState } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

export default function EditPipelineStagePage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = usePipelineStage(id);

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/settings/pipeline"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Pipeline stages
        </Link>
        <h1
          style={{
            font: "700 22px/32px var(--font-ui)",
            margin: "8px 0 0",
            color: "var(--text-primary)",
          }}
        >
          Edit pipeline stage
        </h1>
      </div>

      {state.status === "loading" ? (
        <DetailSkeleton label="Loading pipeline stage" />
      ) : state.status === "notfound" ? (
        <EmptyState
          icon="las la-stream"
          title="Pipeline stage not found"
          body="This stage may have been removed."
          action={
            <Link href="/settings/pipeline">
              <Button>Back to pipeline stages</Button>
            </Link>
          }
        />
      ) : state.status === "error" ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Pipeline stage could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : (
        <StageForm initial={state.stage} />
      )}
    </div>
  );
}
