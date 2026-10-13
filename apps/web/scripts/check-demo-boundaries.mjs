import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(appRoot, "..", "..");
const files = [];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".svg"]);

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      [
        "node_modules",
        ".next",
        ".git",
        "test-results",
        "playwright-report",
        "blob-report",
      ].includes(entry.name)
    )
      continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
}

await walk(root);
const failures = [];
const checks = [
  [
    "production service configuration",
    /process\.env\.(?:NEXT_PUBLIC_API_URL|API_PROXY_TARGET|DATABASE_URL|SUPABASE_[A-Z0-9_]+|POSTGRES_[A-Z0-9_]+)/i,
  ],
  [
    "production service hostname",
    /(?:supabase\.co|(?:api|crm|db)\.[a-z0-9-]+(?:\.[a-z]{2,})+|localhost:8000|127\.0\.0\.1:8000)/i,
  ],
  [
    "unapproved external domain",
    /\b(?!(?:example\.com|w3\.org|nextjs\.org)\b)[a-z0-9-]+\.(?:com|net|org|co|io|ai)\b/i,
  ],
  ["native network fetch in the UI API module", /(?<!demo)\bfetch\s*\(/],
];

for (const file of files) {
  if (path.resolve(file) === fileURLToPath(import.meta.url)) continue;
  const content = await readFile(file, "utf8");
  for (const [label, pattern] of checks) {
    if (
      label === "native network fetch in the UI API module" &&
      path.resolve(file) !== path.join(appRoot, "lib", "api.ts")
    )
      continue;
    const match = pattern.exec(content);
    if (match) failures.push(`${path.relative(root, file)}: ${label} (${match[0]})`);
  }
}

const packageJson = JSON.parse(await readFile(path.join(appRoot, "package.json"), "utf8"));
for (const name of Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
  if (/^(?:@supabase\/|pg$|postgres$|asyncpg$)/i.test(name))
    failures.push(`package.json: prohibited backend dependency ${name}`);
}

if (failures.length) {
  console.error("Demo boundary check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Demo boundary check passed (${files.length} source/config files scanned).`);
}
