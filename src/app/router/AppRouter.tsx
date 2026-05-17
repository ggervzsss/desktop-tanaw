import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { AnalyticsPage } from "../../features/analytics/pages/AnalyticsPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { EnterprisePage } from "../../features/enterprise/pages/EnterprisePage";
import { routes } from "./routes";

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.home} element={<Navigate to={routes.enterpriseCameras} replace />} />
      <Route path={routes.login} element={<LoginPage />} />
      <Route path={routes.enterprise} element={<EnterprisePage view="cameras" />} />
      <Route path={routes.enterpriseDashboard} element={<DashboardPage />} />
      <Route path={routes.enterpriseCameras} element={<EnterprisePage view="cameras" />} />
      <Route path={routes.enterpriseReports} element={<AnalyticsPage />} />
      <Route path="*" element={<Navigate to={routes.enterpriseCameras} replace />} />
    </Routes>
  );
}
