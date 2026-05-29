import { type FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ThemePreference } from "../../../types/enterprise";
import { changePassword } from "../../login/api/login";
import { useAuthStore } from "../../login/stores/auth-store";
import { notifyError, notifySuccess } from "../../toasts/services/toast-service";
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
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [isArchiveSuccess, setIsArchiveSuccess] = useState(false);

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      notifyError("New passwords do not match.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      const session = await changePassword(currentPassword, newPassword);
      queryClient.removeQueries({ queryKey: ["enterprise-current-user"] });
      setSession(session);
      setIsPasswordSuccess(true);
      notifySuccess("Password updated.");
      window.setTimeout(() => setIsPasswordSuccess(false), 3000);
      form.reset();
    } catch {
      notifyError("Unable to update password. Check your current password and try again.");
    } finally {
      setIsPasswordLoading(false);
    }
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
          <EnhancedProtectionPanel />
          <ThemePreferencePanel theme={theme} setTheme={setTheme} />
          <DataArchivePanel isLoading={isArchiveLoading} isSuccess={isArchiveSuccess} onRequestArchive={handleDataArchive} />
        </div>
      </div>
    </div>
  );
}
