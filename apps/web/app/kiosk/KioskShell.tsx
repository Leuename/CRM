"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useModalFocus } from "@/components/useModalFocus";
import { initials } from "@/lib/kiosk-mask";
import { isKioskRole } from "@/lib/kiosk-role";
import { BrandMark, ChevronDown, ChevronLeft, SignOutGlyph, WarningGlyph } from "./KioskIcons";

/* --------------------------------------------------------------------------
   Header chrome
   The header lives in the layout but its title, subtitle and back target belong
   to the screen. Each screen declares them with useKioskChrome(); that is the
   seam every kiosk route (including the wizard's per-step subtitles) uses.
   -------------------------------------------------------------------------- */

export interface KioskChrome {
  title: string;
  subtitle: string;
  /** Where the 56px back button goes. Omit on Home — it renders no back button. */
  back?: string;
}

const ChromeContext = createContext<(chrome: KioskChrome) => void>(() => {});

export function useKioskChrome(title: string, subtitle: string, back?: string): void {
  const set = useContext(ChromeContext);
  useEffect(() => {
    set({ title, subtitle, back });
  }, [set, title, subtitle, back]);
}

/* --------------------------------------------------------------------------
   Shared overlay behaviour
   Focus trap and focus restoration come from components/useModalFocus — the
   same hook the back office's modals use, not a second implementation. Escape
   and dismiss-on-outside-press are added here once, for the kiosk's two
   overlays (the account popover and the private reveal).

   `rootRef` is what "outside" is measured against: for the popover it wraps the
   trigger too, so the press that closes it is not also the press that reopens it.
   -------------------------------------------------------------------------- */

export function useOverlay(
  rootRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  useModalFocus(true, panelRef);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    function onDown(e: PointerEvent) {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [rootRef, panelRef, onClose]);
}

/* --------------------------------------------------------------------------
   Online / offline
   navigator.onLine plus the online/offline events, read through
   useSyncExternalStore so the server render and the first client render agree.
   -------------------------------------------------------------------------- */

function subscribeOnline(cb: () => void): () => void {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/* -------------------------------------------------------------------------- */

export function KioskShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [chrome, setChrome] = useState<KioskChrome>({ title: "", subtitle: "" });
  const wrongRole = !isKioskRole(user.role);

  // Mirror of the demo navigation guard in app/(app)/layout.tsx. This keeps
  // each simulated role in the intended shell; it is not a security boundary.
  useEffect(() => {
    if (wrongRole) router.replace("/dashboard");
  }, [wrongRole, router]);

  // Home is the only screen without a back button, and the only one with the brand.
  const isHome = pathname === "/kiosk";

  if (wrongRole) return null;

  return (
    <ChromeContext.Provider value={setChrome}>
      <div className="k-root">
        <div className="k-frame">
          <a className="k-skip-link" href="#kiosk-main">
            Skip to main content
          </a>
          <header className="k-header">
            {!isHome && (
              <button
                type="button"
                className="k-back"
                aria-label="Back"
                onClick={() => (chrome.back ? router.push(chrome.back) : router.back())}
              >
                <ChevronLeft />
              </button>
            )}
            {isHome && (
              <span className="k-brand">
                <BrandMark />
              </span>
            )}
            <div className="k-titles">
              <h1 className={isHome ? "sr-only" : "k-title"}>{chrome.title || "Front desk"}</h1>
              <div className="k-subtitle" aria-live="polite" aria-atomic="true">
                {chrome.subtitle}
              </div>
            </div>
            <div className="k-headtools">
              <StatusPill />
              <span className="k-sep" aria-hidden="true" />
              <UserMenu />
            </div>
          </header>
          <div className="k-demo-notice k-shell-demo-notice" role="note">
            <WarningGlyph />
            Demo only. Do not enter real customer details. Saved values become fictional samples.
            Entries stay in this tab and are not sent or followed up.
          </div>
          <main id="kiosk-main" className="k-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </ChromeContext.Provider>
  );
}

function StatusPill() {
  const online = useOnline();
  return (
    <div className="k-status" role="status" aria-live="polite">
      <span className={online ? "k-status-dot" : "k-status-dot k-off"} aria-hidden="true" />
      {online ? "Online" : "Offline"}
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const who = useMemo(() => initials(user.display_name), [user.display_name]);

  return (
    <div className="k-usermenu">
      <button
        type="button"
        className="k-user"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="k-user-initials" aria-hidden="true">
          {who}
        </span>
        <span className="k-user-name">{user.display_name}</span>
        <ChevronDown />
      </button>
      {open && <UserPopover onClose={() => setOpen(false)} onSignOut={signOut} />}
    </div>
  );
}

function UserPopover({
  onClose,
  onSignOut,
}: {
  onClose: () => void;
  onSignOut: () => Promise<void>;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  // The popover's parent .k-usermenu holds the trigger as well, so a press on
  // the trigger is "inside" and closes via the toggle rather than twice over.
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    rootRef.current = panelRef.current?.parentElement ?? null;
  }, []);
  useOverlay(rootRef, panelRef, onClose);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Account"
      tabIndex={-1}
      className="k-menu"
    >
      <button type="button" className="k-menu-item" onClick={() => void onSignOut()}>
        <SignOutGlyph />
        Sign out
      </button>
    </div>
  );
}
