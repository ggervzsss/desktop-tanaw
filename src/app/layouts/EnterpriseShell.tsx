import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronDown, FileText, LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { CriticalAlertToasts } from "../../features/alerts/components/CriticalAlertToasts";
import { DashboardView } from "../../features/dashboard/components/DashboardView";
import { CameraManagementView } from "../../features/camera/components/CameraManagementView";
import { NotificationDropdown } from "../../features/notifications/components/NotificationDropdown";
import { ReportsView } from "../../features/reports/components/ReportsView";
import { ProfileView } from "../../features/profile/components/ProfileView";
import { SecurityView } from "../../features/security/components/SecurityView";
import { MOCK_DATA } from "../../lib/enterpriseMockData";
import { routePaths } from "../router/routePaths";
import { useAuthStore } from "../../features/login/stores/auth-store";
import { ENTERPRISE_THEME_STORAGE_KEY, getInitialThemePreference, resolveThemePreference } from "../../features/security/utils/theme";
import type { Camera as EnterpriseCamera, EnterpriseNotification, EnterpriseView, ReportRecord, ThemePreference } from "../../types/enterprise";

type EnterpriseShellProps = {
  initialView?: EnterpriseView;
};

export function EnterpriseShell({ initialView = "cameras" }: EnterpriseShellProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [activeView, setActiveView] = useState<EnterpriseView>(initialView);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [reportsHistory, setReportsHistory] = useState<ReportRecord[]>(MOCK_DATA.reports);
  const [cameras, setCameras] = useState<EnterpriseCamera[]>(MOCK_DATA.cameras);

  // Notification Engine State
  const initialNotifs = [
    {
      id: 1,
      type: "critical",
      message: "Dining Area - Cam 3 went offline. Edge processing stopped.",
      time: "10 mins ago",
      read: false,
      target: "cameras",
    },
    {
      id: 2,
      type: "critical",
      message: "Overcrowding alert: Occupancy exceeded safe threshold.",
      time: "1 hour ago",
      read: false,
      target: "dashboard",
    },
    {
      id: 3,
      type: "warning",
      message: "Unstable RTSP stream quality detected on Rear Exit.",
      time: "2 hours ago",
      read: false,
      target: "cameras",
    },
    {
      id: 4,
      type: "warning",
      message: "Pending submission: May 2026 LGU Attraction Report.",
      time: "1 day ago",
      read: false,
      target: "reports",
    },
    {
      id: 5,
      type: "info",
      message: "Weekly report REP-2026-05-08 was consolidated by Admin.",
      time: "2 days ago",
      read: true,
      target: "reports",
    },
  ];
  const [notifications, setNotifications] = useState<EnterpriseNotification[]>(initialNotifs as EnterpriseNotification[]);
  const [toasts, setToasts] = useState<EnterpriseNotification[]>((initialNotifs as EnterpriseNotification[]).filter((n) => n.type === "critical" && !n.read));
  const [occupancyThreshold, setOccupancyThreshold] = useState(90);
  const [showNotifSettings, setShowNotifSettings] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<ThemePreference>(getInitialThemePreference);

  // Time updater & Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolvedTheme = resolveThemePreference(theme);
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      root.dataset.enterpriseTheme = theme;
    };

    window.localStorage.setItem(ENTERPRISE_THEME_STORAGE_KEY, theme);
    applyTheme();

    if (theme !== "system") return undefined;

    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const handleLogout = () => {
    logout();
    navigate(routePaths.login, { replace: true });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="enterprise-shell relative flex h-screen overflow-hidden bg-[#eef5f0] font-['Montserrat'] transition-colors duration-300 dark:bg-[#0b1120]">
      {/* Sidebar - Edge-to-Edge flush with screen left, Full Height */}
      <aside className="z-20 flex h-screen w-64 shrink-0 flex-col rounded-r-3xl bg-[#065f46] text-white shadow-2xl transition-all">
        {/* Logo Area */}
        <div className="flex w-full flex-col items-start border-b border-white/10 p-6 pl-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Seal_of_San_Pedro%2C_Laguna.png/1280px-Seal_of_San_Pedro%2C_Laguna.png"
            alt="Logo"
            className="mb-2 h-16 w-16 drop-shadow-md"
          />
          <h1 className="font-['Bai_Jamjuree'] text-2xl font-bold tracking-wider">TANAW</h1>
          <span className="mt-1 rounded-sm border border-white/20 bg-white/10 px-3 py-1 text-[10px] tracking-widest uppercase">Enterprise</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeView === "dashboard" ? "bg-white font-bold text-[#065f46] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <LayoutDashboard size={18} /> Node Dashboard
          </button>
          <button
            onClick={() => setActiveView("cameras")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeView === "cameras" ? "bg-white font-bold text-[#065f46] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <Camera size={18} /> Camera Setup
          </button>
          <button
            onClick={() => setActiveView("reports")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeView === "reports" ? "bg-white font-bold text-[#065f46] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <FileText size={18} /> Reports & Subs
          </button>
        </nav>

        {/* User / Logout */}
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-black/20 p-3">
            <p className="mb-1 text-[10px] font-bold text-white/60 uppercase">Current Node</p>
            <p className="truncate text-sm font-semibold">SPL Market Branch</p>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-red-500/20 hover:text-red-100">
            <LogOut size={18} /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-gray-200/70 bg-white/80 px-8 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-[#111827]/90">
          <div>
            <h2 className="font-['Bai_Jamjuree'] text-2xl font-bold text-[#2a3063]">
              {activeView === "dashboard" && "Establishment Overview"}
              {activeView === "cameras" && "Edge Device Management"}
              {activeView === "reports" && "LGU Reporting"}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#45a549]"></span>
              <p className="text-xs font-medium tracking-wide text-gray-500">LOCAL PROCESSING ACTIVE • {currentTime}</p>
            </div>
          </div>

          {/* Top Right Controls - Profile and Notifications as requested */}
          <div className="relative flex items-center gap-4">
            <NotificationDropdown
              isOpen={isNotificationsOpen}
              notifications={notifications}
              unreadCount={unreadCount}
              showSettings={showNotifSettings}
              occupancyThreshold={occupancyThreshold}
              onToggleOpen={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false);
              }}
              onClose={() => setIsNotificationsOpen(false)}
              onToggleSettings={() => setShowNotifSettings(!showNotifSettings)}
              onMarkAllRead={() => setNotifications(notifications.map((notification) => ({ ...notification, read: true })))}
              onSelectNotification={(notification) => {
                setNotifications(notifications.map((current) => (current.id === notification.id ? { ...current, read: true } : current)));
                setIsNotificationsOpen(false);
                setActiveView(notification.target);
              }}
              onSetOccupancyThreshold={setOccupancyThreshold}
            />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-3 rounded-full border border-gray-200 bg-white p-1.5 pr-3 shadow-sm transition-colors hover:border-gray-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a3063] font-['Bai_Jamjuree'] text-sm font-bold text-white">SP</div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs leading-none font-bold text-[#2a3063]">{user?.name ?? "SPL Market"}</p>
                  <p className="mt-1 text-[10px] text-gray-500">{user?.role ?? "enterprise"} Role</p>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {/* Profile Menu */}
              {isProfileOpen && (
                <div className="animate-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl duration-200 dark:border-gray-800 dark:bg-[#1e293b]">
                  <div className="border-b border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0f172a]">
                    <p className="text-sm font-bold text-[#2a3063] dark:text-gray-100">{user?.name ?? "SPL Market Admin"}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email ?? "admin@splmarket.ph"}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setActiveView("profile");
                        setIsProfileOpen(false);
                      }}
                      className="hover:text-tanaw-green flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-green-400"
                    >
                      <User size={16} /> Edit Profile Info
                    </button>
                    <button
                      onClick={() => {
                        setActiveView("security");
                        setIsProfileOpen(false);
                      }}
                      className="hover:text-tanaw-green flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-green-400"
                    >
                      <Shield size={16} /> Security & Data Control
                    </button>
                    <div className="mx-2 my-2 h-px bg-gray-100 dark:bg-gray-800"></div>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#a40e0e] transition-colors hover:bg-red-50 dark:hover:bg-red-900/30">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto bg-[#f4f8f5] p-8 transition-colors duration-300 dark:bg-[#0f172a]">
          <div className="mx-auto max-w-7xl">
            {activeView === "dashboard" && <DashboardView />}
            {activeView === "cameras" && <CameraManagementView cameras={cameras} setCameras={setCameras} />}
            {activeView === "reports" && <ReportsView reportsHistory={reportsHistory} setReportsHistory={setReportsHistory} />}
            {activeView === "profile" && <ProfileView />}
            {activeView === "security" && <SecurityView theme={theme} setTheme={setTheme} />}
          </div>
        </div>
      </main>

      <CriticalAlertToasts
        toasts={toasts}
        onReview={(toast) => {
          setActiveView(toast.target);
          setToasts(toasts.filter((current) => current.id !== toast.id));
          setNotifications(notifications.map((notification) => (notification.id === toast.id ? { ...notification, read: true } : notification)));
        }}
        onDismiss={(toastId) => setToasts(toasts.filter((toast) => toast.id !== toastId))}
      />

      {/* Global CSS for Tailwind custom fonts if not injected via standard means */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap');
        
        /* Global Dark Mode Injections for Legacy & Locked Components */
        .dark .bg-white { background-color: #1e293b !important; }
        .dark .bg-white\\/50, .dark .bg-white\\/80 { background-color: rgba(17, 24, 39, 0.9) !important; }
        .dark .bg-gray-50 { background-color: #0f172a !important; }
        .dark .bg-gray-100 { background-color: #334155 !important; border-color: #475569 !important; }
        .dark .bg-red-50 { background-color: #450a0a !important; }
        .dark .bg-blue-50\\/20 { background-color: rgba(30, 64, 175, 0.16) !important; }
        .dark .bg-\\[\\#065f46\\]\\/5 { background-color: rgba(16, 185, 129, 0.1) !important; }
        .dark .bg-\\[\\#065f46\\]\\/10 { background-color: rgba(16, 185, 129, 0.16) !important; }
        .dark .text-\\[\\#111827\\] { color: #f8fafc !important; }
        .dark .text-\\[\\#2a3063\\] { color: #f8fafc !important; }
        .dark .text-gray-500 { color: #94a3b8 !important; }
        .dark .text-gray-600 { color: #cbd5e1 !important; }
        .dark .text-gray-700 { color: #e2e8f0 !important; }
        .dark .text-gray-800 { color: #f1f5f9 !important; }
        .dark .text-red-900 { color: #fecaca !important; }
        .dark .text-\\[\\#a40e0e\\] { color: #fca5a5 !important; }
        .dark .border-gray-100 { border-color: #334155 !important; }
        .dark .border-gray-200 { border-color: #475569 !important; }
        .dark .border-gray-300 { border-color: #475569 !important; }
        .dark .border-gray-50 { border-color: #1e293b !important; }
        .dark .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5) !important; }
        .dark .shadow-xl, .dark .shadow-2xl { box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55) !important; }
        .dark .hover\\:bg-gray-50:hover { background-color: #1e293b !important; }
        .dark .hover\\:bg-gray-100:hover { background-color: #334155 !important; }
        .dark .hover\\:bg-red-50:hover { background-color: #7f1d1d !important; }
        
        /* Form Inputs override for dark mode */
        .dark input:not([type="range"]), .dark select, .dark textarea { 
          background-color: #334155 !important; 
          color: #f8fafc !important; 
          border-color: #475569 !important; 
        }
        .dark input:not([type="range"]):disabled, .dark select:disabled, .dark textarea:disabled { 
          background-color: #1e293b !important; 
          color: #94a3b8 !important; 
        }
      `,
        }}
      />
    </div>
  );
}
