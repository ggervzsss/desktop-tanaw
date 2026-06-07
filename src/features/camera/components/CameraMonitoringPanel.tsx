import { Activity, Cpu, LogIn, LogOut, Play, RefreshCw, Square, Users, Wifi } from "lucide-react";
import type { Camera } from "../../../types/enterprise";
import type { MlCounts, MlHealth, MlServiceStatus } from "../services/ml-service";

type CameraMonitoringPanelProps = {
  activeCam: Camera;
  counts: MlCounts;
  health: MlHealth | null;
  processingCameraId: number | null;
  serviceStatus: MlServiceStatus | null;
  error: string | null;
  isRestartingService: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isTesting: boolean;
  onRestartService: () => void;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
  onTestConnection: () => void;
};

export function CameraMonitoringPanel({
  activeCam,
  counts,
  health,
  processingCameraId,
  serviceStatus,
  error,
  isRestartingService,
  isStarting,
  isStopping,
  isTesting,
  onRestartService,
  onStartProcessing,
  onStopProcessing,
  onTestConnection,
}: CameraMonitoringPanelProps) {
  const isProcessingThisCamera = processingCameraId === activeCam.id && counts.running;
  const serviceOnline = health?.status === "ok";
  const serviceLabel = serviceOnline ? (health.running ? "ML Service Running" : "ML Service Ready") : "ML Service Offline";
  const cameraLabel = isProcessingThisCamera ? "Processing" : activeCam.status === "online" ? "Verified" : activeCam.status === "untested" ? "Untested" : "Stopped";
  const reidLabel = health?.reid_status === "ready" ? `Unique ReID ${health.reid_gallery_size}` : health?.reid_status === "degraded" ? "Unique ReID Degraded" : health?.reid_model_loading ? "Unique ReID Loading" : "Unique ReID Pending";
  const reidTone = health?.reid_status === "ready" ? "ok" : health?.reid_status === "degraded" ? "neutral" : "neutral";

  return (
    <div className="mb-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <CountBox icon={LogIn} label="Entry Count" value={counts.entry} tone="entry" />
        <CountBox icon={LogOut} label="Exit Count" value={counts.exit} tone="exit" />
        <CountBox icon={Users} label="Current Occupancy" value={counts.occupancy} tone="occupancy" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <StatusPill icon={Activity} label={serviceLabel} tone={serviceOnline ? "ok" : "error"} />
          <StatusPill icon={Wifi} label={`Camera ${cameraLabel}`} tone={isProcessingThisCamera || activeCam.status === "online" ? "ok" : activeCam.status === "error" || activeCam.status === "offline" ? "error" : "neutral"} />
          {health && <StatusPill icon={Cpu} label={reidLabel} tone={reidTone} />}
          {serviceStatus?.pid && <span className="rounded-sm border border-gray-200 bg-gray-50 px-2 py-1 text-gray-500">PID {serviceStatus.pid}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestartService}
            disabled={isRestartingService}
            className="flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={isRestartingService ? "animate-spin" : ""} /> Service
          </button>
          <button
            type="button"
            onClick={onTestConnection}
            disabled={isTesting || isProcessingThisCamera}
            className="flex items-center gap-1.5 rounded-sm border border-[#065f46]/30 bg-white px-3 py-2 text-xs font-bold text-[#065f46] transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wifi size={14} /> {isTesting ? "Testing..." : "Test Connection"}
          </button>
          <button
            type="button"
            onClick={onStartProcessing}
            disabled={isStarting || isProcessingThisCamera}
            className="flex items-center gap-1.5 rounded-sm bg-[#065f46] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Play size={14} /> {isStarting ? "Starting..." : "Start Processing"}
          </button>
          <button
            type="button"
            onClick={onStopProcessing}
            disabled={isStopping || !counts.running}
            className="flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Square size={14} /> {isStopping ? "Stopping..." : "Stop Processing"}
          </button>
        </div>
      </div>

      {(error || health?.error || serviceStatus?.error || counts.error) && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error ?? health?.error ?? serviceStatus?.error ?? counts.error}</div>
      )}
    </div>
  );
}

type CountBoxProps = {
  icon: typeof LogIn;
  label: string;
  tone: "entry" | "exit" | "occupancy";
  value: number;
};

function CountBox({ icon: Icon, label, tone, value }: CountBoxProps) {
  const toneClass = {
    entry: "border-emerald-200 bg-emerald-50 text-[#065f46]",
    exit: "border-red-200 bg-red-50 text-red-700",
    occupancy: "border-blue-200 bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className={`rounded-sm border p-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-wider uppercase">{label}</span>
        <Icon size={16} />
      </div>
      <div className="mt-2 font-['Bai_Jamjuree'] text-3xl font-bold leading-none">{value}</div>
    </div>
  );
}

type StatusPillProps = {
  icon: typeof Activity;
  label: string;
  tone: "ok" | "neutral" | "error";
};

function StatusPill({ icon: Icon, label, tone }: StatusPillProps) {
  const toneClass = {
    error: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-gray-200 bg-gray-50 text-gray-600",
    ok: "border-emerald-200 bg-emerald-50 text-[#065f46]",
  }[tone];

  return (
    <span className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 ${toneClass}`}>
      <Icon size={13} /> {label}
    </span>
  );
}
