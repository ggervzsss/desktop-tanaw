import { app, BrowserWindow, ipcMain } from "electron";
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
let mlServiceProcess: ChildProcess | null = null;
let mlServiceError: string | null = null;

const mlServicePort = Number(process.env["TANAW_ML_SERVICE_PORT"] ?? "8765");
const mlServiceUrl = `http://127.0.0.1:${mlServicePort}`;

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
      TANAW_ML_SERVICE_PORT: String(mlServicePort),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  mlServiceProcess = child;

  child.stdout?.on("data", (chunk) => {
    console.info(`[tanaw-ml] ${String(chunk).trim()}`);
  });

  child.stderr?.on("data", (chunk) => {
    console.error(`[tanaw-ml] ${String(chunk).trim()}`);
  });

  child.on("error", (error) => {
    mlServiceError = error.message;
    mlServiceProcess = null;
  });

  child.on("exit", (code, signal) => {
    if (code && code !== 0) {
      mlServiceError = `ML service exited with code ${code}${signal ? ` (${signal})` : ""}.`;
    }
    mlServiceProcess = null;
  });
}

function stopMlService() {
  if (!mlServiceProcess) return;

  const serviceProcess = mlServiceProcess;
  mlServiceProcess = null;
  serviceProcess.kill();
}

function registerMlServiceIpc() {
  ipcMain.handle("ml-service:get-status", () => ({
    baseUrl: mlServiceUrl,
    error: mlServiceError,
    pid: mlServiceProcess?.pid ?? null,
    running: Boolean(mlServiceProcess),
  }));

  ipcMain.handle("ml-service:restart", () => {
    stopMlService();
    startMlService();
    return {
      baseUrl: mlServiceUrl,
      error: mlServiceError,
      pid: mlServiceProcess?.pid ?? null,
      running: Boolean(mlServiceProcess),
    };
  });
}

function createWindow() {
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

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopMlService();
    app.quit();
    win = null;
  }
});

app.on("before-quit", () => {
  stopMlService();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  registerMlServiceIpc();
  startMlService();
  createWindow();
});
