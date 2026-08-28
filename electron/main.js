// Electron main process for the desktop build. Responsibilities:
//   1. Make sure a writable, per-user SQLite database exists (the
//      packaged app's install directory is typically read-only for a
//      standard Windows user, so the live database can't live there).
//   2. Start the Next.js standalone server as a plain-Node child process.
//   3. Open a window pointed at it once it's actually accepting
//      connections, and tear the server down cleanly on quit.
//
// Kept as plain CommonJS (no build step of its own) since it's small and
// runs directly under Electron's bundled Node.

const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { fork } = require("node:child_process");

const SERVER_PORT = 17321; // uncommon, fixed — good enough for a single-user desktop app
const isDev = !app.isPackaged;

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

function resourcePath(...segments) {
  // Dev: run against the repo's own .next/standalone + dev.db, so
  // `npm run electron:dev` needs no packaging step. Packaged: everything
  // lives under process.resourcesPath (electron-builder's extraResources).
  const base = isDev ? path.join(__dirname, "..") : process.resourcesPath;
  return path.join(base, ...segments);
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
  return dbPath;
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${SERVER_PORT}`);

  // Anything that isn't a link to the app itself (e.g. an evidence/link
  // field pointing out at an external site) opens in the OS's real
  // browser instead of inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
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
