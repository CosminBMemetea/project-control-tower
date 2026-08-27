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

const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { fork } = require("node:child_process");

const SERVER_PORT = 17321; // uncommon, fixed — good enough for a single-user desktop app
const isDev = !app.isPackaged;

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
  const dbPath = ensureDatabase();

  serverProcess = fork(serverEntry, [], {
    cwd: path.dirname(serverEntry),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1", // run the forked Electron binary as plain Node
      PORT: String(SERVER_PORT),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      DATABASE_URL: `file:${dbPath}`,
    },
    stdio: isDev ? "inherit" : "ignore",
  });

  serverProcess.on("exit", (code) => {
    if (code && code !== 0 && mainWindow) {
      console.error(`Server process exited unexpectedly (code ${code}).`);
    }
  });

  return waitForServer(SERVER_PORT);
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
    await startServer();
    createWindow();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start the app server:", err);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
