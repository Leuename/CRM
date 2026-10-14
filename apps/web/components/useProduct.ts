"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getProduct, type Product } from "@/lib/api";

export type ProductState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ok"; product: Product };

// Fetches one product and reduces it to the  states (loading / server-error /
// 404 / success). `reload` re-runs the fetch.
export function useProduct(id: string): {
  state: ProductState;
  reload: () => void;
} {
  const [state, setState] = useState<ProductState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    getProduct(id, controller.signal)
      .then((product) => setState({ status: "ok", product }))
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
