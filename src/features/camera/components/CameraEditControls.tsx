import React from "react";
import { Maximize, Video } from "lucide-react";
import type { Camera } from "../../../types/enterprise";
import { TapoRtspBuilder } from "./TapoRtspBuilder";

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
  const isRtspCamera = editForm.cameraType === "RTSP_CCTV" || editForm.cameraType === "ONVIF_CCTV";
  const updateRoi = (key: keyof Camera["config"]["roi"], value: number) => {
    onEditFormChange({
      ...editForm,
      config: {
        ...editForm.config,
        roi: clampRoi({
          ...editForm.config.roi,
          [key]: value,
        }, key),
      },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 rounded-sm border border-gray-200 bg-white p-4 shadow-inner md:grid-cols-2">
      <div className="md:col-span-2">
        <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
          <Video size={14} className="text-[#065f46]" /> Camera Stream
        </h4>
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_140px]">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Stream URL</label>
            <input
              type="text"
              value={editForm.rtsp}
              onChange={(event) => onEditFormChange({ ...editForm, rtsp: event.target.value })}
              className="w-full rounded-sm border border-gray-300 p-2 font-mono text-sm text-gray-800 outline-none transition focus:border-[#065f46]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Camera Type</label>
            <select
              value={editForm.cameraType}
              onChange={(event) => onEditFormChange({ ...editForm, cameraType: event.target.value as Camera["cameraType"] })}
              className="w-full rounded-sm border border-gray-300 p-2 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#065f46]"
            >
              <option value="IP_WEBCAM">IP Webcam</option>
              <option value="RTSP_CCTV">RTSP CCTV</option>
              <option value="USB_WEBCAM">USB Webcam</option>
              <option value="ONVIF_CCTV">ONVIF CCTV</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Confidence</label>
            <input
              type="number"
              min="0.05"
              max="0.95"
              step="0.05"
              value={editForm.confidence}
              onChange={(event) => onEditFormChange({ ...editForm, confidence: Number(event.target.value) })}
              className="w-full rounded-sm border border-gray-300 p-2 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#065f46]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Username</label>
            <input
              type="text"
              value={editForm.username ?? ""}
              onChange={(event) => onEditFormChange({ ...editForm, username: event.target.value })}
              className="w-full rounded-sm border border-gray-300 p-2 text-sm text-gray-800 outline-none transition focus:border-[#065f46]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Password</label>
            <input
              type="password"
              value={editForm.password ?? ""}
              onChange={(event) => onEditFormChange({ ...editForm, password: event.target.value })}
              className="w-full rounded-sm border border-gray-300 p-2 text-sm text-gray-800 outline-none transition focus:border-[#065f46]"
            />
          </div>
        </div>
        {isRtspCamera && (
          <div className="mt-4">
            <TapoRtspBuilder streamUrl={editForm.rtsp} onStreamUrlChange={(rtsp) => onEditFormChange({ ...editForm, rtsp })} />
          </div>
        )}
      </div>

      <div className="md:col-span-2">
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
                onChange={(event) => updateRoi(key, parseInt(event.target.value, 10))}
                className="w-full accent-[#2d5eff]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function clampRoi(roi: Camera["config"]["roi"], changedKey: keyof Camera["config"]["roi"]) {
  const next = {
    top: clampNumber(roi.top, 0, 100),
    left: clampNumber(roi.left, 0, 100),
    width: clampNumber(roi.width, 20, 100),
    height: clampNumber(roi.height, 20, 100),
  };

  if (next.left + next.width > 100) {
    if (changedKey === "left") {
      next.left = Math.max(0, 100 - next.width);
    } else {
      next.width = Math.max(20, 100 - next.left);
    }
  }
  if (next.top + next.height > 100) {
    if (changedKey === "top") {
      next.top = Math.max(0, 100 - next.height);
    } else {
      next.height = Math.max(20, 100 - next.top);
    }
  }

  return next;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
