import { Check, Key, RefreshCw } from "lucide-react";
import type { FormEvent } from "react";
import { Card } from "../../../components/Card";

type CredentialControlProps = {
  isLoading: boolean;
  isSuccess: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CredentialControl({ isLoading, isSuccess, onSubmit }: CredentialControlProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
        <Key size={16} className="text-[#065f46]" /> Credential Control
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Current Password</label>
          <input type="password" placeholder="••••••••" className="w-full rounded-sm border border-gray-300 p-3 font-mono text-sm outline-none focus:border-[#065f46]" required />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">New Password</label>
            <input type="password" placeholder="••••••••" className="w-full rounded-sm border border-gray-300 p-3 font-mono text-sm outline-none focus:border-[#065f46]" required />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Confirm New Password</label>
            <input type="password" placeholder="••••••••" className="w-full rounded-sm border border-gray-300 p-3 font-mono text-sm outline-none focus:border-[#065f46]" required />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex min-w-45 items-center justify-center gap-2 rounded-sm bg-[#065f46] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-[#065f46]/70"
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : isSuccess ? <Check size={16} /> : <Key size={16} />}
            {isLoading ? "Updating..." : isSuccess ? "Password Updated" : "Update Password"}
          </button>
        </div>
      </form>
    </Card>
  );
}
