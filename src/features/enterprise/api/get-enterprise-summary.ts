import type { EnterpriseSummary } from "../types";

export async function getEnterpriseSummary(): Promise<EnterpriseSummary> {
  return {
    currentOccupancy: 145,
    capacity: 200,
    entryToday: 856,
    exitToday: 711,
    lastUpdatedAt: new Date().toISOString(),
  };
}
