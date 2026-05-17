import { Check, Send } from "lucide-react";
import { ModalPortal } from "../../../components/ModalPortal";

type SubmitReportDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function SubmitReportDialog({ onCancel, onConfirm }: SubmitReportDialogProps) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-1000 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
        <div className="animate-in fade-in w-full max-w-md rounded-sm border-t-4 border-[#065f46] bg-white p-6 shadow-2xl">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#111827]">
            <Send size={20} className="text-[#065f46]" /> Confirm Submission
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            Are you sure you want to submit this report to the LGU Admin? This action will finalize current system metrics and lock further edits.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-gray-50">
              Edit Draft
            </button>
            <button onClick={onConfirm} className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]">
              <Check size={16} /> Yes, Submit
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
