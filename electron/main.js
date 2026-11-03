// Electron main process for the desktop build. Responsibilities:
//   1. Make sure a writable, per-user SQLite database exists (the
//      packaged app's install directory is typically read-only for a
//      standard Windows user, so the live database can't live there).
//   2. Start the Next.js standalone server as a plain-Node child process.
//   3. Open a window pointed at it once it's actually accepting
//      connections, and tear the server down cleanly on quit.
//   4. Keep it fully offline: the server listens on 127.0.0.1 only, and
//      the window may only talk to that server (see lockToLocalServer).
//
// Kept as plain CommonJS (no build step of its own) since it's small and
// runs directly under Electron's bundled Node.

const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const { fork } = require("node:child_process");

const SERVER_PORT = 17321; // uncommon, fixed — good enough for a single-user desktop app
const APP_ORIGIN = `http://127.0.0.1:${SERVER_PORT}`;
const isDev = !app.isPackaged;

// Electron derives the per-user data folder from the app name, and the
// package used to be named "galpapa" — so installs from before the rename
// keep their database in e.g. %APPDATA%\galpapa. Keep using whichever
// folder already holds one rather than silently starting a blank database
// under the new name. Must run before anything reads userData (logPath
// below included).
const LEGACY_USER_DATA_DIRS = ["galpapa"];
if (!isDev && !fs.existsSync(path.join(app.getPath("userData"), "data.db"))) {
  const legacyDir = LEGACY_USER_DATA_DIRS.map((name) =>
    path.join(app.getPath("appData"), name)
  ).find((dir) => fs.existsSync(path.join(dir, "data.db")));
  if (legacyDir) app.setPath("userData", legacyDir);
}

// A failure here previously meant the app just quit with zero visible
// feedback — console.error() goes nowhere a packaged GUI app's user can
// see. Everything now also goes to a log file in userData, and any
// startup failure shows a real dialog instead of silently exiting.
const logPath = isDev ? null : path.join(app.getPath("userData"), "app.log");
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map(String).join(" ")}`;
  console.log(line);
  if (logPath) {
    try {
      fs.appendFileSync(logPath, line + "\n");
    } catch {
      // logging itself failing shouldn't crash startup
    }
  }
}

// Prisma's SQLite `file:` URL is parsed URI-style — a raw Windows path
// (backslashes + a `C:` drive letter right after the scheme) is
// ambiguous there, even though the filesystem itself accepts forward
// slashes just fine. Always normalize before building a DATABASE_URL.
function toFileUrl(absPath) {
  return `file:${absPath.split(path.sep).join("/")}`;
}

let serverProcess = null;
let mainWindow = null;

// Packaged: everything lives under process.resourcesPath (electron-builder's
// extraResources). Dev: the same files where the build leaves them in the
// repo, so `npm run electron:start` needs no packaging step.
const DEV_RESOURCE_DIRS = {
  standalone: path.join(__dirname, "..", ".next", "standalone"),
  migrations: path.join(__dirname, "..", "prisma", "migrations"),
  "template.db": path.join(__dirname, "template.db"),
};

function resourcePath(first, ...rest) {
  if (!isDev) return path.join(process.resourcesPath, first, ...rest);
  return path.join(DEV_RESOURCE_DIRS[first] ?? path.join(__dirname, "..", first), ...rest);
}

// The database always lives in the OS's per-user app-data folder, never
// inside the install directory — see the file header for why.
function getDatabasePath() {
  if (isDev) return path.join(__dirname, "..", "dev.db");
  return path.join(app.getPath("userData"), "data.db");
}

// First launch only: seed the user's database from a pre-migrated,
// pre-seeded template shipped alongside the app, so nothing needs to run
// `prisma migrate` at runtime.
function ensureDatabase() {
  const dbPath = getDatabasePath();
  if (isDev) return dbPath; // dev.db is already there and already migrated
  if (!fs.existsSync(dbPath)) {
    const templatePath = resourcePath("template.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.copyFileSync(templatePath, dbPath);
  }
  applyPendingMigrations(dbPath);
  return dbPath;
}

// Every launch: apply any migration the user's database hasn't seen yet.
// The template is only copied on *first* launch, so without this an
// existing install would never get a schema change shipped in a later
// version, and the new server code would crash against the old tables.
// Same bookkeeping as `prisma migrate deploy` (the _prisma_migrations
// table the template was built with), one transaction per migration —
// done with the bundled better-sqlite3 since the Prisma CLI isn't shipped.
function applyPendingMigrations(dbPath) {
  const migrationsDir = resourcePath("migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Bundled migrations not found at ${migrationsDir} — this build is broken.`);
  }
  const Database = require(resourcePath("standalone", "node_modules", "better-sqlite3"));

  const db = new Database(dbPath);
  let backupPath = null;
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
    )`);
    const applied = new Set(
      db
        .prepare(
          `SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL`
        )
        .all()
        .map((row) => row.migration_name)
    );
    // Folder names are timestamp-prefixed, so lexical order is apply order.
    const pending = fs
      .readdirSync(migrationsDir)
      .filter(
        (name) =>
          !applied.has(name) && fs.existsSync(path.join(migrationsDir, name, "migration.sql"))
      )
      .sort();
    if (pending.length === 0) return;

    backupPath = `${dbPath}.before-${pending[0]}.${Date.now()}.bak`; // VACUUM INTO refuses to overwrite
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
    log(`Applying ${pending.length} migration(s); backup saved to ${backupPath}`);

    // Foreign keys off for the duration (only takes effect outside a
    // transaction): SQLite migrations rebuild a table by copy → DROP →
    // rename, and with enforcement on, dropping a parent table would
    // cascade-delete every child row.
    db.pragma("foreign_keys = OFF");
    for (const name of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8");
      const startedAt = Date.now();
      db.transaction(() => {
        db.exec(sql);
        db.prepare(
          `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES (?, ?, ?, ?, ?, 1)`
        ).run(
          crypto.randomUUID(),
          crypto.createHash("sha256").update(sql).digest("hex"),
          Date.now(),
          name,
          startedAt
        );
      })();
      log("Applied migration:", name);
    }
    const violations = db.pragma("foreign_key_check");
    if (violations.length > 0) {
      throw new Error(`the upgrade left ${violations.length} broken reference(s)`);
    }
    db.pragma("foreign_keys = ON");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Upgrading your database failed: ${message}` +
        (backupPath ? `\n\nYour data from before the upgrade is saved at:\n${backupPath}` : "")
    );
  } finally {
    db.close();
  }
}

