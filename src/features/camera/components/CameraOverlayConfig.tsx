import type { Camera } from "../../../types/enterprise";

type CameraOverlayConfigProps = {
  config: Camera["config"];
  isEditMode: boolean;
};

export function CameraOverlayConfig({ config, isEditMode }: CameraOverlayConfigProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={`absolute border-2 border-dashed ${isEditMode ? "border-[#2d5eff] bg-[#2d5eff]/10" : "border-[#2d5eff]/60 bg-[#2d5eff]/5"}`}
        style={{
          top: `${config.roi.top}%`,
          left: `${config.roi.left}%`,
          width: `${config.roi.width}%`,
          height: `${config.roi.height}%`,
        }}
      >
        <span className="absolute right-1 bottom-1 rounded-sm bg-white/90 px-1 text-[9px] font-bold text-[#2d5eff] shadow-sm">ROI</span>
      </div>

      <div className={`absolute h-full w-0.5 shadow-[0_0_8px_rgba(255,210,0,0.8)] ${isEditMode ? "bg-yellow-400" : "bg-yellow-400/80"}`} style={{ left: `${config.tripwire}%` }}>
        <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-sm bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black shadow-md">
          {config.reverse ? (
            <>
              ENTRY <span className="text-sm font-black">←</span> EXIT <span className="text-sm font-black">→</span>
            </>
          ) : (
            <>
              EXIT <span className="text-sm font-black">←</span> ENTRY <span className="text-sm font-black">→</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
