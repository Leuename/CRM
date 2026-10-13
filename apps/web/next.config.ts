import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "..", "..");
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: { root: repoRoot },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          ...(isDev
            ? []
            : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/opportunities/:path*",
        destination: "/sales/opportunities/:path*",
        permanent: true,
      },
      { source: "/contacts/:path*", destination: "/customers/individuals/:path*", permanent: true },
      { source: "/companies/:path*", destination: "/customers/companies/:path*", permanent: true },
      { source: "/products/:path*", destination: "/customers/products/:path*", permanent: true },
      { source: "/activities", destination: "/settings/activities", permanent: true },
      { source: "/audit", destination: "/settings/audit", permanent: true },
    ];
  },
};

export default nextConfig;
