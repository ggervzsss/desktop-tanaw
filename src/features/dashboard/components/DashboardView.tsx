import { useState } from "react";
import { Activity, AlertCircle, AlertTriangle, Info, Shield, TrendingUp, User, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../../components/Card";
import { MOCK_DATA } from "../../../lib/enterpriseMockData";

type TrendFilter = keyof typeof MOCK_DATA.historicalTrend;
const trendOptions: TrendFilter[] = ["Today", "Week", "Month"];

export function DashboardView() {
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
}
