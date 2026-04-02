const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow = null;
let backendProcess = null;

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

  if (useDevServer()) {
    mainWindow.loadURL("http://127.0.0.1:8080");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
