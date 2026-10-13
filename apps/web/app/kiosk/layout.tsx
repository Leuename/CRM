import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { KioskShell } from "./KioskShell";
import "./kiosk.css";

// The kiosk is a second shell, parallel to app/(app)/layout.tsx and sharing only
// the session guard. It renders no AppShell and no AppNav: there is no nav rail
// and no back-office top bar on an iPad at the front desk.
export const metadata: Metadata = {
  title: "Aster front desk",
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <KioskShell>{children}</KioskShell>
    </AuthProvider>
  );
}
