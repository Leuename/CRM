"use client";

import { useCallback, useEffect, useState } from "react";
import { listPipelineStages, type PipelineStage } from "@/lib/api";

export type PipelineStageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ok"; stage: PipelineStage };

// There is no single-stage GET in the contract ( lists only the list read
// plus POST/PATCH), so edit resolves one stage out of listPipelineStages() —
// which already returns ALL stages, active and inactive. Reduced to the same
//  states as useProduct. `reload` re-runs the fetch.
export function usePipelineStage(id: string): {
  state: PipelineStageState;
  reload: () => void;
} {
  const [state, setState] = useState<PipelineStageState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    listPipelineStages(controller.signal)
      .then((stages) => {
        const stage = stages.find((s) => s.id === id);
        setState(stage ? { status: "ok", stage } : { status: "notfound" });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [id, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { state, reload };
}
