import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(scriptPath), "..");
const repositoryRoot = path.resolve(appRoot, "..", "..");
const extensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".svg",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".conf",
  ".config",
]);
const ignoredDirectories = new Set([
  "node_modules",
  ".next",
  ".git",
  "test-results",
  "playwright-report",
  "blob-report",
]);

const checks = [
  [
    "production service configuration",
    /\b(?:NEXT_PUBLIC_(?:(?:[A-Z0-9]+_)*(?:API|BACKEND|DATABASE|SUPABASE|POSTGRES|CRM)(?:_[A-Z0-9]+)*)|API_PROXY_TARGET|DATABASE_URL|SUPABASE_[A-Z0-9_]+|POSTGRES_[A-Z0-9_]+)\b/i,
  ],
  [
    "production service hostname",
    /(?:supabase\.co|(?:api|crm|db)\.[a-z0-9-]+(?:\.[a-z]{2,})+|localhost:8000|127\.0\.0\.1:8000)/i,
  ],
  [
    "unapproved external domain",
    /\b(?!(?:example\.com|nextjs\.org|w3\.org)\b)[a-z0-9-]+\.(?:com|net|org|co|io|ai|dev|app|xyz|info|gov|edu|uk)\b/i,
  ],
  [
    "native network transport in frontend source",
    /\b(?:fetch|window\.fetch|globalThis\.fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|\bnavigator\.sendBeacon\s*\(/,
  ],
];

export function inspectSource(content, filePath, root = appRoot) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
  const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, "/");
  const isChecker = absolutePath === scriptPath;
  const isTest = /(?:^|\/)(?:e2e|tests?|__tests__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(
    relativePath,
  );
  const failures = [];

  if (isChecker || isTest) return failures;

  const sourceWithoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1");

  for (const [label, pattern] of checks) {
    if (label === "native network transport in frontend source" && isTest) continue;
    const input =
      label === "native network transport in frontend source" ? sourceWithoutComments : content;
    const match = pattern.exec(input);
    if (match)
      failures.push(`${path.relative(repositoryRoot, absolutePath)}: ${label} (${match[0]})`);
  }

  return failures;
}

export function inspectDependencies(packageJson) {
  const dependencyGroups = [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies,
  ];
  return dependencyGroups.flatMap((group) =>
    Object.keys(group ?? {})
      .filter((name) => /^(?:@supabase\/|pg$|postgres$|asyncpg$)/i.test(name))
      .map((name) => `package.json: prohibited backend dependency ${name}`),
  );
}

async function walk(directory, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    if (entry.name === "package-lock.json") continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath, files);
    else if (extensions.has(path.extname(entry.name))) files.push(fullPath);
  }
}

async function run() {
  const files = [];
  const failures = [];
  await Promise.all(
    [appRoot, path.join(repositoryRoot, "design-system")].map((root) => walk(root, files)),
  );

  for (const file of files) {
    const content = await readFile(file, "utf8");
    failures.push(...inspectSource(content, file, repositoryRoot));
  }

  const packageJson = JSON.parse(await readFile(path.join(appRoot, "package.json"), "utf8"));
  failures.push(...inspectDependencies(packageJson));

  if (failures.length) {
    console.error("Demo boundary check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Demo boundary check passed (${files.length} frontend and design-system files scanned).`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await run();