function waitForServer(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 1500 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("Server did not start in time."));
        setTimeout(attempt, 300);
      });
      req.on("timeout", () => req.destroy());
    };
    attempt();
  });
}

function startServer() {
  const serverEntry = resourcePath("standalone", "server.js");
  log("Resolved server entry:", serverEntry, "exists:", fs.existsSync(serverEntry));
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Bundled server not found at ${serverEntry} — this build is broken.`);
  }

  const dbPath = ensureDatabase();
  log("Using database:", dbPath);

  serverProcess = fork(serverEntry, [], {
    cwd: path.dirname(serverEntry),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1", // run the forked Electron binary as plain Node
      PORT: String(SERVER_PORT),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      DATABASE_URL: toFileUrl(dbPath),
    },
    // Piped (not "ignore") in production too, so a server-side crash
    // ends up in the log file instead of vanishing — this was the main
    // reason a failed launch used to look like nothing happened at all.
    stdio: isDev ? "inherit" : ["ignore", "pipe", "pipe", "ipc"],
  });

  if (!isDev) {
    serverProcess.stdout?.on("data", (d) => log("[server]", d.toString().trim()));
    serverProcess.stderr?.on("data", (d) => log("[server:err]", d.toString().trim()));
  }

  let serverExited = false;
  serverProcess.on("exit", (code, signal) => {
    serverExited = true;
    log(`Server process exited (code ${code}, signal ${signal}).`);
  });
  serverProcess.on("error", (err) => {
    log("Server process failed to spawn:", err.stack || err.message);
  });

  return waitForServer(SERVER_PORT).catch((err) => {
    if (serverExited) {
      throw new Error(
        `The app's server exited before it was ready. See the log for details: ${logPath ?? "(dev mode — check this terminal)"}`
      );
    }
    throw err;
  });
}

function isAppUrl(url) {
  return url === APP_ORIGIN || url.startsWith(`${APP_ORIGIN}/`);
}

// Links the user clicks (evidence links, meeting links, the checklist's
// Email button) open in the OS's own browser or mail app. Only these
// protocols — never file:, smb: or anything else that could launch a
// program.
function openOutside(url) {
  if (/^(https?|mailto):/i.test(url)) shell.openExternal(url);
}

// Offline by construction: the window may only load from the app's own
// local server. Anything else — a remote image, script, font or tracking
// pixel — is refused before it leaves the machine, and logged.
function lockToLocalServer(session) {
  // Electron's spellchecker downloads its dictionaries from Google's
  // servers on Windows — the one request it would make on its own. Off for
  // the whole session, not just the window, so it never initializes.
  session.setSpellCheckerEnabled(false);
  session.webRequest.onBeforeRequest((details, callback) => {
    const allowed = isAppUrl(details.url) || /^(devtools|data|blob):/.test(details.url);
    if (!allowed) log("Blocked outside request:", details.url);
    callback({ cancel: !allowed });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false, // see lockToLocalServer
    },
  });
  lockToLocalServer(mainWindow.webContents.session);

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(APP_ORIGIN);

  // Links to anywhere but the app itself open outside it (see openOutside)
  // — both new-window links and plain ones, which would otherwise
  // navigate the app window away.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    openOutside(url);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    log("Starting up. isPackaged:", app.isPackaged, "resourcesPath:", process.resourcesPath);
    await startServer();
    createWindow();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("STARTUP FAILED:", message);
    dialog.showErrorBox(
      "Project Control Tower failed to start",
      `${message}\n\n${logPath ? `A log file was saved to:\n${logPath}\n\nPlease share it if you report this.` : ""}`
    );
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

process.on("uncaughtException", (err) => {
  log("UNCAUGHT EXCEPTION:", err.stack || err.message);
  dialog.showErrorBox(
    "Project Control Tower crashed",
    `${err.message}\n\n${logPath ? `A log file was saved to:\n${logPath}` : ""}`
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
