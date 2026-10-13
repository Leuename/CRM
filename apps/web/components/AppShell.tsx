"use client";

import { Avatar, Button, TopBar } from "@/lib/ds";
import { AppNav, useNavItems } from "@/components/AppNav";
import { useAuth } from "@/components/AuthProvider";

// The application shell pairs the navigation with the shared page header.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { active } = useNavItems();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <a className="app-skip-link" href="#app-main">
        Skip to main content
      </a>
      <AppNav />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <TopBar
            className="app-topbar"
            title={active?.label ?? "Aster CRM"}
            actions={[]}
            style={{ flex: 1, minWidth: 0 }}
          />
          <UserMenu />
        </div>
        {/* key on the route makes the entrance animation replay per navigation. */}
        <main
          key={active?.value ?? "app"}
          id="app-main"
          tabIndex={-1}
          className="app-main"
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "0 28px 28px",
          }}
        >
          <div className="demo-safety-notice" role="note">
            <strong>Demo only.</strong> Do not enter real customer data. Changes stay in this
            browser tab, clear when you sign out or close it, and are not sent to a real CRM.
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  return (
    <div
      className="app-usermenu"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 28px 0 8px",
        flexShrink: 0,
      }}
    >
      <Avatar name={user.display_name} size={38} />
      <span
        className="app-username"
        style={{
          font: "700 14px/21px var(--font-ui)",
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        {user.display_name}
      </span>
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
