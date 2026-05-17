import React from "react";
import { Maximize, Move } from "lucide-react";
import type { Camera } from "../../../types/enterprise";

type CameraEditControlsProps = {
  editForm: Camera;
  onEditFormChange: React.Dispatch<React.SetStateAction<Camera | null>>;
};

const roiFields = [
  { label: "Top Offset", key: "top", min: 0, max: 50 },
  { label: "Left Offset", key: "left", min: 0, max: 50 },
  { label: "Width Coverage", key: "width", min: 20, max: 100 },
  { label: "Height Coverage", key: "height", min: 20, max: 100 },
] as const;

export function CameraEditControls({ editForm, onEditFormChange }: CameraEditControlsProps) {
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
          {roiFields.map(({ label, key, min, max }) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">{label}</label>
              <input
                type="range"
                min={min}
                max={max}
                value={editForm.config.roi[key]}
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
