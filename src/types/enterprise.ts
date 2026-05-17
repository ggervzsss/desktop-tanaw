import { MOCK_DATA, SYSTEM_LOGS } from "../lib/enterpriseMockData";

export type SystemLogPeriod = keyof typeof SYSTEM_LOGS;
export type Metrics = (typeof SYSTEM_LOGS)[SystemLogPeriod];

export type DemoBreakdown = {
  thisProvMale: string;
  thisProvFemale: string;
  otherProvMale: string;
  otherProvFemale: string;
  foreignMale: string;
  foreignFemale: string;
};

export type AuditEntry = {
  time: string;
  action: string;
  actor: string;
};

export type ReportRecord = (typeof MOCK_DATA.reports)[number] & {
  period?: SystemLogPeriod;
  demo?: DemoBreakdown;
  notes?: string;
  auditTrail?: AuditEntry[];
  remarks?: string | null;
};

export type Camera = (typeof MOCK_DATA.cameras)[number];
export type ThemePreference = "light" | "dark" | "system";
export type EnterpriseView = "dashboard" | "cameras" | "reports" | "profile" | "security";

export type EnterpriseNotification = {
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
  target: EnterpriseView;
};
