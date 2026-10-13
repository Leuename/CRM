"use client";

import Link from "next/link";
import { StageForm } from "@/components/StageForm";

export default function NewPipelineStagePage() {
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
          Add pipeline stage
        </h1>
      </div>
      <StageForm />
    </div>
  );
}
