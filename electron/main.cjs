/**
 * EVENT_HUB_INTEGRATION_MAP (Electron main process)
 *
 * | Feature              | Location / next step                                      |
 * |----------------------|------------------------------------------------------------|
 * | Native notifications | Add polling `GET /notifications/unread-count` + `Notification` API |
 * | Idle / away 1h popup | `powerMonitor` `suspend`/`resume` + prefs from API         |
 * | Auto-start on login  | `app.setLoginItemSettings` (macOS) / Startup folder (Win) |
 * | Single instance      | `app.requestSingleInstanceLock()`                        |
 * | Remote API URL       | Pass `EVENT_HUB_API` or load from config; align Vite `VITE_API_URL` |
 * | Zscaler / TLS        | OS trust store; optional `NODE_EXTRA_CA_CERTS` for child proc |
 * | Backend child spawn  | `startBackend()` — dev only; production points to remote API |
 *
 * See: planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md (desktop build + Windows)
 *      planning/MASTER_FINAL_PLAN.md Phase F5
 *      frontend/src/lib/corporateIntegrationPoints.ts
 */
const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow = null;
let backendProcess = null;
let tray = null;
let isQuitting = false;

/** 1×1 PNG — Electron requires a non-empty image for Tray on some platforms */
const TRAY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function useDevServer() {
  return process.env.ELECTRON_USE_DEV_SERVER === "1";
}

function pythonExecutable() {
  const root = path.join(__dirname, "..", "backend", ".venv");
  if (process.platform === "win32") {
    return path.join(root, "Scripts", "python.exe");
  }
  return path.join(root, "bin", "python");
}

function startBackend() {
  if (app.isPackaged) return;
  const py = pythonExecutable();
  if (!fs.existsSync(py)) {
    console.warn("EVENT-HUB: backend venv not found at", py, "- skip spawning uvicorn");
    return;
  }
  const cwd = path.join(__dirname, "..", "backend");
  backendProcess = spawn(py, ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], {
    cwd,
    stdio: "inherit",
  });
  backendProcess.on("error", (err) => {
    console.error("EVENT-HUB: failed to start FastAPI:", err.message);
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createTray() {
  if (tray) return;
  const icon = nativeImage.createFromBuffer(TRAY_PNG);
  tray = new Tray(icon);
  tray.setToolTip("Event Hub");
  const menu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) mainWindow.hide();
      else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("close", (e) => {
    if (tray && !isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  if (useDevServer()) {
    mainWindow.loadURL("http://127.0.0.1:8080");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  stopBackend();
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
  stopBackend();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});
