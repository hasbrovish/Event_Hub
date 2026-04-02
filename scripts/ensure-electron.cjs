/**
 * Completes the Electron binary download when the npm package exists but dist/ is empty
 * (e.g. interrupted install). Safe to run on every postinstall.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const electronDir = path.join(root, "node_modules", "electron");
const installJs = path.join(electronDir, "install.js");

if (!fs.existsSync(installJs)) {
  process.exit(0);
}

const marker =
  process.platform === "win32"
    ? path.join(electronDir, "dist", "electron.exe")
    : process.platform === "darwin"
      ? path.join(electronDir, "dist", "Electron.app", "Contents", "MacOS", "Electron")
      : path.join(electronDir, "dist", "electron");

if (fs.existsSync(marker)) {
  process.exit(0);
}

console.log("EVENT-HUB: Electron binary missing; running install.js…");
execFileSync(process.execPath, [installJs], { cwd: electronDir, stdio: "inherit" });
