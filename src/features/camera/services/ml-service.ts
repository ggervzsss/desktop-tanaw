import type { Camera } from "../../../types/enterprise";

export type MlServiceStatus = {
  baseUrl: string;
  error: string | null;
  pid: number | null;
  running: boolean;
};

export type MlHealth = {
  status: "ok";
  running: boolean;
  error: string | null;
};

export type MlCounts = {
  entry: number;
  exit: number;
  occupancy: number;
  running: boolean;
  status: string;
  started_at: string | null;
  error: string | null;
};

export type CameraTestResult = {
  ok: boolean;
  message: string;
};

export const DEFAULT_ML_SERVICE_BASE_URL = import.meta.env.VITE_ML_SERVICE_URL ?? "http://127.0.0.1:8765";

export const EMPTY_ML_COUNTS: MlCounts = {
  entry: 0,
  exit: 0,
  occupancy: 0,
  running: false,
  status: "stopped",
  started_at: null,
  error: null,
};

export async function getMlServiceStatus(): Promise<MlServiceStatus> {
  if (window.tanawMlService) {
    try {
      return await window.tanawMlService.getStatus();
    } catch {
      return { baseUrl: DEFAULT_ML_SERVICE_BASE_URL, error: "Electron ML service bridge is unavailable.", pid: null, running: false };
    }
  }

  return { baseUrl: DEFAULT_ML_SERVICE_BASE_URL, error: null, pid: null, running: false };
}

export async function restartMlService(): Promise<MlServiceStatus> {
  if (!window.tanawMlService) {
    return { baseUrl: DEFAULT_ML_SERVICE_BASE_URL, error: "Restart is only available inside Electron.", pid: null, running: false };
  }

  return window.tanawMlService.restart();
}

export async function getMlHealth(baseUrl: string): Promise<MlHealth> {
  return requestJson<MlHealth>(`${baseUrl}/health`, { method: "GET" }, 2500);
}

export async function getMlCounts(baseUrl: string): Promise<MlCounts> {
  return requestJson<MlCounts>(`${baseUrl}/counts`, { method: "GET" }, 2500);
}

export async function testCameraConnection(baseUrl: string, streamUrl: string): Promise<CameraTestResult> {
  return requestJson<CameraTestResult>(
    `${baseUrl}/camera/test`,
    {
      method: "POST",
      body: JSON.stringify({ stream_url: streamUrl }),
    },
    8000,
  );
}

export async function startCameraProcessing(baseUrl: string, camera: Camera): Promise<{ message: string }> {
  return requestJson<{ message: string }>(
    `${baseUrl}/camera/start`,
    {
      method: "POST",
      body: JSON.stringify({
        camera_name: camera.name,
        camera_type: camera.cameraType,
        confidence: camera.confidence,
        password: camera.password || null,
        reverse_direction: camera.config.reverse,
        stream_url: camera.rtsp,
        tripwire_position: camera.config.tripwire / 100,
        username: camera.username || null,
      }),
    },
    12_000,
  );
}

export async function stopCameraProcessing(baseUrl: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>(`${baseUrl}/camera/stop`, { method: "POST" }, 5000);
}

export function getStreamUrl(baseUrl: string, version: number) {
  return `${baseUrl}/stream?v=${version}`;
}

async function requestJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The ML service did not respond in time.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}
