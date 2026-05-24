import { AlertCircle, AlertTriangle } from "lucide-react";

export function AnalyticsProtocolBanner() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-sm border border-gray-200 bg-gray-50 p-5 shadow-inner md:flex-row">
      <div className="mt-0.5 shrink-0 rounded-full border border-gray-100 bg-white p-2 text-[#065f46] shadow-sm">
        <AlertCircle size={20} />
      </div>
      <div className="flex-1">
        <h4 className="mb-1.5 text-sm font-bold tracking-wider text-[#111827] uppercase">AI Analytics & Data Accuracy Protocol</h4>
        <p className="max-w-4xl text-xs leading-relaxed font-medium text-gray-600">
          The <strong>Estimated Unique People Count</strong> metric distinguishes distinct visitors from total entry events using edge-processing logic to reduce duplicate counts (e.g., staff
          re-entering). This system-generated value is required for official LGU tourism reports and cannot be manually overridden by Enterprise accounts.
        </p>
        <div className="text-tanaw-red mt-3 flex w-fit items-center gap-2 rounded-sm border border-[#ffd200]/30 bg-[#ffd200]/10 px-3 py-2">
          <AlertTriangle size={14} />
          <p className="text-[10px] font-bold tracking-wide uppercase">Note: Accuracy may be affected by camera angle, lighting, occlusion, and crowd density.</p>
        </div>
      </div>
    </div>
  );
}
