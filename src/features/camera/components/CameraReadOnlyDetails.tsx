import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Camera } from "../../../types/enterprise";

type CameraReadOnlyDetailsProps = {
  activeCam: Camera;
};

export function CameraReadOnlyDetails({ activeCam }: CameraReadOnlyDetailsProps) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Stream URL</label>
        <input type="text" readOnly value={activeCam.rtsp} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 font-mono text-sm text-gray-600 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Assigned Zone</label>
        <input type="text" readOnly value={activeCam.zone} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Camera Type</label>
        <div className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800">{formatCameraType(activeCam.cameraType)}</div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Confidence Threshold</label>
        <div className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800">{activeCam.confidence.toFixed(2)}</div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Counting Logic</label>
        <div className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800">{activeCam.config.reverse ? "Right-to-left Entry" : "Left-to-right Entry"}</div>
      </div>
      <div className="flex items-center">
        <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${["online", "running"].includes(activeCam.status) ? "text-[#065f46]" : "text-red-600"}`}>
          {["online", "running"].includes(activeCam.status) ? (
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

function formatCameraType(cameraType: Camera["cameraType"]) {
  const labels: Record<Camera["cameraType"], string> = {
    IP_WEBCAM: "IP Webcam",
    ONVIF_CCTV: "ONVIF CCTV",
    RTSP_CCTV: "RTSP CCTV",
    USB_WEBCAM: "USB Webcam",
  };

  return labels[cameraType];
}
