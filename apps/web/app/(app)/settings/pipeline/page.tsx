"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listPipelineStages, type PipelineStage } from "@/lib/api";
import { Button, Card, DataTable, EmptyState, Tag } from "@/lib/ds";
import { useAuth } from "@/components/AuthProvider";
import { semanticTone, stageTone } from "@/lib/opportunities";
import { TableSkeleton } from "@/components/Skeleton";

// CONVENIENCE-HIDE ONLY — NOT a security boundary.  configure_pipeline is

// viewers; the server still enforces 403 on POST/PATCH regardless of the browser.
function canConfigurePipeline(role: string): boolean {
  return role === "ADMIN";
}

export default function PipelineSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canConfigure = canConfigurePipeline(user.role);

  const [stages, setStages] = useState<PipelineStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStages(null);
    setError(null);
    listPipelineStages(controller.signal)
      .then(setStages)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // ALL stages, active and inactive, in sort_order (the config view, unlike the
  // board which shows active only).
  const sorted = useMemo(
    () => (stages ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    [stages],
  );

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/pipeline"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to pipeline
        </Link>
      </div>
      <Card
        title={stages ? `Pipeline stages · ${stages.length}` : "Pipeline stages"}
        action={
          canConfigure ? (
            <Button
              icon="las la-plus"
              size="sm"
              onClick={() => router.push("/settings/pipeline/new")}
            >
              Add stage
            </Button>
          ) : undefined
        }
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {error !== null ? (
          <EmptyState
            icon="las la-exclamation-circle"
            title="Pipeline stages could not be loaded"
            body={`${error}. Check that the API is running, then try again.`}
            action={<Button onClick={retry}>Try again</Button>}
          />
        ) : stages === null ? (
          <TableSkeleton label="Loading pipeline stages" />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon="las la-stream"
            title="No pipeline stages yet"
            body={
              canConfigure
                ? "Add a stage so opportunities have somewhere to live."
                : "No pipeline stages have been configured yet. Ask an administrator to add them."
            }
            action={
              canConfigure ? (
                <Button onClick={() => router.push("/settings/pipeline/new")}>Add stage</Button>
              ) : undefined
            }
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <DataTable
              className="crm-table"
              rows={sorted}
              onRowClick={
                canConfigure
                  ? (r: PipelineStage) => router.push(`/settings/pipeline/${r.id}/edit`)
                  : undefined
              }
              columns={[
                {
                  key: "sort_order",
                  header: "Order",
                  render: (r: PipelineStage) => r.sort_order,
                },
                {
                  key: "name",
                  header: "Name",
                  render: (r: PipelineStage) => (
                    <Tag tone={stageTone(r.color)} dot>
                      {r.name}
                    </Tag>
                  ),
                },
                {
                  key: "semantic_type",
                  header: "Semantic type",
                  render: (r: PipelineStage) => (
                    <Tag tone={semanticTone(r.semantic_type)}>{r.semantic_type}</Tag>
                  ),
                },
                {
                  key: "probability",
                  header: "Probability",
                  align: "right",
                  render: (r: PipelineStage) =>
                    r.probability === null ? "—" : `${r.probability}%`,
                },
                {
                  key: "active",
                  header: "Status",
                  render: (r: PipelineStage) => (
                    <Tag tone={r.active ? "blue" : "grey"} dot>
                      {r.active ? "Active" : "Inactive"}
                    </Tag>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Card>
    </>
  );
}
