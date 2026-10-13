"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getCompany, type CompanyDetail } from "@/lib/api";

export type CompanyState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ok"; company: CompanyDetail };

// Fetches one company and reduces it to the  states (loading / server-error /
// 404 / success). `reload` re-runs the fetch (used after archive/restore).
export function useCompany(id: string): {
  state: CompanyState;
  reload: () => void;
} {
  const [state, setState] = useState<CompanyState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    getCompany(id, controller.signal)
      .then((company) => setState({ status: "ok", company }))
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
