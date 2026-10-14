"use client";

import type { PipelineStage } from "@/lib/api";
import { Input, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";
import { ReadOnlyField, Section } from "./ui";
import { inputWide } from "./shared";

// Mirrors opportunities._initial_stage — lowest sort_order among ACTIVE-typed
// active stages — because the API has no is_default flag to read and no
// endpoint that answers "where will this deal start?". Display only: the server
// still decides, and this is a preview of its decision, never an input to it.
function initialStage(stages: PipelineStage[]): PipelineStage | undefined {
  return stages
    .filter((s) => s.active && s.semantic_type === "ACTIVE")
    .sort((a, b) => a.sort_order - b.sort_order)[0];
}

export function SectionSalesStatus({
  isEdit,
  stages,
  currentStageId,
  currentStageName,
  stageId,
  setStageId,
  stageReason,
  setStageReason,
}: {
  isEdit: boolean;
  stages: PipelineStage[] | null;
  currentStageId: string | null;
  currentStageName: string | null;
  stageId: string;
  setStageId: (v: string) => void;
  stageReason: string;
  setStageReason: (v: string) => void;
}) {
  // A deactivated stage that this deal is already sitting in stays offered, or
  // the picker would show a blank box and the first save would look like a move

  const options = (stages ?? []).filter((s) => s.active || s.id === currentStageId);
  const moving = isEdit && stageId !== "" && stageId !== currentStageId;

  if (!isEdit) {
    const start = stages ? initialStage(stages) : undefined;
    return (
      <Section index={4} title="Sales status" subtitle="Current stage of this opportunity.">
        <div className="opp-form-grid-2">
          <ReadOnlyField
            label="Stage"
            value={
              stages === null ? (
                "Loading…"
              ) : (
                <Tag tone="blue">{start ? start.name : "First active stage"}</Tag>
              )
            }
            note="A new deal starts here. Move it from the opportunity page once it exists."
          />
        </div>
      </Section>
    );
  }

  return (
    <Section index={4} title="Sales status" subtitle="Current stage of this opportunity.">
      <div className="opp-form-grid-2">
        <Select label="Stage" value={stageId} onChange={setStageId} disabled={stages === null}>
          {stages === null && <option value="">Loading…</option>}
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.active ? "" : " (inactive)"}
            </option>
          ))}
        </Select>
        {moving && (
          <Input
            label="Reason (optional)"
            aria-label="Stage change reason"
            value={stageReason}
            onChange={(e) => setStageReason(e.target.value)}
            hint="Recorded in this deal's stage history."
            style={inputWide}
          />
        )}
      </div>
      {moving && (
        <p className="opp-form-note">
          {/* Honest about the shape of the write. A stage change cannot ride
              along inside the details save: transitions go only through
              POST /{id}/stage, which is what appends the history row and snaps
              the probability. So this saves as two steps, and the second one
              can fail on its own. */}
          Moving {currentStageName ?? "this deal"} → {options.find((s) => s.id === stageId)?.name}.
          Saved as a separate step, so it is recorded in the stage history.
        </p>
      )}
    </Section>
  );
}
