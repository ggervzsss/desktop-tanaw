import type { Camera } from "../../../types/enterprise";
import { CameraOverlayConfig } from "./CameraOverlayConfig";

type CameraVideoPreviewProps = {
  activeCam: Camera;
  editForm: Camera | null;
  isProcessing: boolean;
  isEditMode: boolean;
  streamUrl: string;
};

export function CameraVideoPreview({ activeCam, editForm, isProcessing, isEditMode, streamUrl }: CameraVideoPreviewProps) {
  const streamIsAvailable = isProcessing && streamUrl;
  const overlayConfig = isEditMode && editForm ? editForm.config : activeCam.config;

  return (
    <div className={`relative mb-5 aspect-video w-full overflow-hidden rounded-sm bg-[#111827] ${isEditMode ? "ring-2 ring-[#065f46] ring-offset-2" : ""}`}>
      {streamIsAvailable ? (
        <img key={streamUrl} src={streamUrl} alt={`${activeCam.name} live camera stream`} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      ) : activeCam.status === "online" || activeCam.status === "untested" || activeCam.status === "stopped" ? (
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg')] bg-cover bg-center opacity-40"></div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-sm font-bold tracking-wider text-red-500 uppercase">Stream Offline</div>
      )}
      {!streamIsAvailable && <div className="absolute inset-0 bg-black/30"></div>}

      <CameraOverlayConfig config={overlayConfig} isEditMode={isEditMode} />

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
