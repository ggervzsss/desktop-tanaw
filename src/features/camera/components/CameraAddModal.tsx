import { Check, RefreshCw, Shield, Video, X } from "lucide-react";
import type { FormEvent } from "react";
import { ModalPortal } from "../../../components/ModalPortal";
import type { CameraFormValues } from "../types/camera";

type CameraAddModalProps = {
  newCam: CameraFormValues;
  isValidating: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (values: CameraFormValues) => void;
};

export function CameraAddModal({ newCam, isValidating, onClose, onSubmit, onChange }: CameraAddModalProps) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-1000 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
        <div className="animate-in fade-in w-full max-w-lg rounded-sm border-t-4 border-[#065f46] bg-white p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111827]">
              <Video size={20} className="text-[#065f46]" /> Register Camera Node
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-[#111827]">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">Camera Name</label>
              <input
                required
                type="text"
                value={newCam.name}
                onChange={(event) => onChange({ ...newCam, name: event.target.value })}
                placeholder="e.g., South Gate Main"
                className="w-full rounded-sm border border-gray-300 p-2.5 text-sm outline-none focus:border-[#065f46]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">Assigned Zone</label>
              <input
                required
                type="text"
                value={newCam.zone}
                onChange={(event) => onChange({ ...newCam, zone: event.target.value })}
                placeholder="e.g., Lobby"
                className="w-full rounded-sm border border-gray-300 p-2.5 text-sm outline-none focus:border-[#065f46]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">RTSP Stream URL</label>
              <input
                required
                type="text"
                value={newCam.rtsp}
                onChange={(event) => onChange({ ...newCam, rtsp: event.target.value })}
                placeholder="rtsp://username:password@ip:port/stream"
                className="w-full rounded-sm border border-gray-300 p-2.5 font-mono text-sm outline-none focus:border-[#065f46]"
              />
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-sm border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <Shield size={16} className="mt-0.5 shrink-0" />
              <p>Credentials are processed locally on the edge node. Video streams are never transmitted to the cloud.</p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={onClose} className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isValidating}
                className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-gray-400"
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Validating Stream...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Connect Node
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
