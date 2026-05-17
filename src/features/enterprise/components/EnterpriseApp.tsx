import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  Camera,
  LayoutDashboard,
  FileText,
  Send,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Video,
  Activity,
  Users,
  Filter,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Download,
  RotateCcw,
  MessageSquare,
  History,
  TrendingUp,
  TrendingDown,
  Check,
  Save,
  Move,
  Maximize,
  RefreshCw,
  Info,
  Upload,
  Monitor,
  Smartphone,
  Database,
  Moon,
  Sun,
  MonitorSmartphone,
  Key,
} from "lucide-react";
import { routes } from "../../../app/router/routes";
import { useAuthStore } from "../../auth/stores/auth-store";

const SYSTEM_LOGS = {
  "May 2026": { entries: 1245, peak: 185, unique: 942 },
  "April 2026": { entries: 4120, peak: 310, unique: 3150 },
  "March 2026": { entries: 3890, peak: 280, unique: 2900 },
};

const MOCK_DATA = {
  occupancy: {
    current: 145,
    capacity: 200,
    entryToday: 856,
    exitToday: 711,
    uniqueEstimated: 642,
    peakToday: 185,
    peakTime: "12:30 PM",
    utilizationRate: 72.5,
  },
  hourlyTrend: [
    { time: "8 AM", occupancy: 45, entry: 50, exit: 5 },
    { time: "9 AM", occupancy: 85, entry: 60, exit: 20 },
    { time: "10 AM", occupancy: 120, entry: 75, exit: 40 },
    { time: "11 AM", occupancy: 155, entry: 90, exit: 55 },
    { time: "12 PM", occupancy: 185, entry: 110, exit: 80 },
    { time: "1 PM", occupancy: 160, entry: 60, exit: 85 },
    { time: "2 PM", occupancy: 145, entry: 55, exit: 70 },
  ],
  historicalTrend: {
    Today: [
      { label: "8 AM", visitors: 50 },
      { label: "10 AM", visitors: 125 },
      { label: "12 PM", visitors: 235 },
      { label: "2 PM", visitors: 190 },
      { label: "4 PM", visitors: 140 },
    ],
    Week: [
      { label: "Mon", visitors: 850 },
      { label: "Tue", visitors: 920 },
      { label: "Wed", visitors: 1100 },
      { label: "Thu", visitors: 1050 },
      { label: "Fri", visitors: 1400 },
      { label: "Sat", visitors: 2100 },
      { label: "Sun", visitors: 1950 },
    ],
    Month: [
      { label: "Week 1", visitors: 5200 },
      { label: "Week 2", visitors: 6100 },
      { label: "Week 3", visitors: 5800 },
      { label: "Week 4", visitors: 7200 },
    ],
  },
  cameras: [
    {
      id: 1,
      name: "Main Entrance - Cam 1",
      status: "online",
      zone: "Lobby",
      fps: 30,
      resolution: "1080p",
      type: "Entry/Exit",
      rtsp: "rtsp://admin:pass@192.168.1.100:554/stream1",
      config: {
        tripwire: 50,
        roi: { top: 15, left: 15, width: 70, height: 70 },
        reverse: false,
      },
    },
    {
      id: 2,
      name: "Rear Exit - Cam 2",
      status: "online",
      zone: "Backdoor",
      fps: 24,
      resolution: "720p",
      type: "Exit Only",
      rtsp: "rtsp://admin:pass@192.168.1.101:554/stream1",
      config: {
        tripwire: 70,
        roi: { top: 30, left: 20, width: 60, height: 50 },
        reverse: true,
      },
    },
    {
      id: 3,
      name: "Dining Area - Cam 3",
      status: "offline",
      zone: "Hall A",
      fps: 0,
      resolution: "Unknown",
      type: "Monitoring",
      rtsp: "rtsp://admin:pass@192.168.1.102:554/stream1",
      config: {
        tripwire: 50,
        roi: { top: 10, left: 10, width: 80, height: 80 },
        reverse: false,
      },
    },
  ],
  reports: [
    {
      id: "REP-2026-05-01",
      date: "May 01, 2026",
      status: "Consolidated",
      entries: 1205,
      unique: 980,
    },
    {
      id: "REP-2026-05-08",
      date: "May 08, 2026",
      status: "Submitted",
      entries: 1150,
      unique: 920,
    },
    {
      id: "REP-2026-05-15",
      date: "May 15, 2026",
      status: "Draft",
      entries: 856,
      unique: 642,
    },
  ],
  notifications: [
    {
      id: 1,
      type: "alert",
      message: "Dining Area - Cam 3 went offline.",
      time: "10 mins ago",
      read: false,
    },
    {
      id: 2,
      type: "warning",
      message: "Occupancy reached 90% of capacity.",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "info",
      message: "Weekly report REP-2026-05-08 was received by Staff.",
      time: "1 day ago",
      read: true,
    },
  ],
};

type SystemLogPeriod = keyof typeof SYSTEM_LOGS;

type Metrics = (typeof SYSTEM_LOGS)[SystemLogPeriod];

type DemoBreakdown = {
  thisProvMale: string;
  thisProvFemale: string;
  otherProvMale: string;
  otherProvFemale: string;
  foreignMale: string;
  foreignFemale: string;
};

type AuditEntry = {
  time: string;
  action: string;
  actor: string;
};

type ReportRecord = (typeof MOCK_DATA.reports)[number] & {
  period?: SystemLogPeriod;
  demo?: DemoBreakdown;
  notes?: string;
  auditTrail?: AuditEntry[];
  remarks?: string | null;
};

type Camera = (typeof MOCK_DATA.cameras)[number];

type ThemePreference = "light" | "dark" | "system";

const ENTERPRISE_THEME_STORAGE_KEY = "tanaw-enterprise-theme";

const isThemePreference = (value: string | null): value is ThemePreference => value === "light" || value === "dark" || value === "system";

const getInitialThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") return "light";

  const storedTheme = window.localStorage.getItem(ENTERPRISE_THEME_STORAGE_KEY);
  return isThemePreference(storedTheme) ? storedTheme : "light";
};

