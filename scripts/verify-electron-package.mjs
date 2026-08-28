#!/usr/bin/env node
// Sanity-checks electron-builder's packaged output right after
// `electron-builder --win` finishes — specifically the files server.js
// actually requires (`next`, `next/dist/server/lib/start-server`,
// better-sqlite3's native binary). A user reported "Cannot find module
// 'next'" on a real Windows install; this build succeeds and produces a
// working exe, so something is clearly missing between "files exist
// locally" and "files exist in the packaged output" — this makes that
// gap show up in CI logs directly instead of guessing blind.

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const unpackedResources = path.join(root, "dist-electron", "win-unpacked", "resources");
const standaloneDir = path.join(unpackedResources, "standalone");

let ok = true;
function check(label, p) {
  const found = existsSync(p);
  console.log(`${found ? "OK  " : "MISSING"} ${label}: ${p}`);
  if (!found) ok = false;
  return found;
}

console.log(`\n=== Verifying packaged output at ${unpackedResources} ===\n`);

check("resources dir", unpackedResources);
check("standalone/server.js", path.join(standaloneDir, "server.js"));
check("standalone/node_modules/next/package.json", path.join(standaloneDir, "node_modules", "next", "package.json"));
check(
  "standalone/node_modules/next/dist/server/lib/start-server.js",
  path.join(standaloneDir, "node_modules", "next", "dist", "server", "lib", "start-server.js")
);
check(
  "standalone/node_modules/better-sqlite3/build/Release/better_sqlite3.node",
  path.join(standaloneDir, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node")
);
check("template.db", path.join(unpackedResources, "template.db"));

const nodeModulesDir = path.join(standaloneDir, "node_modules");
if (existsSync(nodeModulesDir)) {
  const entries = readdirSync(nodeModulesDir);
  console.log(`\nstandalone/node_modules has ${entries.length} top-level entries.`);
  console.log("Contains 'next':", entries.includes("next"));
} else {
  console.log("\nstandalone/node_modules does not exist at all.");
  ok = false;
}

if (!ok) {
  console.error("\n✖ Packaged output verification FAILED — see MISSING lines above.");
  process.exit(1);
}
console.log("\n✔ Packaged output looks complete.");
