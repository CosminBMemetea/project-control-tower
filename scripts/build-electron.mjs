#!/usr/bin/env node
// Prepares everything electron-builder needs that `next build` alone
// doesn't produce:
//   1. Runs `next build` (output: "standalone" in next.config.ts).
//   2. Copies .next/static and public/ into the standalone output — the
//      standalone server doesn't serve these on its own; Next's own docs
//      call this out as a manual step.
//   3. Strips the unused `sharp` native module that gets traced in even
//      though this app never uses next/image (saves ~17MB and one less
//      native module to worry about cross-platform).
//   4. Builds a fresh, pre-migrated, pre-seeded SQLite template database
//      from prisma/schema.prisma + config/projects.ts + config/approvers.ts
//      — this is what a first launch on a new machine copies into the
//      user's per-user app-data folder. It is NOT your dev.db; it's
//      built from scratch every time so it never leaks local test data.
//   5. Rebuilds better-sqlite3's native binary against Electron's Node
//      ABI (not plain Node's) — required because it's loaded inside the
//      packaged Electron process.
//
// Run via `npm run dist:win` (chains this + electron-builder). Node 20+,
// no extra dependencies beyond what's already in package.json.

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneDir = path.join(root, ".next", "standalone");

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { stdio: "inherit", cwd: root, ...opts });
}

function step(label, fn) {
  console.log(`\n=== ${label} ===`);
  fn();
}

step("1/5 next build (standalone output)", () => {
  run("npx", ["next", "build"]);
  if (!existsSync(standaloneDir)) {
    throw new Error(
      ".next/standalone was not produced — check output: \"standalone\" in next.config.ts."
    );
  }
});

step("2/5 copy static assets into the standalone output", () => {
  cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
    recursive: true,
  });
  const publicDir = path.join(root, "public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });
  }
});

step("3/5 strip unused sharp native module", () => {
  const sharpScopeDir = path.join(standaloneDir, "node_modules", "@img");
  if (existsSync(sharpScopeDir)) {
    rmSync(sharpScopeDir, { recursive: true, force: true });
  }
});

step("4/5 build a fresh, pre-seeded template database", () => {
  const templatePath = path.join(root, "electron", "template.db");
  rmSync(templatePath, { force: true });
  rmSync(`${templatePath}-journal`, { force: true });

  const env = { ...process.env, DATABASE_URL: `file:${templatePath}` };
  run("npx", ["prisma", "migrate", "deploy"], { env });
  run("npx", ["tsx", "prisma/seed.ts"], { env });

  mkdirSync(path.join(root, "electron"), { recursive: true });
  console.log(`Template database written to ${templatePath}`);
});

step("5/5 rebuild better-sqlite3 for Electron's Node ABI", () => {
  // Next's file tracer strips binding.gyp/src/deps/ from the traced
  // module (correctly — they're not needed at runtime), but that's
  // exactly what @electron/rebuild needs to detect and recompile a
  // native module, so it silently finds "no native modules" if pointed
  // directly at .next/standalone. Instead: install a throwaway copy of
  // the exact resolved better-sqlite3 version (full source, via npm)
  // into an isolated temp dir, rebuild THAT for Electron's ABI, then
  // copy just the resulting binary into the standalone output.
  //
  // The isolated dir MUST live outside this project entirely (os.tmpdir(),
  // not e.g. ./.electron-rebuild-tmp) — verified by hand that a sibling
  // directory INSIDE the repo silently let electron-rebuild's native
  // recompile reach into and overwrite the project's own
  // node_modules/better-sqlite3 too (breaking `next dev` until
  // `npm rebuild better-sqlite3` restores it), almost certainly because
  // npm/node-gyp's build cache shares underlying files across installs of
  // the same package+version. Being fully outside the tree avoids it, and
  // the checksum guard below makes sure that stays true even on a
  // different OS/npm version where the exact mechanism may differ.
  const rootBinaryPath = path.join(
    root,
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node"
  );
  const rootBinaryChecksumBefore = existsSync(rootBinaryPath) ? sha256File(rootBinaryPath) : null;

  const bsq3Version = JSON.parse(
    execFileSync("node", [
      "-p",
      "JSON.stringify(require('better-sqlite3/package.json').version)",
    ]).toString()
  );
  const electronVersion = JSON.parse(
    execFileSync("node", [
      "-p",
      "JSON.stringify(require('electron/package.json').version)",
    ]).toString()
  );

  const rebuildDir = path.join(os.tmpdir(), `electron-native-rebuild-${Date.now()}`);
  rmSync(rebuildDir, { recursive: true, force: true });
  mkdirSync(rebuildDir, { recursive: true });
  writeFileSync(
    path.join(rebuildDir, "package.json"),
    JSON.stringify({
      name: "electron-native-rebuild",
      version: "1.0.0",
      dependencies: { "better-sqlite3": bsq3Version },
    })
  );
  run("npm", ["install", "--no-audit", "--no-fund"], { cwd: rebuildDir });
  run("npx", [
    "electron-rebuild",
    "--force",
    "--version",
    electronVersion,
    "--module-dir",
    rebuildDir,
    "--which-module",
    "better-sqlite3",
  ], { cwd: rebuildDir });

  const rebuiltBinary = path.join(
    rebuildDir,
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node"
  );
  const targetBinary = path.join(
    standaloneDir,
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node"
  );
  if (!existsSync(rebuiltBinary)) {
    throw new Error(`Expected rebuilt binary not found at ${rebuiltBinary}`);
  }
  copyFileSync(rebuiltBinary, targetBinary);
  rmSync(rebuildDir, { recursive: true, force: true });
  console.log(`Replaced ${targetBinary} with the Electron-ABI build.`);

  if (rootBinaryChecksumBefore && sha256File(rootBinaryPath) !== rootBinaryChecksumBefore) {
    throw new Error(
      `SAFETY ABORT: ${rootBinaryPath} changed during the isolated rebuild — this ` +
        "should be impossible. Run `npm rebuild better-sqlite3` to restore it, then " +
        "report this before re-running the build."
    );
  }
});

console.log("\nAll set — run `npx electron-builder --win` to produce the installer.");
