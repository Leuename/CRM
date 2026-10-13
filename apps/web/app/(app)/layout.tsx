import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { BackOfficeGuard } from "@/components/BackOfficeGuard";

// Everything under this group requires a session. AuthProvider gates on
// GET /auth/me and redirects to /login on 401 before any page renders.
// BackOfficeGuard then sends an OPERATIONS session on to /kiosk — its own shell,
// in app/kiosk/layout.tsx, does the mirror for everyone else.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BackOfficeGuard>
        <AppShell>{children}</AppShell>
      </BackOfficeGuard>
    </AuthProvider>
  );
}
