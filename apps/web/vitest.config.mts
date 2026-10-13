import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

// Aliases are declared here rather than via vite-tsconfig-paths: tsconfig also
// maps `react`/`react-dom` at @types, which a path plugin would try to resolve.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The design system lives outside apps/web and has no node_modules of its
    // own, so its `react/jsx-runtime` imports resolve from here.
    dedupe: ["react", "react-dom"],
    alias: {
      "@ds": fileURLToPath(new URL("../../design-system", import.meta.url)),
      "@": root,
    },
  },
  test: {
    environment: "jsdom",
    // Only *.test.*; the Playwright suite in e2e/ uses *.spec.ts and stays there.
    include: ["**/*.test.{ts,tsx}"],
  },
});
