"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getContact, type ContactDetail } from "@/lib/api";

export type ContactState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ok"; contact: ContactDetail };

// Fetches one contact and reduces it to the  states (loading / server-error /
// 404 / success). `reload` re-runs the fetch (used after archive/restore).
export function useContact(id: string): {
  state: ContactState;
  reload: () => void;
} {
  const [state, setState] = useState<ContactState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    getContact(id, controller.signal)
      .then((contact) => setState({ status: "ok", contact }))
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
