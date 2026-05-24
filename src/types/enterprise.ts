export type SystemLogPeriod = "Current Period";

export type Metrics = {
  entries: number;
  peak: number;
  unique: number;
};

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

export type ReportRecord = {
  id: string;
  date: string;
  status: string;
  entries: number;
  unique: number;
  period?: SystemLogPeriod;
  demo?: DemoBreakdown;
  notes?: string;
  auditTrail?: AuditEntry[];
  remarks?: string | null;
};

export type Camera = {
  id: number;
  name: string;
  status: string;
  zone: string;
  fps: number;
  resolution: string;
  type: string;
  rtsp: string;
  config: {
    tripwire: number;
    roi: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    reverse: boolean;
  };
};
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
