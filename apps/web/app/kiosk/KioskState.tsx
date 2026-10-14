"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton, SrOnly } from "@/components/Skeleton";
import { ApiError } from "@/lib/api";

/* --------------------------------------------------------------------------
   The four states every kiosk screen has to show: loading, empty, failure, 403.
   The copy is front-desk voice — an operator standing with a customer needs to
   know what to say next, not what the request did.
   -------------------------------------------------------------------------- */

export function KioskLoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="k-skel-rows" role="status" aria-live="polite">
      <SrOnly>Searching</SrOnly>
      {Array.from({ length: count }, (_, i) => (
        <div className="k-skel-row" key={i}>
          <Skeleton width={62} height={62} radius={16} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton width="40%" height={18} />
            <Skeleton width="60%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KioskEmpty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="k-state">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

/**
 * A failed request, in the words the operator needs.
 *
 * Four cases, because they call for four different actions at a counter:
 * a 422 is something to correct on the form, a 403 is not the operator's to
 * retry, a 429 is worth waiting out rather than retrying now, and anything else
 * is worth trying again. Telling someone the system is unreachable when the
 * server answered clearly — and named the field — sends them to fetch the
 * service team over a typo.
 *
 * The demo simulator's response is shown here. This component only presents
 * its validation and role messages; those checks are not production security.
 */
export function KioskError({ error }: { error: unknown }) {
  const api = error instanceof ApiError ? error : null;
  const detail = api?.message ?? (error instanceof Error ? error.message : "Unknown error");

  // `fields` is already one displayable string per field — toApiError coerces
  // the simulator's arrays at parse time. It prefixes some validation messages
  // with "Value error, "; that prefix is stripped for display only.
  const fieldMessages = Object.entries(api?.fields ?? {}).map(([field, message]) => ({
    field,
    message: message.replace(/^Value error,\s*/, ""),
  }));

  if (api?.status === 422) {
    return (
      <div className="k-state k-state-error" role="alert">
        <strong>Something on the form needs a second look.</strong>
        {fieldMessages.length > 0 ? (
          <ul className="k-field-errors">
            {fieldMessages.map((f) => (
              <li key={`${f.field}-${f.message}`}>{f.message}</li>
            ))}
          </ul>
        ) : (
          <>{detail}</>
        )}
      </div>
    );
  }

  if (api?.status === 403) {
    return (
      <div className="k-state k-state-error" role="alert">
        <strong>This part isn&apos;t open to the front desk account.</strong>
        {detail} This action is unavailable in the demo. Ask a demo administrator to continue.
      </div>
    );
  }

  if (api?.status === 429) {
    return (
      <div className="k-state k-state-error" role="alert">
        <strong>That&apos;s a lot of searching at once.</strong>
        Give it a moment and search again. If you need this customer now, ask the service team.
      </div>
    );
  }

  return (
    <div className="k-state k-state-error" role="alert">
      <strong>We couldn&apos;t reach the system just now.</strong>
      Please try again in a moment. If it keeps happening, tell the service team. ({detail})
    </div>
  );
}

/* --------------------------------------------------------------------------
   Debounced, self-cancelling search.
   Shared by Find customer and Find inquiry. Every keystroke aborts the request
   in flight, so a slow early query can never overwrite a fast later one.
   `run` must be stable (declare it at module scope) — it is a dependency.
   -------------------------------------------------------------------------- */

export type SearchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: unknown };

export const MIN_QUERY = 2;

export function useKioskSearch<T>(
  query: string,
  run: (q: string, signal: AbortSignal) => Promise<T>,
  delay = 250,
): SearchState<T> {
  const [state, setState] = useState<SearchState<T>>({ status: "idle" });
  const first = useRef(true);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    // No debounce on the very first run: a query restored from the URL or typed
    // before mount should not sit spinning for a quarter second.
    const wait = first.current ? 0 : delay;
    first.current = false;
    const timer = setTimeout(() => {
      run(q, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setState({ status: "ready", data });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setState({ status: "error", error });
        });
    }, wait);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, run, delay]);

  return state;
}
