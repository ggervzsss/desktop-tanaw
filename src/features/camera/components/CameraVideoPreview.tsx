import { useEffect, useRef, useState } from "react";
import type { Camera } from "../../../types/enterprise";
import type { MlDetections } from "../services/ml-service";
import { CameraOverlayConfig } from "./CameraOverlayConfig";

type CameraVideoPreviewProps = {
  activeCam: Camera;
  detections: MlDetections;
  editForm: Camera | null;
  isProcessing: boolean;
  isEditMode: boolean;
  streamUrl: string;
};

type ContentRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export function CameraVideoPreview({ activeCam, detections, editForm, isProcessing, isEditMode, streamUrl }: CameraVideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [contentRect, setContentRect] = useState<ContentRect | null>(null);
  const streamIsAvailable = isProcessing && streamUrl;
  const overlayConfig = isEditMode && editForm ? editForm.config : activeCam.config;
  const frameWidth = detections.frame_width ?? 0;
  const frameHeight = detections.frame_height ?? 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || frameWidth <= 0 || frameHeight <= 0) {
      setContentRect(null);
      return;
    }

    const updateContentRect = () => {
      const bounds = container.getBoundingClientRect();
      const frameAspect = frameWidth / frameHeight;
      const containerAspect = bounds.width / bounds.height;

      if (containerAspect > frameAspect) {
        const width = bounds.height * frameAspect;
        setContentRect({ height: bounds.height, left: (bounds.width - width) / 2, top: 0, width });
        return;
      }

      const height = bounds.width / frameAspect;
      setContentRect({ height, left: 0, top: (bounds.height - height) / 2, width: bounds.width });
    };

    updateContentRect();

    const resizeObserver = new ResizeObserver(updateContentRect);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [frameHeight, frameWidth]);

  return (
    <div ref={containerRef} className={`relative mb-5 aspect-video w-full overflow-hidden rounded-sm bg-[#111827] ${isEditMode ? "ring-2 ring-[#065f46] ring-offset-2" : ""}`}>
      {streamIsAvailable ? (
        <img key={streamUrl} src={streamUrl} alt={`${activeCam.name} live camera stream`} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      ) : activeCam.status === "online" || activeCam.status === "untested" || activeCam.status === "stopped" ? (
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg')] bg-cover bg-center opacity-40"></div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-sm font-bold tracking-wider text-red-500 uppercase">Stream Offline</div>
      )}
      {!streamIsAvailable && <div className="absolute inset-0 bg-black/30"></div>}

      <CameraOverlayConfig config={overlayConfig} isEditMode={isEditMode} />
      {streamIsAvailable && contentRect && frameWidth > 0 && frameHeight > 0 && (
        <div className="pointer-events-none absolute" style={{ height: contentRect.height, left: contentRect.left, top: contentRect.top, width: contentRect.width }}>
          {detections.tracks.map((track) => {
            const [x1, y1, x2, y2] = track.bbox;
            const left = clampPercent((Math.min(x1, x2) / frameWidth) * 100);
            const right = clampPercent((Math.max(x1, x2) / frameWidth) * 100);
            const top = clampPercent((Math.min(y1, y2) / frameHeight) * 100);
            const bottom = clampPercent((Math.max(y1, y2) / frameHeight) * 100);
            const width = Math.max(0, right - left);
            const height = Math.max(0, bottom - top);
            const isCrossing = track.direction === "entry" || track.direction === "exit";
            const label = track.track_id > 0 ? `ID ${track.track_id}` : "PERSON";

            return (
              <div
                key={track.track_id}
                className={`absolute border-2 shadow-[0_0_10px_rgba(34,197,94,0.35)] ${isCrossing ? "border-yellow-300" : "border-emerald-400"}`}
                style={{ height: `${height}%`, left: `${left}%`, top: `${top}%`, width: `${width}%` }}
              >
                <span className={`absolute -top-6 left-0 rounded-sm px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-black ${isCrossing ? "bg-yellow-300" : "bg-emerald-400"}`}>
                  {label} {(track.confidence * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(streamIsAvailable || activeCam.status === "online") && (
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="flex items-center gap-1 rounded-sm border border-green-500/50 bg-black/60 px-2 py-1 text-[10px] font-bold text-green-400 shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span> LIVE
          </span>
          <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.fps} FPS</span>
          <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.resolution}</span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 font-['Bai_Jamjuree'] text-2xl font-bold text-white/30 select-none">{streamIsAvailable ? "TANAW Live Feed" : "TANAW Edge Preview"}</div>
    </div>
  );
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
