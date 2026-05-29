import { Shield } from "lucide-react";
import { Card } from "../../../components/Card";

export function EnhancedProtectionPanel() {
  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
        <Shield size={16} className="text-[#065f46]" /> Enhanced Protection
      </h3>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#111827]">Two-Factor Auth (2FA)</p>
          <p className="mt-1 text-[10px] text-gray-500">Not configured for this local deployment.</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">Unavailable</span>
      </div>
    </Card>
  );
}
