import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from "electron";
import { existsSync } from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure:
// dist/index.html
// dist-electron/main.js
// dist-electron/preload.mjs
process.env.APP_ROOT = path.join(__dirname, "..");

// Use ['ENV_NAME'] to avoid the vite:define plugin.
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;
let tray: Tray | null = null;
let mlServiceProcess: ChildProcess | null = null;
let mlServiceError: string | null = null;
let isQuitting = false;

const mlServicePort = Number(process.env["TANAW_ML_SERVICE_PORT"] ?? "8765");
const mlServiceUrl = `http://127.0.0.1:${mlServicePort}`;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

function getMlServiceDir() {
  const developmentPath = path.join(process.env.APP_ROOT, "ml-service");
  if (existsSync(developmentPath)) {
    return developmentPath;
  }

  return path.join(process.resourcesPath, "ml-service");
}

function getMlServiceCommand(serviceDir: string) {
  const venvPython = process.platform === "win32" ? path.join(serviceDir, ".venv", "Scripts", "python.exe") : path.join(serviceDir, ".venv", "bin", "python");

  if (existsSync(venvPython)) {
    return { command: venvPython, args: ["main.py"] };
  }

  return { command: "uv", args: ["run", "python", "main.py"] };
}

function startMlService() {
  if (mlServiceProcess) {
    return;
  }

  const serviceDir = getMlServiceDir();
  if (!existsSync(serviceDir)) {
    mlServiceError = `ML service directory was not found at ${serviceDir}.`;
    return;
  }

  const { command, args } = getMlServiceCommand(serviceDir);
  mlServiceError = null;

  const child = spawn(command, args, {
    cwd: serviceDir,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      TANAW_APP_DATA_DIR: app.getPath("userData"),
      TANAW_ML_SERVICE_PORT: String(mlServicePort),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  mlServiceProcess = child;
  updateTrayMenu();

  child.stdout?.on("data", (chunk) => {
    console.info(`[tanaw-ml] ${String(chunk).trim()}`);
  });

  child.stderr?.on("data", (chunk) => {
    console.error(`[tanaw-ml] ${String(chunk).trim()}`);
  });

  child.on("error", (error) => {
    mlServiceError = error.message;
    mlServiceProcess = null;
    updateTrayMenu();
  });

  child.on("exit", (code, signal) => {
    if (code && code !== 0) {
      mlServiceError = `ML service exited with code ${code}${signal ? ` (${signal})` : ""}.`;
    }
    mlServiceProcess = null;
    updateTrayMenu();
  });
}

function stopMlService() {
  if (!mlServiceProcess) return;

  const serviceProcess = mlServiceProcess;
  mlServiceProcess = null;
  serviceProcess.kill();
  updateTrayMenu();
}

async function stopCameraProcessingFromTray() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    await fetch(`${mlServiceUrl}/camera/stop`, { method: "POST", signal: controller.signal });
    mlServiceError = null;
  } catch (error) {
    mlServiceError = error instanceof Error ? error.message : "Unable to stop camera processing.";
  } finally {
    clearTimeout(timeout);
    updateTrayMenu();
  }
}

function restartMlService() {
  stopMlService();
  startMlService();
}

function registerMlServiceIpc() {
  ipcMain.handle("ml-service:get-status", () => ({
    baseUrl: mlServiceUrl,
    error: mlServiceError,
    pid: mlServiceProcess?.pid ?? null,
    running: Boolean(mlServiceProcess),
  }));

  ipcMain.handle("ml-service:restart", () => {
    restartMlService();
    return {
      baseUrl: mlServiceUrl,
      error: mlServiceError,
      pid: mlServiceProcess?.pid ?? null,
      running: Boolean(mlServiceProcess),
    };
  });
}

function registerAppLifecycleIpc() {
  ipcMain.handle("app-lifecycle:get-background-status", () => getBackgroundStatus());
  ipcMain.handle("app-lifecycle:show-window", () => {
    showMainWindow();
    return getBackgroundStatus();
  });
  ipcMain.handle("app-lifecycle:quit", () => quitApplication());
  ipcMain.handle("app-lifecycle:get-startup-settings", () => getStartupSettings());
  ipcMain.handle("app-lifecycle:update-startup-settings", (_event, openAtLogin: boolean) => {
    setStartupSettings(Boolean(openAtLogin));
    return getStartupSettings();
  });
}

function getBackgroundStatus() {
  return {
    background: Boolean(win && !win.isVisible()),
    mlServiceRunning: Boolean(mlServiceProcess),
    mlServiceError,
    trayAvailable: Boolean(tray),
  };
}

function getStartupSettings() {
  const settings = app.getLoginItemSettings();
  return { openAtLogin: settings.openAtLogin };
}

function setStartupSettings(openAtLogin: boolean) {
  app.setLoginItemSettings({
    openAtLogin,
    openAsHidden: true,
    args: openAtLogin ? ["--background"] : [],
  });
}

function createTray() {
  if (tray) return;

  const iconPath = path.join(process.env.VITE_PUBLIC, "electron-vite.svg");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? iconPath : icon);
  tray.setToolTip("TANAW Enterprise Desktop");
  tray.on("double-click", showMainWindow);
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const monitoringLabel = mlServiceProcess ? "ML Service: Running" : mlServiceError ? "ML Service: Error" : "ML Service: Stopped";
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open TANAW", click: showMainWindow },
    { label: monitoringLabel, enabled: false },
    { type: "separator" },
    { label: "Stop Monitoring", enabled: Boolean(mlServiceProcess), click: () => void stopCameraProcessingFromTray() },
    { label: "Restart ML Service", click: restartMlService },
    { type: "separator" },
    { label: "Quit TANAW", click: () => void quitApplication() },
  ]);

  tray.setContextMenu(contextMenu);
}

function showMainWindow() {
  if (!win || win.isDestroyed()) {
    createWindow();
    return;
  }

  win.show();
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
}

function createWindow() {
  if (win && !win.isDestroyed()) {
    showMainWindow();
    return;
  }

  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    title: "TANAW Enterprise Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });
  win.maximize();

  win.on("close", (event) => {
    if (isQuitting) return;

    event.preventDefault();
    win?.hide();
    updateTrayMenu();
  });

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

async function quitApplication() {
  isQuitting = true;
  if (mlServiceProcess) {
    await stopCameraProcessingFromTray();
  }
  stopMlService();
  if (win && !win.isDestroyed()) {
    win.destroy();
  }
  app.quit();
}

app.on("window-all-closed", () => {
  updateTrayMenu();
});

app.on("before-quit", () => {
  isQuitting = true;
  stopMlService();
});

app.on("activate", () => {
  showMainWindow();
});

app.on("second-instance", () => {
  showMainWindow();
});

app.whenReady().then(() => {
  registerMlServiceIpc();
  registerAppLifecycleIpc();
  createTray();
  startMlService();
  if (!process.argv.includes("--background")) {
    createWindow();
  }
});
