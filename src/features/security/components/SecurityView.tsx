import { type FormEvent, useState } from "react";
import type { ThemePreference } from "../../../types/enterprise";
import { ActiveSessionsPanel } from "./ActiveSessionsPanel";
import { CredentialControl } from "./CredentialControl";
import { DataArchivePanel } from "./DataArchivePanel";
import { EnhancedProtectionPanel } from "./EnhancedProtectionPanel";
import { ThemePreferencePanel } from "./ThemePreferencePanel";

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
    window.setTimeout(() => {
      setIsPasswordLoading(false);
      setIsPasswordSuccess(true);
      window.setTimeout(() => setIsPasswordSuccess(false), 3000);
    }, 1500);
  };

  const handleDataArchive = () => {
    setIsArchiveLoading(true);
    window.setTimeout(() => {
      setIsArchiveLoading(false);
      setIsArchiveSuccess(true);
      window.setTimeout(() => setIsArchiveSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="animate-in fade-in max-w-6xl space-y-6 font-['Inter'] duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Security & Data Control</h2>
        <p className="mt-1 text-sm text-gray-500">Manage credentials, active sessions, and system-wide preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CredentialControl isLoading={isPasswordLoading} isSuccess={isPasswordSuccess} onSubmit={handlePasswordUpdate} />
          <ActiveSessionsPanel />
        </div>

        <div className="space-y-6 lg:col-span-1">
          <EnhancedProtectionPanel is2FAEnabled={is2FAEnabled} onToggle2FA={() => setIs2FAEnabled(!is2FAEnabled)} />
          <ThemePreferencePanel theme={theme} setTheme={setTheme} />
          <DataArchivePanel isLoading={isArchiveLoading} isSuccess={isArchiveSuccess} onRequestArchive={handleDataArchive} />
        </div>
      </div>
    </div>
  );
}