const resolveThemePreference = (theme: ThemePreference) => {
  if (theme !== "system") return theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export type EnterpriseView = "dashboard" | "cameras" | "reports" | "profile" | "security";

type StaffAppProps = {
  initialView?: EnterpriseView;
};

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
};

const Card = ({ children, className = "" }: CardProps) => <div className={`rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-[#1e293b] ${className}`}>{children}</div>;

const Badge = ({ children, variant = "default" }: BadgeProps) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
    success: "bg-[#055b25]/10 text-[#055b25] dark:bg-emerald-500/15 dark:text-emerald-300",
    warning: "bg-[#ffd200]/20 text-[#a40e0e] dark:bg-yellow-400/15 dark:text-yellow-300",
    danger: "bg-[#a40e0e]/10 text-[#a40e0e] dark:bg-red-500/15 dark:text-red-300",
    info: "bg-[#2d5eff]/10 text-[#2d5eff] dark:bg-blue-500/15 dark:text-blue-300",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]}`}>{children}</span>;
};

type TrendFilter = keyof typeof MOCK_DATA.historicalTrend;
const trendOptions: TrendFilter[] = ["Today", "Week", "Month"];

const DashboardView = () => {
  const [trendFilter, setTrendFilter] = useState<TrendFilter>("Week");

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {/* Enterprise Data Isolation Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">SPL Market Branch Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Real-time edge metrics restricted to this establishment.</p>
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-gray-200 bg-gray-100 px-3 py-1.5">
          <Shield size={14} className="text-[#065f46]" />
          <span className="text-xs font-bold tracking-wider text-[#111827] uppercase">Read-Only View</span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current / Net Occupancy */}
        <Card className="group relative overflow-hidden border-l-4 border-l-[#065f46] p-5">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Net Occupancy</p>
              <h3 className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">{MOCK_DATA.occupancy.current}</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">Currently Inside</p>
            </div>
            <div className="rounded-sm bg-[#065f46]/10 p-3 text-[#065f46]">
              <Users size={20} />
            </div>
          </div>
          <div className="relative z-10 mt-4 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-[#065f46] transition-all duration-1000"
              style={{
                width: `${(MOCK_DATA.occupancy.current / MOCK_DATA.occupancy.capacity) * 100}%`,
              }}
            ></div>
          </div>
        </Card>

        {/* Entry & Exit Counts */}
        <Card className="border-l-4 border-l-[#111827] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Entry & Exit Flow</p>
              <div className="mt-1 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight text-[#111827]">{MOCK_DATA.occupancy.entryToday}</h3>
                <span className="text-lg font-bold text-gray-300">/</span>
                <h3 className="text-3xl font-bold tracking-tight text-gray-500">{MOCK_DATA.occupancy.exitToday}</h3>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">Cumulative (In / Out)</p>
            </div>
            <div className="rounded-sm bg-gray-100 p-3 text-[#111827]">
              <Activity size={20} />
            </div>
          </div>
        </Card>

        {/* Est. Unique Visitors with Tooltip */}
        <Card className="border-l-4 border-l-[#065f46] p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Est. Unique Pax</p>
                <div className="group relative cursor-help">
                  <Info size={14} className="text-gray-400 hover:text-[#065f46]" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-sm bg-[#111827] p-2 text-[10px] leading-relaxed font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    Deduplicated count filtering out re-entries. Used as the official tourism baseline.
                  </div>
                </div>
              </div>
              <h3 className="mt-1 text-3xl font-bold tracking-tight text-[#065f46]">{MOCK_DATA.occupancy.uniqueEstimated}</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">Deduplicated Baseline</p>
            </div>
            <div className="rounded-sm bg-[#065f46]/10 p-3 text-[#065f46]">
              <User size={20} />
            </div>
          </div>
        </Card>

        {/* Operational Metrics (Peak / Util) */}
        <Card className="border-l-4 border-l-[#111827] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Peak & Utilization</p>
              <h3 className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">{MOCK_DATA.occupancy.peakToday}</h3>
              <p className="mt-1 text-xs font-bold text-[#065f46]">{MOCK_DATA.occupancy.utilizationRate}% Max Utilization</p>
            </div>
            <div className="rounded-sm bg-gray-100 p-3 text-[#111827]">
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Historical Trends (Area/Line) */}
        <Card className="flex flex-col border border-gray-200 p-5 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#111827] uppercase">Historical Visitor Trends</h3>
              <p className="mt-1 text-xs text-gray-500">Total foot traffic analysis over selected periods</p>
            </div>
            <div className="flex rounded-sm border border-gray-200 bg-gray-100 p-1">
              {trendOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrendFilter(t)}
                  className={`rounded-sm px-3 py-1 text-xs font-bold transition-colors ${trendFilter === t ? "bg-white text-[#111827] shadow-sm" : "text-gray-500 hover:text-[#111827]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-75 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA.historicalTrend[trendFilter]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#065f46" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#065f46" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  itemStyle={{ color: "#065f46" }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#065f46" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Peak Visitor Hours (Bar Chart) */}
        <Card className="flex flex-col border border-gray-200 p-5 shadow-sm lg:col-span-1">
          <div className="mb-6">
            <h3 className="text-sm font-bold tracking-wider text-[#111827] uppercase">Hourly Density</h3>
            <p className="mt-1 text-xs text-gray-500">Peak visitor hours distribution</p>
          </div>
          <div className="min-h-75 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DATA.hourlyTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 600 }} />
                <RechartsTooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
                <Bar dataKey="occupancy" fill="#111827" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Disclaimer and Analytics Information Banner */}
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
          <div className="mt-3 flex w-fit items-center gap-2 rounded-sm border border-[#ffd200]/30 bg-[#ffd200]/10 px-3 py-2 text-[#a40e0e]">
            <AlertTriangle size={14} />
            <p className="text-[10px] font-bold tracking-wide uppercase">Note: Accuracy may be affected by camera angle, lighting, occlusion, and crowd density.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

type CameraManagementViewProps = {
  cameras: Camera[];
  setCameras: React.Dispatch<React.SetStateAction<Camera[]>>;
};

