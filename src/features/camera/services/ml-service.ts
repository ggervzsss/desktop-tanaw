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
  model_loaded: boolean;
  model_ready: boolean;
  model_loading: boolean;
  device: string | null;
  model_path: string | null;
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

export type MlDetectionTrack = {
  track_id: number;
  bbox: [number, number, number, number];
  confidence: number;
  centroid: [number, number];
  direction: string | null;
};

export type MlDetections = {
  running: boolean;
  status: string;
  error: string | null;
  frame_width: number | null;
  frame_height: number | null;
  tracks: MlDetectionTrack[];
};

export type MlSession = {
  running: boolean;
  status: string;
  error: string | null;
  camera_id: number | null;
  camera_name: string | null;
  camera_config: Record<string, unknown> | null;
  counts: MlCounts;
  updated_at: string | null;
};

export type LocalMetricsSummary = {
  entries: number;
  exits: number;
  peak_occupancy: number;
  current_occupancy: number;
  unique_count: number;
  total_events: number;
  unsubmitted_events: number;
  unsynced_events: number;
  first_event_at: string | null;
  last_event_at: string | null;
};

export type LocalReportSubmission = LocalMetricsSummary & {
  report_id: string;
  submitted_at: string;
  sync_status: string;
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

export const EMPTY_ML_DETECTIONS: MlDetections = {
  running: false,
  status: "stopped",
  error: null,
  frame_width: null,
  frame_height: null,
  tracks: [],
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

export async function getMlSession(baseUrl: string): Promise<MlSession> {
  return requestJson<MlSession>(`${baseUrl}/session`, { method: "GET" }, 2500);
}

export async function restoreMlSession(baseUrl: string): Promise<MlSession> {
  return requestJson<MlSession>(`${baseUrl}/session/restore`, { method: "POST" }, 8000);
}

export async function getLocalMetricsSummary(baseUrl: string): Promise<LocalMetricsSummary> {
  return requestJson<LocalMetricsSummary>(`${baseUrl}/metrics/summary`, { method: "GET" }, 2500);
}

export async function recordLocalReportSubmission(baseUrl: string, payload: { reportId: string; period: string; notes: string; reportPayload: Record<string, unknown> }): Promise<LocalReportSubmission> {
  return requestJson<LocalReportSubmission>(
    `${baseUrl}/reports/local-submit`,
    {
      method: "POST",
      body: JSON.stringify({
        notes: payload.notes || null,
        payload: payload.reportPayload,
        period: payload.period,
        report_id: payload.reportId,
      }),
    },
    5000,
  );
}

export async function getMlDetections(baseUrl: string): Promise<MlDetections> {
  return requestJson<MlDetections>(`${baseUrl}/detections`, { method: "GET" }, 2500);
}

export async function testCameraConnection(baseUrl: string, camera: Camera): Promise<CameraTestResult> {
  return requestJson<CameraTestResult>(
    `${baseUrl}/camera/test`,
    {
      method: "POST",
      body: JSON.stringify({
        camera_type: camera.cameraType,
        password: camera.password || null,
        stream_url: camera.rtsp,
        username: camera.username || null,
      }),
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
        camera_id: camera.id,
        camera_type: camera.cameraType,
        confidence: camera.confidence,
        entry_line: toMlTripwireLine(camera.config.tripwires.entry),
        exit_line: toMlTripwireLine(camera.config.tripwires.exit),
        max_frame_width: 640,
        password: camera.password || null,
        processing_fps: 5,
        reverse_direction: camera.config.reverse,
        stream_fps: 24,
        stream_url: camera.rtsp,
        tripwire_position: camera.config.tripwire / 100,
        username: camera.username || null,
      }),
    },
    30_000,
  );
}

export async function stopCameraProcessing(baseUrl: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>(`${baseUrl}/camera/stop`, { method: "POST" }, 5000);
}

export function getStreamUrl(baseUrl: string, version: number) {
  return `${baseUrl}/stream?v=${version}`;
}

export function getPreviewStreamUrl(baseUrl: string, camera: Camera | undefined, version: number) {
  if (camera && isNativeBrowserMjpegCamera(camera)) {
    return camera.rtsp.trim();
  }

  return getStreamUrl(baseUrl, version);
}

function isNativeBrowserMjpegCamera(camera: Camera) {
  return camera.cameraType === "IP_WEBCAM" && /^https?:\/\//i.test(camera.rtsp.trim());
}

function toMlTripwireLine(line: Camera["config"]["tripwires"]["entry"]) {
  return {
    start: { x: line.start.x / 100, y: line.start.y / 100 },
    end: { x: line.end.x / 100, y: line.end.y / 100 },
  };
}

async function requestJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: buildHeaders(init),
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

function buildHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  const hasJsonBody = typeof init.body === "string";

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}
