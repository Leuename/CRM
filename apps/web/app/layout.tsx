import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aster CRM Demo",
  description: "A fictional, interactive CRM portfolio demo.",
};

// Root layout owns only the document shell. The authenticated chrome (nav rail,
// top bar, session guard) lives in app/(app)/layout.tsx so /login can render
// bare and outside the guard.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