const CameraManagementView = ({ cameras, setCameras }: CameraManagementViewProps) => {
  const [activeCamId, setActiveCamId] = useState<number | null>(cameras[0]?.id ?? null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Modal State
  const [newCam, setNewCam] = useState({ name: "", rtsp: "", zone: "" });
  const [isValidating, setIsValidating] = useState(false);

  const activeCam = cameras.find((c) => c.id === activeCamId);
  const [editForm, setEditForm] = useState<Camera | null>(null);

  useEffect(() => {
    if (activeCam) {
      setEditForm(JSON.parse(JSON.stringify(activeCam))); // Deep copy for editing
    }
  }, [activeCam, isEditMode]);

  const handleDelete = () => {
    if (!activeCam) return;
    if (window.confirm(`Are you sure you want to delete ${activeCam.name}? This will stop all edge counting on this node.`)) {
      const updated = cameras.filter((c) => c.id !== activeCamId);
      setCameras(updated);
      setActiveCamId(updated[0]?.id || null);
      setIsEditMode(false);
    }
  };

  const handleSave = () => {
    if (!editForm) return;
    setCameras((prev) => prev.map((c) => (c.id === activeCamId ? editForm : c)));
    setIsEditMode(false);
  };

  const handleAddCamera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsValidating(true);

    // Simulate connection validation delay
    setTimeout(() => {
      const newCameraNode = {
        id: Date.now(),
        name: newCam.name,
        status: "online",
        zone: newCam.zone,
        fps: 30,
        resolution: "1080p",
        type: "Entry/Exit",
        rtsp: newCam.rtsp,
        config: {
          tripwire: 50,
          roi: { top: 10, left: 10, width: 80, height: 80 },
          reverse: false,
        },
      };
      setCameras([...cameras, newCameraNode]);
      setActiveCamId(newCameraNode.id);
      setNewCam({ name: "", rtsp: "", zone: "" });
      setIsValidating(false);
      setShowAddModal(false);
    }, 1500);
  };

  const getValidationWarnings = (config?: Camera["config"]) => {
    const warnings: string[] = [];
    if (!config) return warnings;
    if (config.tripwire < 20 || config.tripwire > 80) {
      warnings.push("Warning: Tripwire placed too close to the frame edge. Head occlusion may occur, reducing accuracy.");
    }
    if (config.roi.width < 40 || config.roi.height < 40) {
      warnings.push("Warning: Region of Interest (ROI) is small. Ensure it fully covers the primary entry/exit pathway.");
    }
    return warnings;
  };

  const warnings = isEditMode && editForm ? getValidationWarnings(editForm.config) : getValidationWarnings(activeCam?.config);

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {/* ADD CAMERA MODAL */}
      {showAddModal && (
        <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-sm border-t-4 border-[#065f46] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-[#111827]">
                <Video size={20} className="text-[#065f46]" /> Register Camera Node
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCamera} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">Camera Name</label>
                <input
                  required
                  type="text"
                  value={newCam.name}
                  onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                  placeholder="e.g., South Gate Main"
                  className="w-full rounded-sm border border-gray-300 p-2.5 text-sm outline-none focus:border-[#065f46]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">Assigned Zone</label>
                <input
                  required
                  type="text"
                  value={newCam.zone}
                  onChange={(e) => setNewCam({ ...newCam, zone: e.target.value })}
                  placeholder="e.g., Lobby"
                  className="w-full rounded-sm border border-gray-300 p-2.5 text-sm outline-none focus:border-[#065f46]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">RTSP Stream URL</label>
                <input
                  required
                  type="text"
                  value={newCam.rtsp}
                  onChange={(e) => setNewCam({ ...newCam, rtsp: e.target.value })}
                  placeholder="rtsp://username:password@ip:port/stream"
                  className="w-full rounded-sm border border-gray-300 p-2.5 font-mono text-sm outline-none focus:border-[#065f46]"
                />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-sm border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                <Shield size={16} className="mt-0.5 shrink-0" />
                <p>Credentials are processed locally on the edge node. Video streams are never transmitted to the cloud.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-gray-400"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Validating Stream...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Connect Node
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Edge Device Management</h2>
          <p className="mt-1 text-sm text-gray-500">Configure RTSP streams and visual counting zones for your establishment.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#044a36]"
        >
          <Plus size={16} /> Add Camera Node
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Cameras List */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="rounded-sm border-t-4 border-t-[#111827] bg-white p-4 shadow-md">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
              <Video size={16} className="text-[#065f46]" /> Configured Nodes
            </h3>
            <div className="space-y-3">
              {cameras.map((cam) => {
                const isActive = activeCamId === cam.id;
                return (
                  <div
                    key={cam.id}
                    onClick={() => {
                      setActiveCamId(cam.id);
                      setIsEditMode(false);
                    }}
                    className={`cursor-pointer rounded-sm border p-3 transition-all ${isActive ? "border-[#065f46] bg-green-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className={`truncate pr-2 text-sm font-bold ${isActive ? "text-[#065f46]" : "text-[#111827]"}`}>{cam.name}</span>
                      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cam.status === "online" ? "bg-[#45a549] shadow-[0_0_4px_#45a549]" : "bg-[#a40e0e]"}`}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-gray-500">
                      <span className="truncate">Zone: {cam.zone}</span>
                      <span className="truncate">Type: {cam.type}</span>
                      <span>Res: {cam.resolution}</span>
                      <span>FPS: {cam.fps}</span>
                    </div>
                  </div>
                );
              })}
              {cameras.length === 0 && <div className="rounded-sm border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No cameras registered.</div>}
            </div>
          </Card>
        </div>

        {/* Camera Setup / Preview */}
        <div className="lg:col-span-2">
          {activeCam ? (
            <Card className="flex h-full flex-col overflow-hidden rounded-sm shadow-md">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
                <h3 className="text-sm font-bold text-[#111827]">
                  Node Config: <span className="text-[#065f46]">{activeCam.name}</span>
                </h3>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <button onClick={() => setIsEditMode(false)} className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100">
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded-sm bg-[#065f46] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]"
                      >
                        <Save size={14} /> Save Config
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-[#065f46] hover:text-[#065f46]"
                        title="Edit Configuration"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-red-600 hover:text-red-600"
                        title="Delete Node"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col bg-gray-50 p-5">
                {/* Visual Preview Area */}
                <div className={`relative mb-5 aspect-video w-full overflow-hidden rounded-sm bg-[#111827] ${isEditMode ? "ring-2 ring-[#065f46] ring-offset-2" : ""}`}>
                  {/* Simulate video stream background */}
                  {activeCam.status === "online" ? (
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg')] bg-cover bg-center opacity-40"></div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-sm font-bold tracking-wider text-red-500 uppercase">Stream Offline</div>
                  )}
                  <div className="absolute inset-0 bg-black/30"></div>

                  {activeCam.status === "online" && (
                    <>
                      {/* Dynamic Configuration Overlays */}
                      {(() => {
                        const config = isEditMode && editForm ? editForm.config : activeCam.config;
                        return (
                          <div className="pointer-events-none absolute inset-0">
                            {/* ROI Bounding Box */}
                            <div
                              className={`absolute border-2 border-dashed ${isEditMode ? "border-[#2d5eff] bg-[#2d5eff]/10" : "border-[#2d5eff]/60 bg-[#2d5eff]/5"}`}
                              style={{
                                top: `${config.roi.top}%`,
                                left: `${config.roi.left}%`,
                                width: `${config.roi.width}%`,
                                height: `${config.roi.height}%`,
                              }}
                            >
                              <span className="absolute right-1 bottom-1 rounded-sm bg-white/90 px-1 text-[9px] font-bold text-[#2d5eff] shadow-sm">ROI</span>
                            </div>

                            {/* Tripwire */}
                            <div className={`absolute h-0.5 w-full shadow-[0_0_8px_rgba(255,210,0,0.8)] ${isEditMode ? "bg-yellow-400" : "bg-yellow-400/80"}`} style={{ top: `${config.tripwire}%` }}>
                              <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-sm bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black shadow-md">
                                {config.reverse ? (
                                  <>
                                    EXIT <span className="text-sm font-black">↓</span> ENTRY <span className="text-sm font-black">↑</span>
                                  </>
                                ) : (
                                  <>
                                    ENTRY <span className="text-sm font-black">↓</span> EXIT <span className="text-sm font-black">↑</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Top Right Live Badges */}
                  {activeCam.status === "online" && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className="flex items-center gap-1 rounded-sm border border-green-500/50 bg-black/60 px-2 py-1 text-[10px] font-bold text-green-400 shadow-sm backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span> LIVE
                      </span>
                      <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.fps} FPS</span>
                      <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.resolution}</span>
                    </div>
                  )}

                  {/* Watermark */}
                  <div className="pointer-events-none absolute bottom-3 left-3 font-['Bai_Jamjuree'] text-2xl font-bold text-white/30 select-none">TANAW Edge Preview</div>
                </div>

                {/* Validation Warnings */}
                {warnings.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {warnings.map((warn, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-sm border border-orange-200 bg-orange-50 p-3 shadow-inner">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-600" />
                        <p className="text-xs leading-relaxed font-medium text-orange-800">{warn}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Controls vs Read Only Details */}
                {isEditMode && editForm ? (
                  <div className="grid grid-cols-1 gap-6 rounded-sm border border-gray-200 bg-white p-4 shadow-inner md:grid-cols-2">
                    {/* Tripwire Settings */}
                    <div>
                      <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
                        <Move size={14} className="text-[#065f46]" /> Tripwire Config
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 flex justify-between text-xs font-semibold text-gray-600">
                            <span>Y-Axis Position</span> <span className="font-mono text-[#065f46]">{editForm.config.tripwire}%</span>
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={editForm.config.tripwire}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  tripwire: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full accent-[#065f46]"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 p-2">
                          <span className="text-xs font-semibold text-gray-700">Direction Logic Swap</span>
                          <button
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  reverse: !editForm.config.reverse,
                                },
                              })
                            }
                            className={`rounded-sm px-3 py-1 text-xs font-bold transition-colors ${editForm.config.reverse ? "bg-[#111827] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                          >
                            {editForm.config.reverse ? "Swapped (Out/In)" : "Default (In/Out)"}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* ROI Settings */}
                    <div>
                      <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
                        <Maximize size={14} className="text-[#2d5eff]" /> Region of Interest
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Top Offset</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={editForm.config.roi.top}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    top: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Left Offset</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={editForm.config.roi.left}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    left: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Width Coverage</label>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={editForm.config.roi.width}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    width: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Height Coverage</label>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={editForm.config.roi.height}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    height: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">RTSP Stream URL</label>
                      <input type="text" readOnly value={activeCam.rtsp} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 font-mono text-sm text-gray-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Assigned Zone</label>
                      <input type="text" readOnly value={activeCam.zone} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Counting Logic</label>
                      <div className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800">{activeCam.type}</div>
                    </div>
                    <div className="flex items-center">
                      <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${activeCam.status === "online" ? "text-[#065f46]" : "text-red-600"}`}>
                        {activeCam.status === "online" ? (
                          <>
                            <CheckCircle size={18} /> Stream Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={18} /> Stream Disconnected
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex h-full min-h-100 flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-transparent p-8 shadow-none">
              <Video size={48} className="mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-500">No Camera Selected</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-gray-400">Select a node from the list or add a new camera to configure its edge processing properties.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

type DotFormModalProps = {
  onClose: () => void;
  period: SystemLogPeriod;
  metrics: Metrics;
  demo: DemoBreakdown;
  notes: string;
};

const DotFormModal = ({ onClose, period, metrics, demo, notes }: DotFormModalProps) => {
  const tpm = parseInt(demo.thisProvMale || "0", 10);
  const tpf = parseInt(demo.thisProvFemale || "0", 10);
  const totalThisProv = tpm + tpf;

  const opm = parseInt(demo.otherProvMale || "0", 10);
  const opf = parseInt(demo.otherProvFemale || "0", 10);
  const totalOtherProv = opm + opf;

  const fm = parseInt(demo.foreignMale || "0", 10);
  const ff = parseInt(demo.foreignFemale || "0", 10);
  const totalForeign = fm + ff;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/80 p-4 font-['Inter'] backdrop-blur-sm duration-200 sm:p-8 print:block print:bg-white print:p-0">
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-sm bg-white shadow-2xl print:m-0 print:h-auto print:max-h-none print:max-w-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 print:hidden">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#111827]" />
            <h3 className="font-bold text-[#111827]">DOT Form Preview</h3>
            <span className="rounded-sm bg-[#065f46]/10 px-2 py-1 text-xs font-semibold text-[#065f46]">Ready for Export</span>
          </div>
          <button onClick={onClose} className="rounded-sm p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-white p-8 sm:p-12 print:overflow-visible print:p-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-xl font-bold tracking-wide text-black uppercase">Visitor Attraction</h2>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="mb-8 w-full border-collapse border-2 border-black text-center text-xs text-black">
                <thead>
                  <tr>
                    <th rowSpan={4} className="w-20 border border-black p-2">
                      Attraction Code
                    </th>
                    <th rowSpan={4} className="w-48 border border-black p-2">
                      Name/ Month
                    </th>
                    <th colSpan={9} className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">
                      ***Place of Residence
                    </th>
                    <th rowSpan={4} className="w-24 border border-black p-2">
                      Grand Total Number of Visitors
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={6} className="border border-black bg-gray-50 p-1 print:bg-transparent">
                      Philippines
                    </th>
                    <th colSpan={3} className="border border-black bg-gray-50 p-1 print:bg-transparent">
                      Foreign Country Residence
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={3} className="border border-black p-1">
                      This province
                    </th>
                    <th colSpan={3} className="border border-black p-1">
                      Other Province
                    </th>
                    <th colSpan={3} className="border border-t-0 border-black p-1"></th>
                  </tr>
                  <tr>
                    <th className="w-12 border border-black p-1">Male</th>
                    <th className="w-12 border border-black p-1">Female</th>
                    <th className="w-12 border border-black bg-gray-50 p-1 print:bg-transparent">Total</th>
                    <th className="w-12 border border-black p-1">Male</th>
                    <th className="w-12 border border-black p-1">Female</th>
                    <th className="w-12 border border-black bg-gray-50 p-1 print:bg-transparent">Total</th>
                    <th className="w-12 border border-black p-1">Male</th>
                    <th className="w-12 border border-black p-1">Female</th>
                    <th className="w-12 border border-black bg-gray-50 p-1 print:bg-transparent">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-xs font-semibold uppercase">SPL-MKT-01</td>
                    <td className="border border-black p-2 text-left align-top leading-tight">
                      <span className="font-bold">SPL Market Branch</span>
                      <br />
                      <span className="text-[10px]">{period}</span>
                    </td>
                    <td className="border border-black p-2">{tpm || ""}</td>
                    <td className="border border-black p-2">{tpf || ""}</td>
                    <td className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">{totalThisProv || ""}</td>
                    <td className="border border-black p-2">{opm || ""}</td>
                    <td className="border border-black p-2">{opf || ""}</td>
                    <td className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">{totalOtherProv || ""}</td>
                    <td className="border border-black p-2">{fm || ""}</td>
                    <td className="border border-black p-2">{ff || ""}</td>
                    <td className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">{totalForeign || ""}</td>
                    <td className="border border-black bg-gray-100 p-2 text-sm font-bold print:bg-transparent">{metrics.entries}</td>
                  </tr>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="h-8">
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black bg-gray-50 p-1 print:bg-transparent"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black bg-gray-50 p-1 print:bg-transparent"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black bg-gray-50 p-1 print:bg-transparent"></td>
                      <td className="border border-black bg-gray-100 p-1 print:bg-transparent"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {notes && (
              <div className="mt-4 border border-black bg-gray-50/50 p-4">
                <h4 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase">Supplementary Notes / Details</h4>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 print:hidden">
          <button onClick={onClose} className="rounded-sm border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-[#111827] transition-colors hover:bg-gray-100">
            Close Preview
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-sm bg-[#065f46] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#044a36]">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

type ReportsViewProps = {
  reportsHistory: ReportRecord[];
  setReportsHistory: React.Dispatch<React.SetStateAction<ReportRecord[]>>;
};

const ReportsView = ({ reportsHistory, setReportsHistory }: ReportsViewProps) => {
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [period, setPeriod] = useState<SystemLogPeriod>("May 2026");
  const [notes, setNotes] = useState("");
  const [demo, setDemo] = useState<DemoBreakdown>({
    thisProvMale: "",
    thisProvFemale: "",
    otherProvMale: "",
    otherProvFemale: "",
    foreignMale: "",
    foreignFemale: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const activeReport = activeReportId ? (reportsHistory.find((r) => r.id === activeReportId) ?? null) : null;
  const isReadOnly = activeReport ? !["Draft", "Returned for Revision"].includes(activeReport.status) : false;

  const metrics = SYSTEM_LOGS[period] ?? { entries: 0, peak: 0, unique: 0 };
  const periodKeys = Object.keys(SYSTEM_LOGS) as SystemLogPeriod[];
  const currIndex = periodKeys.indexOf(period);
  const prevPeriod = currIndex < periodKeys.length - 1 ? periodKeys[currIndex + 1] : null;
  const prevMetrics = prevPeriod ? SYSTEM_LOGS[prevPeriod] : null;
  const uniqueTrend = prevMetrics ? Math.round(((metrics.unique - prevMetrics.unique) / prevMetrics.unique) * 100) : 0;

  const isError = metrics.peak > metrics.entries;

  const handleGenerateNew = () => {
    setActiveReportId(null);
    setPeriod("May 2026");
    setNotes("");
    setDemo({
      thisProvMale: "",
      thisProvFemale: "",
      otherProvMale: "",
      otherProvFemale: "",
      foreignMale: "",
      foreignFemale: "",
    });
  };

  const handleViewReport = (report: ReportRecord) => {
    setActiveReportId(report.id);
    setPeriod(report.period || "May 2026");
    setNotes(report.notes || "");
    setDemo(
      report.demo || {
        thisProvMale: "",
        thisProvFemale: "",
        otherProvMale: "",
        otherProvFemale: "",
        foreignMale: "",
        foreignFemale: "",
      },
    );
  };

  const executeSubmit = () => {
    const now = new Date().toLocaleString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
    const todayDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    if (activeReportId) {
      setReportsHistory((prev) =>
        prev.map((r) => {
          if (r.id === activeReportId) {
            return {
              ...r,
              status: "Resubmitted",
              period,
              demo,
              notes,
              auditTrail: [
                ...(r.auditTrail || []),
                {
                  time: `${todayDate} ${now}`,
                  action: "Report Resubmitted",
                  actor: "SPL Market Admin",
                },
              ],
            };
          }
          return r;
        }),
      );
    } else {
      const newReport = {
        id: `REP-${new Date().getTime().toString().slice(-6)}`,
        date: period,
        status: "Submitted",
        entries: metrics.entries,
        unique: metrics.unique,
        period,
        demo,
        notes,
        auditTrail: [
          {
            time: `${todayDate} ${now}`,
            action: "Draft Created",
            actor: "SPL Market Admin",
          },
          {
            time: `${todayDate} ${now}`,
            action: "Report Submitted",
            actor: "SPL Market Admin",
          },
        ],
        remarks: null,
      };
      setReportsHistory([newReport, ...reportsHistory]);
    }
    setShowConfirm(false);
    handleGenerateNew();
  };

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {showPreview && <DotFormModal onClose={() => setShowPreview(false)} period={period} metrics={metrics} demo={demo} notes={notes} />}

      {showConfirm && (
        <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border-t-4 border-[#065f46] bg-white p-6 shadow-2xl">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#111827]">
              <Send size={20} className="text-[#065f46]" /> Confirm Submission
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              Are you sure you want to submit this report to the LGU Admin? This action will finalize current system metrics and lock further edits.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-gray-50">
                Edit Draft
              </button>
              <button onClick={executeSubmit} className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]">
                <Check size={16} /> Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Report Generation & Submission</h2>
          <p className="mt-1 text-sm text-gray-500">Generate LGU-required DOT reports using system-verified metrics.</p>
        </div>
        <button
          onClick={handleGenerateNew}
          className="flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#111827] shadow-sm transition-colors hover:bg-gray-50"
        >
          <Plus size={16} /> New Draft
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className={`h-fit rounded-sm border-t-4 p-6 shadow-md transition-colors lg:col-span-1 ${isReadOnly ? "border-t-gray-400" : activeReport?.status === "Returned for Revision" ? "border-t-[#ffd200]" : "border-t-[#065f46]"}`}
        >
          <h3 className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
            {isReadOnly ? <History size={18} className="text-gray-500" /> : <FileText size={18} className="text-[#065f46]" />}
            {isReadOnly ? "Report Details (Locked)" : activeReportId ? `Edit Report: ${activeReportId}` : "Draft Generator"}
          </h3>

          {activeReport?.status === "Returned for Revision" && (
            <div className="mb-5 rounded-sm border border-[#ffd200]/40 bg-[#ffd200]/10 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#a40e0e] uppercase">
                <MessageSquare size={14} /> Staff Remarks
              </h4>
              <p className="text-xs leading-relaxed font-medium text-[#a40e0e]">{activeReport.remarks}</p>
            </div>
          )}

          {isError && !isReadOnly && (
            <div className="mb-5 flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-4 shadow-inner">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h4 className="mb-1 text-[10px] font-bold tracking-wider text-red-800 uppercase">Data Validation Error</h4>
                <p className="text-xs leading-relaxed text-red-700">Peak Occupancy cannot exceed Total Entries. Check your edge logic configs before submitting.</p>
              </div>
            </div>
          )}

          <div className={`space-y-5 ${isReadOnly ? "opacity-80" : ""}`}>
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-[#111827] uppercase">Reporting Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as SystemLogPeriod)}
                disabled={isReadOnly}
                className="w-full rounded-sm border border-gray-300 bg-white p-2.5 text-sm font-medium text-[#111827] transition-all outline-none focus:border-[#065f46] disabled:bg-gray-50"
              >
                {Object.keys(SYSTEM_LOGS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 shadow-inner">
              <p className="mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">System Locked Metrics</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Total Entries</span>
                  <span className="rounded-sm border border-gray-200 bg-white px-2 py-0.5 font-mono font-bold text-[#111827]">{metrics.entries.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Peak Occupancy</span>
                  <span className="rounded-sm border border-gray-200 bg-white px-2 py-0.5 font-mono font-bold text-[#111827]">{metrics.peak.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm">
                  <span className="font-semibold text-[#065f46]">Est. Unique Count</span>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-lg leading-none font-bold text-[#065f46]">{metrics.unique.toLocaleString()}</span>
                    {prevMetrics && (
                      <span
                        className={`mt-1.5 flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${uniqueTrend >= 0 ? "border border-green-200 bg-green-100 text-green-700" : "border border-red-200 bg-red-100 text-red-700"}`}
                      >
                        {uniqueTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(uniqueTrend)}% vs Prev
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-[9px] tracking-wider text-gray-400 uppercase">* Edge logs data. Non-editable.</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-[#111827] uppercase">Demographics Breakdown</label>
              <div className="grid grid-cols-3 gap-2 rounded-sm border border-gray-200 bg-white p-2">
                <div className="border-r border-gray-100 pr-2">
                  <p className="mb-2 truncate text-[9px] font-bold text-[#111827] uppercase" title="This Province">
                    This Prov.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="M"
                      disabled={isReadOnly}
                      value={demo.thisProvMale}
                      onChange={(e) => setDemo({ ...demo, thisProvMale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      disabled={isReadOnly}
                      value={demo.thisProvFemale}
                      onChange={(e) => setDemo({ ...demo, thisProvFemale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                  </div>
                </div>
                <div className="border-r border-gray-100 pr-2 pl-1">
                  <p className="mb-2 truncate text-[9px] font-bold text-[#111827] uppercase" title="Other Province">
                    Other Prov.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="M"
                      disabled={isReadOnly}
                      value={demo.otherProvMale}
                      onChange={(e) => setDemo({ ...demo, otherProvMale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      disabled={isReadOnly}
                      value={demo.otherProvFemale}
                      onChange={(e) => setDemo({ ...demo, otherProvFemale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                  </div>
                </div>
                <div className="pl-1">
                  <p className="mb-2 truncate text-[9px] font-bold text-[#111827] uppercase" title="Foreign Country">
                    Foreign
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="M"
                      disabled={isReadOnly}
                      value={demo.foreignMale}
                      onChange={(e) => setDemo({ ...demo, foreignMale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      disabled={isReadOnly}
                      value={demo.foreignFemale}
                      onChange={(e) => setDemo({ ...demo, foreignFemale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-[#111827] uppercase">Supplementary Data</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
                className="min-h-20 w-full resize-none rounded-sm border border-gray-300 p-3 text-sm text-[#111827] outline-none focus:border-[#065f46] disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Add notes regarding events, closures, or demographic estimates..."
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-sm border-2 border-[#111827] bg-white py-2 text-xs font-bold tracking-wide text-[#111827] uppercase transition-colors hover:bg-[#111827] hover:text-white"
              >
                <FileText size={14} /> Preview {isReadOnly ? "" : "Draft"}
              </button>
              {!isReadOnly && (
                <button
                  disabled={isError}
                  onClick={() => setShowConfirm(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-sm border-2 py-2 text-xs font-bold tracking-wide uppercase shadow-md transition-colors ${
                    isError ? "cursor-not-allowed border-gray-300 bg-gray-300 text-gray-500" : "border-[#065f46] bg-[#065f46] text-white hover:border-[#044a36] hover:bg-[#044a36]"
                  }`}
                >
                  {activeReport?.status === "Returned for Revision" ? <RotateCcw size={14} /> : <Send size={14} />}
                  {activeReport?.status === "Returned for Revision" ? "Resubmit" : "Submit"}
                </button>
              )}
            </div>

            {/* Audit Trail Section for Read-Only or Revision Mode */}
            {activeReport && activeReport.auditTrail && (
              <div className="mt-8 border-t border-gray-200 pt-5">
                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                  <Activity size={12} /> Interaction Audit Trail
                </h4>
                <div className="space-y-4">
                  {activeReport.auditTrail.map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#065f46] shadow-[0_0_4px_#065f46]"></div>
                      <div>
                        <p className="font-semibold text-[#111827]">{log.action}</p>
                        <p className="mt-0.5 text-gray-500">
                          {log.time} • by <span className="font-medium text-gray-700">{log.actor}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden rounded-sm border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold tracking-wider text-[#111827] uppercase">Submission Ledger</h3>
            <div className="flex cursor-pointer items-center gap-2 rounded-sm bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#111827]">
              <Filter size={14} /> Filter Records
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-gray-50 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="border-b border-gray-200 px-5 py-3">Report ID</th>
                  <th className="border-b border-gray-200 px-5 py-3">Period</th>
                  <th className="border-b border-gray-200 px-5 py-3 text-right">Unique Pax</th>
                  <th className="border-b border-gray-200 px-5 py-3">Status</th>
                  <th className="border-b border-gray-200 px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsHistory.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => handleViewReport(report)}
                    className={`group cursor-pointer transition-colors ${activeReportId === report.id ? "bg-[#065f46]/5" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-[#111827]">{report.id}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-700">{report.date}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-[#065f46]">{report.unique?.toLocaleString() || 0}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          report.status === "Consolidated"
                            ? "success"
                            : report.status === "Submitted" || report.status === "Resubmitted"
                              ? "info"
                              : report.status === "Returned for Revision"
                                ? "warning"
                                : "default"
                        }
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report);
                            setShowPreview(true);
                            setTimeout(() => window.print(), 100);
                          }}
                          className="flex items-center text-gray-500 hover:text-[#065f46]"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className={`flex items-center gap-1 text-xs font-semibold tracking-wider uppercase ${report.status === "Draft" || report.status === "Returned for Revision" ? "text-[#065f46] hover:text-[#044a36]" : "text-gray-400 hover:text-[#111827]"}`}
                        >
                          {report.status === "Draft" || report.status === "Returned for Revision" ? <Edit2 size={14} /> : <FileText size={14} />}
                          {report.status === "Draft" || report.status === "Returned for Revision" ? "Edit" : "View"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reportsHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                      No reports submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ProfileView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="animate-in fade-in mx-auto max-w-4xl space-y-6 font-['Inter'] duration-500 lg:mx-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Enterprise Profile</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your establishment's identity and primary contact details.</p>
      </div>

      <Card className="p-6 md:p-8">
        {/* Avatar Area */}
        <div className="mb-8 flex flex-col items-start gap-6 border-b border-gray-100 pb-8 sm:flex-row sm:items-center">
          <div className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 shadow-sm">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Upload size={20} className="text-white" />
            </div>
            <span className="font-['Bai_Jamjuree'] text-2xl font-bold text-[#2a3063] transition-opacity group-hover:opacity-0">SP</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Establishment Logo</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Upload a professional logo or primary display picture.
              <br />
              Recommended format: 256x256px PNG or JPG.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Full Name / Lead Admin</label>
              <input type="text" defaultValue="Juan Dela Cruz" className="w-full rounded-sm border border-gray-300 p-3 text-sm transition-colors outline-none focus:border-[#065f46]" required />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Business Email</label>
              <input type="email" defaultValue="admin@splmarket.ph" className="w-full rounded-sm border border-gray-300 p-3 text-sm transition-colors outline-none focus:border-[#065f46]" required />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Contact Number</label>
              <input type="tel" defaultValue="+63 917 123 4567" className="w-full rounded-sm border border-gray-300 p-3 text-sm transition-colors outline-none focus:border-[#065f46]" required />
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-sm border border-gray-200 bg-gray-50 p-4 shadow-inner">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
              <Shield size={14} className="text-[#065f46]" /> Enterprise Identity (Read-Only)
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">Current Node</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">SPL Market Branch</div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">LGU Affiliation</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">San Pedro City</div>
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-500">To modify your establishment's structural identity, please contact the LGU Administrator.</p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex min-w-42.5 items-center justify-center gap-2 rounded-sm bg-[#065f46] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-[#065f46]/70"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : isSuccess ? <Check size={16} /> : <Save size={16} />}
              {isLoading ? "Saving..." : isSuccess ? "Saved Successfully" : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

type SecurityViewProps = {
  theme: ThemePreference;
  setTheme: React.Dispatch<React.SetStateAction<ThemePreference>>;
};

const SecurityView = ({ theme, setTheme }: SecurityViewProps) => {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [isArchiveSuccess, setIsArchiveSuccess] = useState(false);

  const handlePasswordUpdate = (event: React.FormEvent<HTMLFormElement>) => {
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
};

export default function StaffApp({ initialView = "cameras" }: StaffAppProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [activeView, setActiveView] = useState<string>(initialView);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [reportsHistory, setReportsHistory] = useState<ReportRecord[]>(MOCK_DATA.reports);
  const [cameras, setCameras] = useState<Camera[]>(MOCK_DATA.cameras); // Lifted cameras state

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
  const [notifications, setNotifications] = useState(initialNotifs);
  const [toasts, setToasts] = useState(initialNotifs.filter((n) => n.type === "critical" && !n.read));
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
    navigate(routes.login, { replace: true });
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
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className={`relative rounded-full p-2.5 transition-colors ${isNotificationsOpen ? "bg-gray-100 text-[#065f46]" : "border border-gray-100 bg-white text-gray-500 shadow-sm hover:bg-gray-50"}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#a40e0e]"></span>}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="animate-in slide-in-from-top-2 absolute right-0 z-50 mt-2 flex max-h-128 w-80 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl duration-200">
                  <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 p-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                      System Alerts
                      {unreadCount > 0 && <span className="rounded-sm bg-[#a40e0e] px-1.5 py-0.5 text-[10px] leading-none text-white shadow-sm">{unreadCount}</span>}
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                        className="text-[10px] font-bold tracking-wider text-[#2d5eff] uppercase hover:underline"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={() => setShowNotifSettings(!showNotifSettings)}
                        className={`rounded-sm p-1 transition-colors ${showNotifSettings ? "bg-[#065f46] text-white" : "text-gray-400 hover:bg-gray-200 hover:text-[#065f46]"}`}
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  {showNotifSettings && (
                    <div className="shrink-0 border-b border-[#065f46]/10 bg-[#065f46]/5 p-4 shadow-inner">
                      <label className="flex items-center justify-between text-xs font-bold text-[#111827]">
                        Overcrowding Threshold
                        <select
                          value={occupancyThreshold}
                          onChange={(e) => setOccupancyThreshold(Number(e.target.value))}
                          className="ml-2 rounded-sm border border-gray-300 p-1.5 text-xs font-medium outline-none focus:border-[#065f46]"
                        >
                          <option value={80}>80% Capacity</option>
                          <option value={90}>90% Capacity</option>
                          <option value={100}>100% Capacity</option>
                        </select>
                      </label>
                      <p className="mt-2 text-[10px] leading-relaxed font-medium text-gray-500">
                        System will trigger a critical alert and push a toast notification when node occupancy surpasses this value.
                      </p>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto bg-white">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setNotifications(notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
                          setIsNotificationsOpen(false);
                          setActiveView(notif.target); // Deep Link
                        }}
                        className={`group flex cursor-pointer gap-3 border-b border-gray-50 p-4 transition-colors hover:bg-gray-50 ${!notif.read ? "bg-blue-50/20" : "opacity-80"}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === "critical" && <AlertTriangle size={16} className="text-[#a40e0e]" />}
                          {notif.type === "warning" && <AlertCircle size={16} className="text-[#ffd200]" />}
                          {notif.type === "info" && <CheckCircle size={16} className="text-[#2d5eff]" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm leading-snug transition-colors group-hover:text-[#065f46] ${!notif.read ? "font-bold text-[#111827]" : "font-medium text-gray-700"}`}>
                            {notif.message}
                          </p>
                          <p className="mt-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">{notif.time}</p>
                        </div>
                        {!notif.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2d5eff] shadow-sm"></div>}
                      </div>
                    ))}
                  </div>
                  <div className="shrink-0 border-t border-gray-100 bg-gray-50 p-2.5 text-center">
                    <button className="text-[10px] font-bold tracking-wider text-gray-500 uppercase hover:text-[#065f46]">View Alert Ledger</button>
                  </div>
                </div>
              )}
            </div>

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
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#055b25] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-green-400"
                    >
                      <User size={16} /> Edit Profile Info
                    </button>
                    <button
                      onClick={() => {
                        setActiveView("security");
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#055b25] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-green-400"
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

      {/* Global Real-Time Toasts (Critical Alerts) */}
      <div className="pointer-events-none fixed right-6 bottom-6 z-100 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className="animate-in slide-in-from-right-8 fade-in pointer-events-auto flex w-80 items-start gap-3 rounded-r-sm border-l-4 border-[#a40e0e] bg-red-50 p-4 shadow-2xl">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#a40e0e]" />
            <div
              className="group flex-1 cursor-pointer"
              onClick={() => {
                setActiveView(t.target);
                setToasts(toasts.filter((x) => x.id !== t.id));
                setNotifications(notifications.map((n) => (n.id === t.id ? { ...n, read: true } : n)));
              }}
            >
              <p className="text-sm font-black tracking-wider text-[#a40e0e] uppercase">Critical Alert</p>
              <p className="mt-1 text-xs leading-relaxed font-semibold text-red-900 group-hover:underline">{t.message}</p>
              <p className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-widest text-[#a40e0e] uppercase opacity-80 group-hover:opacity-100">Review Issue &rarr;</p>
            </div>
            <button onClick={() => setToasts(toasts.filter((x) => x.id !== t.id))} className="rounded-sm bg-white/50 p-1 text-red-400 transition-colors hover:bg-white hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

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
