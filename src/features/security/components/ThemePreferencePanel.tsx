import { Monitor, Moon, Sun } from "lucide-react";
import { Card } from "../../../components/Card";
import type { ThemePreference } from "../../../types/enterprise";

type ThemePreferencePanelProps = {
  theme: ThemePreference;
  setTheme: React.Dispatch<React.SetStateAction<ThemePreference>>;
};

export function ThemePreferencePanel({ theme, setTheme }: ThemePreferencePanelProps) {
  return (
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
  );
}
