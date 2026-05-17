import { useState } from "react";
import { AnalyticsProtocolBanner } from "./AnalyticsProtocolBanner";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardMetricsGrid } from "./DashboardMetricsGrid";
import { HistoricalTrendChart } from "./HistoricalTrendChart";
import { HourlyDensityChart } from "./HourlyDensityChart";
import type { TrendFilter } from "../types/dashboard";

export function DashboardView() {
  const [trendFilter, setTrendFilter] = useState<TrendFilter>("Week");

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      <DashboardHeader />
      <DashboardMetricsGrid />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HistoricalTrendChart trendFilter={trendFilter} onTrendFilterChange={setTrendFilter} />
        <HourlyDensityChart />
      </div>
      <AnalyticsProtocolBanner />
    </div>
  );
}
