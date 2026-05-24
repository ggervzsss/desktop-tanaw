import { Shield } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#111827]">Enterprise Analytics</h2>
        <p className="mt-1 text-sm text-gray-500">Real-time edge metrics restricted to this establishment.</p>
      </div>
      <div className="flex items-center gap-2 rounded-sm border border-gray-200 bg-gray-100 px-3 py-1.5">
        <Shield size={14} className="text-[#065f46]" />
        <span className="text-xs font-bold tracking-wider text-[#111827] uppercase">Read-Only View</span>
      </div>
    </div>
  );
}
