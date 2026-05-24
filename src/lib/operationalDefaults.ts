import type { Camera, Metrics, ReportRecord } from "../types/enterprise";
import type { TrendFilter } from "../features/dashboard/types/dashboard";

export const EMPTY_METRICS: Metrics = {
  entries: 0,
  peak: 0,
  unique: 0,
};

export const EMPTY_OCCUPANCY = {
  current: 0,
  capacity: 1,
  entryToday: 0,
  exitToday: 0,
  uniqueEstimated: 0,
  peakToday: 0,
  utilizationRate: 0,
};

export const EMPTY_HOURLY_TREND: Array<{ time: string; occupancy: number; entry: number; exit: number }> = [];

export const EMPTY_HISTORICAL_TREND: Record<TrendFilter, Array<{ label: string; visitors: number }>> = {
  Today: [],
  Week: [],
  Month: [],
};

export const REPORTING_PERIODS = ["Current Period"] as const;

export const EMPTY_REPORTS: ReportRecord[] = [];
export const EMPTY_CAMERAS: Camera[] = [];
