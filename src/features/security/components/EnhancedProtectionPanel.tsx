import { Shield } from "lucide-react";
import { Card } from "../../../components/Card";

type EnhancedProtectionPanelProps = {
  is2FAEnabled: boolean;
  onToggle2FA: () => void;
};

export function EnhancedProtectionPanel({ is2FAEnabled, onToggle2FA }: EnhancedProtectionPanelProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
        <Shield size={16} className="text-[#065f46]" /> Enhanced Protection
      </h3>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#111827]">Two-Factor Auth (2FA)</p>
          <p className="mt-1 text-[10px] text-gray-500">Require an extra security code when logging in.</p>
        </div>
        <button onClick={onToggle2FA} className={`relative flex h-6 w-12 items-center rounded-full transition-colors ${is2FAEnabled ? "bg-[#065f46]" : "bg-gray-300"}`}>
          <div className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${is2FAEnabled ? "translate-x-7" : "translate-x-1"}`}></div>
        </button>
      </div>
    </Card>
  );
}
