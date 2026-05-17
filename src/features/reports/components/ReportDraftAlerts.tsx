import { AlertTriangle, MessageSquare } from "lucide-react";
import type { ReportRecord } from "../../../types/enterprise";

type ReportDraftAlertsProps = {
  activeReport: ReportRecord | null;
  isError: boolean;
  isReadOnly: boolean;
};

export function ReportDraftAlerts({ activeReport, isError, isReadOnly }: ReportDraftAlertsProps) {
  return (
    <>
      {activeReport?.status === "Returned for Revision" && (
        <div className="mb-5 rounded-sm border border-[#ffd200]/40 bg-[#ffd200]/10 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#a40e0e] uppercase">
            <MessageSquare size={14} /> Staff Remarks
          </h4>
          <p className="text-xs leading-relaxed font-medium text-[#a40e0e]">{activeReport.remarks}</p>
        </div>
      )}

      {isError && !isReadOnly && (
        <div className="mb-5 flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-4 shadow-inner">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <h4 className="mb-1 text-[10px] font-bold tracking-wider text-red-800 uppercase">Data Validation Error</h4>
            <p className="text-xs leading-relaxed text-red-700">Peak Occupancy cannot exceed Total Entries. Check your edge logic configs before submitting.</p>
          </div>
        </div>
      )}
    </>
  );
}
