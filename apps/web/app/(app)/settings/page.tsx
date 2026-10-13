import { redirect } from "next/navigation";

// (activities, audit, pipeline). Next fell through to the root 404, which
// renders OUTSIDE the app shell — a signed-in user who trimmed the URL, or
// followed a stale bookmark, lost the whole navigation and had no way back
// except the browser Back button.
//
// General claims the section, so the bare path lands somewhere useful rather
// than merely resolving. e2e/navigation.spec.ts pins it.
export default function SettingsIndexPage() {
  redirect("/settings/general");
}
