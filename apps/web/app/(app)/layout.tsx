import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { BackOfficeGuard } from "@/components/BackOfficeGuard";

// Demo navigation for this route group uses the simulated session from
// AuthProvider. BackOfficeGuard sends an OPERATIONS demo user to /kiosk; the
// kiosk shell redirects other demo roles. These client-side checks are not
// production authentication or authorization.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BackOfficeGuard>
        <AppShell>{children}</AppShell>
      </BackOfficeGuard>
    </AuthProvider>
  );
}
