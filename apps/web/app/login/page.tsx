"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getMe, login } from "@/lib/api";
import { homePathForRole } from "@/lib/kiosk-role";
import { Button, Input } from "@/lib/ds";
import { DemoWarningDialog } from "@/components/DemoWarningDialog";
import styles from "./page.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_EMAIL = "sales@aster.example";
const DEMO_PASSWORD = "demo";

export default function LoginPage() {
  const router = useRouter();
  // Already signed in? Skip the form and go home — "home" depends on the role
  // (OPERATIONS works the kiosk, everyone else the dashboard).
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMe(controller.signal)
      .then((user) => router.replace(homePathForRole(user.role)))
      .catch(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [router]);

  // Hold on the brand background while the session check runs, so the form and
  // an authed redirect never flash past each other.
  if (checking) return <div style={{ minHeight: "100vh", background: "var(--primary)" }} />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nextEmail = email.trim() || (!password ? DEMO_EMAIL : "");
    const nextPassword = password || (!email.trim() ? DEMO_PASSWORD : "");
    setEmail(nextEmail);
    setPassword(nextPassword);

    const errors: { email?: string; password?: string } = {};
    if (!nextEmail) errors.email = "Enter your email";
    else if (!EMAIL_RE.test(nextEmail)) errors.email = "Enter a valid email";
    if (!nextPassword) errors.password = "Enter your password";
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    try {
      const user = await login(nextEmail, nextPassword);
      setPendingDestination(homePathForRole(user.role));
      setSubmitting(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError("Invalid email or password");
      } else if (err instanceof ApiError && err.status === 429) {
        // Show the rate-limit message as-is: it is deliberately a generic
        // one and says nothing about which tier fired; "something went wrong"
        // would send a locked-out rep re-typing a password that is correct.
        setFormError(err.message);
      } else if (err instanceof ApiError && err.status === 422) {
        setFormError("Please check your details and try again");
      } else {
        setFormError("Something went wrong. Please try again");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <form
          onSubmit={onSubmit}
          noValidate
          style={{
            width: 404,
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 56,
          }}
        >
          <h1
            style={{
              margin: 0,
              font: "700 32px/42px var(--font-ui)",
              color: "var(--text-primary)",
            }}
          >
            Welcome to the Aster CRM demo.
          </h1>

          <div
            style={{
              width: 365,
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 38,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Input
                label="Email"
                type="email"
                aria-label="Email"
                autoComplete="email"
                placeholder="you@aster.example"
                value={email}
                disabled={submitting}
                state={fieldErrors.email ? "error" : "default"}
                hint={fieldErrors.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                style={{ width: "100%" }}
              />
              <Input
                label="Password"
                type="password"
                aria-label="Password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={submitting}
                state={fieldErrors.password ? "error" : "default"}
                hint={fieldErrors.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            {formError && (
              <div
                role="alert"
                style={{
                  font: "700 14px/21px var(--font-ui)",
                  color: "var(--secondary-red)",
                }}
              >
                {formError}
              </div>
            )}

            <Button type="submit" disabled={submitting} style={{ width: 178 }}>
              {submitting ? "Signing in" : "Sign in to demo"}
            </Button>
          </div>
        </form>
      </main>

      <aside aria-label="Aster Advisory" className={styles.aside}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, no optimisation pipeline needed */}
        <img
          src="/aster-advisory.webp"
          alt="Illustration of client relationships, reporting, and project planning"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {/* Dissolves the straight edge where the white form card meets the photo. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.85) 12%, rgba(255,255,255,0) 40%)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--primary-dark) 92%, transparent) 0%, color-mix(in srgb, var(--primary-dark) 82%, transparent) 18%, color-mix(in srgb, var(--primary-dark) 45%, transparent) 34%, transparent 58%)",
          }}
        />
        <div className={styles.brandCopy}>
          <p className={styles.brandName}>Aster Advisory</p>
          <p className={styles.brandTagline}>
            One clear view of every customer, conversation, and opportunity.
          </p>
          <p className={styles.brandCaption}>CRM portfolio demo</p>
        </div>
      </aside>
      <DemoWarningDialog
        open={pendingDestination !== null}
        onContinue={() => {
          if (pendingDestination) router.replace(pendingDestination);
        }}
      />
    </div>
  );
}
