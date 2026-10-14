"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createPipelineStage,
  updatePipelineStage,
  type PipelineStage,
  type PipelineStageInput,
} from "@/lib/api";
import { Button, Card, Input, Switch } from "@/lib/ds";
import { Select } from "@/components/Select";

// The 8 palette tokens stageTone() maps (lib/opportunities.ts). color is a
// closed Select over these, NOT free text, so board dots never drift to an
// unknown token that falls back to grey.
const COLORS = ["slate", "cyan", "orange", "yellow", "purple", "blue", "indigo", "red"] as const;

const SEMANTIC_TYPES = ["ACTIVE", "WON", "LOST"] as const;

// probability stays a STRING end-to-end (no Number/parseFloat). This regex is a
// pure display-side 0..100 guard (up to 2 decimals) — the server re-validates
// the Decimal and is the authority.
const PROBABILITY_RE = /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/;
// sort_order is a plain integer (not money/probability) — parsed to a number.
const SORT_ORDER_RE = /^\d+$/;

// Fields with an Input hint slot below them. A 422 keyed to any OTHER field
// (active, semantic_type — the stage-guard refusals) has nowhere to render as a
// field error: Switch and Select carry no hint. Those surface in the form-level
// alert banner instead, so a refused save is never a silent no-op.
const HINTED_FIELDS = new Set(["name", "probability", "sort_order"]);

export function StageForm({ initial }: { initial?: PipelineStage }) {
  const router = useRouter();
  const isEdit = initial !== undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [semanticType, setSemanticType] = useState(initial?.semantic_type ?? "ACTIVE");
  // Raw strings the user typed — no numeric coercion for probability.
  const [probability, setProbability] = useState(
    // configure_pipeline, which only ADMIN holds — and ADMIN is served the value.
    initial?.probability != null ? String(initial.probability) : "",
  );
  const [sortOrder, setSortOrder] = useState(initial ? String(initial.sort_order) : "");
  const [color, setColor] = useState(
    initial?.color === "green" ? "blue" : (initial?.color ?? "slate"),
  );
  const [active, setActive] = useState(initial?.active ?? true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    const prob = probability.trim();
    if (!prob) {
      errs.probability = "Probability is required.";
    } else if (!PROBABILITY_RE.test(prob)) {
      errs.probability = "Enter a value from 0 to 100 (up to 2 decimals).";
    }
    const order = sortOrder.trim();
    if (!order) {
      errs.sort_order = "Sort order is required.";
    } else if (!SORT_ORDER_RE.test(order)) {
      errs.sort_order = "Enter a whole number (0 or greater).";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFormError(null);
      return;
    }

    const payload: PipelineStageInput = {
      name: name.trim(),
      semantic_type: semanticType,
      probability: prob, // string — never a number
      sort_order: Number(order), // plain integer, guarded above
      color,
      active,
    };

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      // id is STABLE and path-only on edit — never sent in the body.
      const saved = isEdit
        ? await updatePipelineStage(initial.id, payload)
        : await createPipelineStage(payload);
      router.push("/settings/pipeline");
      void saved;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          // Preserve the values the user typed; surface per-field messages.
          setFieldErrors(err.fields ?? {});
          const unhinted = Object.entries(err.fields ?? {})
            .filter(([key]) => !HINTED_FIELDS.has(key))
            .map(([, msg]) => msg);
          setFormError(unhinted.length > 0 ? unhinted.join(" ") : err.fields ? null : err.message);
        } else if (err.status === 403) {
          setFormError(
            "You are not permitted to configure pipeline stages. Ask an administrator to make this change.",
          );
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(err instanceof Error ? err.message : "Unknown error");
      }
      setSubmitting(false);
    }
  }

  const inputWide = { width: "100%" } as const;

  return (
    // Full width, matching the opportunity form's fix: .opp-form-grid-2
    // already caps each field at 260–420px and flex-wraps, so the reclaimed
    // width goes into more fields per row, not stretched inputs.
    <Card style={{ width: "100%" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {formError && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(196,86,78,0.10)",
              color: "var(--secondary-red)",
              font: "400 14px/21px var(--font-ui)",
            }}
          >
            {formError}
          </div>
        )}

        <div className="opp-form-grid-2">
          <Input
            label="Name"
            aria-label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            state={fieldErrors.name ? "error" : "default"}
            hint={fieldErrors.name}
            style={inputWide}
          />
          <Select label="Semantic type" value={semanticType} onChange={setSemanticType}>
            {SEMANTIC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Probability (%)"
            aria-label="Probability"
            inputMode="decimal"
            placeholder="0"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            state={fieldErrors.probability ? "error" : "default"}
            hint={fieldErrors.probability}
            style={inputWide}
          />
          <Input
            label="Sort order"
            aria-label="Sort order"
            inputMode="numeric"
            placeholder="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            state={fieldErrors.sort_order ? "error" : "default"}
            hint={fieldErrors.sort_order}
            style={inputWide}
          />
          <Select label="Colour" value={color ?? "slate"} onChange={setColor}>
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ marginTop: 28 }}>
          <Switch
            label="Active"
            checked={active}
            state={fieldErrors.active ? "error" : "default"}
            onChange={(e) => setActive(e.target.checked)}
          />
          <div
            style={{
              marginTop: 6,
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            Inactive stages are hidden from the board but keep their id and history. Deactivate
            rather than delete so opportunities and stage history stay intact.
          </div>
        </div>

        <div style={{ display: "flex", gap: 9, marginTop: 28 }}>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add stage"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => router.push("/settings/pipeline")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
