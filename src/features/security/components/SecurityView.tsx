import { type FormEvent, useState } from "react";
import { Check, Database, Download, Key, Monitor, MonitorSmartphone, Moon, RefreshCw, Shield, Smartphone, Sun } from "lucide-react";
import { Card } from "../../../components/Card";
import type { ThemePreference } from "../../../types/enterprise";

type SecurityViewProps = {
  theme: ThemePreference;
  setTheme: React.Dispatch<React.SetStateAction<ThemePreference>>;
};

export function SecurityView({ theme, setTheme }: SecurityViewProps) {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [isArchiveSuccess, setIsArchiveSuccess] = useState(false);

  const handlePasswordUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPasswordLoading(true);
    setTimeout(() => {
      setIsPasswordLoading(false);
      setIsPasswordSuccess(true);
      setTimeout(() => setIsPasswordSuccess(false), 3000);
    }, 1500);
  };

  const handleDataArchive = () => {
    setIsArchiveLoading(true);
    setTimeout(() => {
      setIsArchiveLoading(false);
      setIsArchiveSuccess(true);
      setTimeout(() => setIsArchiveSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="animate-in fade-in max-w-6xl space-y-6 font-['Inter'] duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Security & Data Control</h2>
        <p className="mt-1 text-sm text-gray-500">Manage credentials, active sessions, and system-wide preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Credential Control */}
          <Card className="p-6">
            <h3 className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
              <Key size={16} className="text-[#065f46]" /> Credential Control
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
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
                  disabled={isPasswordLoading}
                  className="flex min-w-45 items-center justify-center gap-2 rounded-sm bg-[#065f46] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-[#065f46]/70"
                >
                  {isPasswordLoading ? <RefreshCw size={16} className="animate-spin" /> : isPasswordSuccess ? <Check size={16} /> : <Key size={16} />}
                  {isPasswordLoading ? "Updating..." : isPasswordSuccess ? "Password Updated" : "Update Password"}
                </button>
              </div>
            </form>
          </Card>

          {/* Session Monitoring */}
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
                <MonitorSmartphone size={16} className="text-[#065f46]" /> Active Sessions
              </h3>
              <button className="text-[10px] font-bold text-[#a40e0e] hover:text-red-700 hover:underline sm:text-xs">Sign Out of All Other Devices</button>
            </div>
            <div className="overflow-x-auto rounded-sm border border-gray-200">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                  <tr>
                    <th className="border-b border-gray-200 p-3">Device</th>
                    <th className="border-b border-gray-200 p-3">Location</th>
                    <th className="border-b border-gray-200 p-3">Last Active</th>
                    <th className="border-b border-gray-200 p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="flex items-center gap-2 p-3 font-semibold text-[#111827]">
                      <Monitor size={14} className="text-[#065f46]" /> Mac Studio (Current)
                    </td>
                    <td className="p-3 font-medium text-gray-600">San Pedro, PH</td>
                    <td className="p-3 text-xs font-bold text-green-600">Active Now</td>
                    <td className="p-3 font-mono text-xs text-gray-500">192.168.1.45</td>
                  </tr>
                  <tr>
                    <td className="flex items-center gap-2 p-3 font-semibold text-[#111827]">
                      <Smartphone size={14} className="text-gray-400" /> iPhone 14 Pro
                    </td>
                    <td className="p-3 font-medium text-gray-600">Makati, PH</td>
                    <td className="p-3 text-xs font-medium text-gray-500">2 hours ago</td>
                    <td className="p-3 font-mono text-xs text-gray-500">112.198.100.22</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Enhanced Protection */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
              <Shield size={16} className="text-[#065f46]" /> Enhanced Protection
            </h3>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#111827]">Two-Factor Auth (2FA)</p>
                <p className="mt-1 text-[10px] text-gray-500">Require an extra security code when logging in.</p>
              </div>
              <button onClick={() => setIs2FAEnabled(!is2FAEnabled)} className={`relative flex h-6 w-12 items-center rounded-full transition-colors ${is2FAEnabled ? "bg-[#065f46]" : "bg-gray-300"}`}>
                <div className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${is2FAEnabled ? "translate-x-7" : "translate-x-1"}`}></div>
              </button>
            </div>
          </Card>

          {/* Theme Preference (Dark Mode) */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
              <Moon size={16} className="text-[#065f46]" /> Theme Preference
            </h3>
            <p className="mb-4 text-xs font-medium text-gray-500">Select your global interface aesthetic.</p>
            <div className="flex rounded-sm border border-gray-200 bg-gray-100 p-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-2 py-2 text-[10px] font-bold transition-colors sm:px-3 sm:text-xs ${theme === "light" ? "bg-white text-[#111827] shadow-sm dark:bg-[#0f172a] dark:text-white" : "text-gray-500 hover:text-[#111827] dark:text-gray-300 dark:hover:text-white"}`}
              >
                <Sun size={14} /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-2 py-2 text-[10px] font-bold transition-colors sm:px-3 sm:text-xs ${theme === "dark" ? "bg-white text-[#111827] shadow-sm dark:bg-[#0f172a] dark:text-white" : "text-gray-500 hover:text-[#111827] dark:text-gray-300 dark:hover:text-white"}`}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-2 py-2 text-[10px] font-bold transition-colors sm:px-3 sm:text-xs ${theme === "system" ? "bg-white text-[#111827] shadow-sm dark:bg-[#0f172a] dark:text-white" : "text-gray-500 hover:text-[#111827] dark:text-gray-300 dark:hover:text-white"}`}
              >
                <Monitor size={14} /> System
              </button>
            </div>
          </Card>

          {/* Data Archiving */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
              <Database size={16} className="text-[#065f46]" /> Data Archiving
            </h3>
            <p className="mb-5 text-xs leading-relaxed font-medium text-gray-500">Request a secure package of all historical edge metrics, reports, and logs for compliance audits.</p>
            <button
              onClick={handleDataArchive}
              disabled={isArchiveLoading || isArchiveSuccess}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] shadow-sm transition-colors hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isArchiveLoading ? <RefreshCw size={16} className="animate-spin" /> : isArchiveSuccess ? <Check size={16} className="text-green-600" /> : <Download size={16} />}
              {isArchiveLoading ? "Compiling Data..." : isArchiveSuccess ? "Archive Sent to Email" : "Request Data Archive"}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
