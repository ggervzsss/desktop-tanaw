export const routes = {
  home: "/",
  login: "/login",
  enterprise: "/enterprise",
  enterpriseDashboard: "/enterprise/dashboard",
  enterpriseCameras: "/enterprise/cameras",
  enterpriseReports: "/enterprise/reports",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
