"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getMe, logout, type User } from "@/lib/api";

interface AuthContextValue {
  user: User;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// Client guard for the authenticated app. Calls GET /auth/me once: 401 sends
// the visitor to /login, any other failure shows a reachable error, success
// exposes { user, signOut }. The server owns capabilities — this only gates
// "is there a session".
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<{ user: User } | { error: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMe(controller.signal)
      .then((user) => setState({ user }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return; // hold the loading state while navigating away
        }
        setState({
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [router]);

  const signOut = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [router]);

  if (state === null) return <FullScreen role="status">Loading</FullScreen>;
  if ("error" in state) {
    return <FullScreen role="alert">Could not reach the server. {state.error}</FullScreen>;
  }

  return (
    <AuthContext.Provider value={{ user: state.user, signOut }}>{children}</AuthContext.Provider>
  );
}

function FullScreen({ role, children }: { role: string; children: React.ReactNode }) {
  return (
    <div
      role={role}
      aria-live="polite"
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
      }}
    >
      {children}
    </div>
  );
}
