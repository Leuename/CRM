"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getOpportunity, type OpportunityDetail } from "@/lib/api";

export type OpportunityState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ok"; opportunity: OpportunityDetail };

// Fetches one opportunity and reduces it to the  states (loading /
// server-error / 404 / success). `reload` re-runs the fetch (used after
// stage change, archive/restore, edit).
export function useOpportunity(id: string): {
  state: OpportunityState;
  reload: () => void;
} {
  const [state, setState] = useState<OpportunityState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    getOpportunity(id, controller.signal)
      .then((opportunity) => setState({ status: "ok", opportunity }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: "notfound" });
        } else {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });
    return () => controller.abort();
  }, [id, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { state, reload };
}
