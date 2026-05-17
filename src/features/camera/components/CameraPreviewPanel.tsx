import React from "react";
import { AlertTriangle, CheckCircle, Edit2, Maximize, Move, Save, Trash2, Video } from "lucide-react";
import { Card } from "../../../components/Card";
import type { Camera } from "../../../types/enterprise";
import { CameraValidationWarnings } from "./CameraValidationWarnings";

type CameraPreviewPanelProps = {
  activeCam?: Camera;
  editForm: Camera | null;
  isEditMode: boolean;
  warnings: string[];
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: () => void;
  onEditFormChange: React.Dispatch<React.SetStateAction<Camera | null>>;
};

export function CameraPreviewPanel({ activeCam, editForm, isEditMode, warnings, onCancelEdit, onDelete, onEdit, onSave, onEditFormChange }: CameraPreviewPanelProps) {
  if (!activeCam) {
    return (
      <Card className="flex h-full min-h-100 flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-transparent p-8 shadow-none">
        <Video size={48} className="mb-4 text-gray-300" />
        <h3 className="text-lg font-bold text-gray-500">No Camera Selected</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-gray-400">Select a node from the list or add a new camera to configure its edge processing properties.</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-sm shadow-md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#111827]">
          Node Config: <span className="text-[#065f46]">{activeCam.name}</span>
        </h3>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <button onClick={onCancelEdit} className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={onSave} className="flex items-center gap-1.5 rounded-sm bg-[#065f46] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]">
                <Save size={14} /> Save Config
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-[#065f46] hover:text-[#065f46]"
                title="Edit Configuration"
              >
                <Edit2 size={14} />
              </button>
              <button onClick={onDelete} className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-red-600 hover:text-red-600" title="Delete Node">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-gray-50 p-5">
        <CameraVideoPreview activeCam={activeCam} editForm={editForm} isEditMode={isEditMode} />
        <CameraValidationWarnings warnings={warnings} />
        {isEditMode && editForm ? <CameraEditControls editForm={editForm} onEditFormChange={onEditFormChange} /> : <CameraReadOnlyDetails activeCam={activeCam} />}
      </div>
    </Card>
  );
}

function CameraVideoPreview({ activeCam, editForm, isEditMode }: Pick<CameraPreviewPanelProps, "activeCam" | "editForm" | "isEditMode"> & { activeCam: Camera }) {
  return (
    <div className={`relative mb-5 aspect-video w-full overflow-hidden rounded-sm bg-[#111827] ${isEditMode ? "ring-2 ring-[#065f46] ring-offset-2" : ""}`}>
      {activeCam.status === "online" ? (
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg')] bg-cover bg-center opacity-40"></div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-sm font-bold tracking-wider text-red-500 uppercase">Stream Offline</div>
      )}
      <div className="absolute inset-0 bg-black/30"></div>

      {activeCam.status === "online" && <CameraOverlayConfig config={isEditMode && editForm ? editForm.config : activeCam.config} isEditMode={isEditMode} />}

      {activeCam.status === "online" && (
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="flex items-center gap-1 rounded-sm border border-green-500/50 bg-black/60 px-2 py-1 text-[10px] font-bold text-green-400 shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span> LIVE
          </span>
          <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.fps} FPS</span>
          <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.resolution}</span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 font-['Bai_Jamjuree'] text-2xl font-bold text-white/30 select-none">TANAW Edge Preview</div>
    </div>
  );
}

function CameraOverlayConfig({ config, isEditMode }: { config: Camera["config"]; isEditMode: boolean }) {
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

      <div className={`absolute h-0.5 w-full shadow-[0_0_8px_rgba(255,210,0,0.8)] ${isEditMode ? "bg-yellow-400" : "bg-yellow-400/80"}`} style={{ top: `${config.tripwire}%` }}>
        <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-sm bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black shadow-md">
          {config.reverse ? (
            <>
              EXIT <span className="text-sm font-black">↓</span> ENTRY <span className="text-sm font-black">↑</span>
            </>
          ) : (
            <>
              ENTRY <span className="text-sm font-black">↓</span> EXIT <span className="text-sm font-black">↑</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CameraEditControls({ editForm, onEditFormChange }: { editForm: Camera; onEditFormChange: React.Dispatch<React.SetStateAction<Camera | null>> }) {
  return (
    <div className="grid grid-cols-1 gap-6 rounded-sm border border-gray-200 bg-white p-4 shadow-inner md:grid-cols-2">
      <div>
        <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
          <Move size={14} className="text-[#065f46]" /> Tripwire Config
        </h4>
        <div className="space-y-4">
          <div>
            <label className="mb-2 flex justify-between text-xs font-semibold text-gray-600">
              <span>Y-Axis Position</span> <span className="font-mono text-[#065f46]">{editForm.config.tripwire}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="90"
              value={editForm.config.tripwire}
              onChange={(event) => onEditFormChange({ ...editForm, config: { ...editForm.config, tripwire: parseInt(event.target.value, 10) } })}
              className="w-full accent-[#065f46]"
            />
          </div>
          <div className="flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 p-2">
            <span className="text-xs font-semibold text-gray-700">Direction Logic Swap</span>
            <button
              onClick={() => onEditFormChange({ ...editForm, config: { ...editForm.config, reverse: !editForm.config.reverse } })}
              className={`rounded-sm px-3 py-1 text-xs font-bold transition-colors ${editForm.config.reverse ? "bg-[#111827] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              {editForm.config.reverse ? "Swapped (Out/In)" : "Default (In/Out)"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
          <Maximize size={14} className="text-[#2d5eff]" /> Region of Interest
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            ["Top Offset", "top", 0, 50],
            ["Left Offset", "left", 0, 50],
            ["Width Coverage", "width", 20, 100],
            ["Height Coverage", "height", 20, 100],
          ].map(([label, key, min, max]) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">{label}</label>
              <input
                type="range"
                min={min}
                max={max}
                value={editForm.config.roi[key as keyof Camera["config"]["roi"]]}
                onChange={(event) =>
                  onEditFormChange({
                    ...editForm,
                    config: {
                      ...editForm.config,
                      roi: {
                        ...editForm.config.roi,
                        [key]: parseInt(event.target.value, 10),
                      },
                    },
                  })
                }
                className="w-full accent-[#2d5eff]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CameraReadOnlyDetails({ activeCam }: { activeCam: Camera }) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">RTSP Stream URL</label>
        <input type="text" readOnly value={activeCam.rtsp} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 font-mono text-sm text-gray-600 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Assigned Zone</label>
        <input type="text" readOnly value={activeCam.zone} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Counting Logic</label>
        <div className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800">{activeCam.type}</div>
      </div>
      <div className="flex items-center">
        <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${activeCam.status === "online" ? "text-[#065f46]" : "text-red-600"}`}>
          {activeCam.status === "online" ? (
            <>
              <CheckCircle size={18} /> Stream Verified
            </>
          ) : (
            <>
              <AlertTriangle size={18} /> Stream Disconnected
            </>
          )}
        </div>
      </div>
    </div>
  );
}
