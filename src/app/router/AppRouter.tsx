import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../../features/login/components/LoginPage";
import { EnterpriseShell } from "../layouts/EnterpriseShell";
import { routePaths } from "./routePaths";

export function AppRouter() {
  return (
    <Routes>
      <Route path={routePaths.home} element={<Navigate to={routePaths.enterpriseCameras} replace />} />
      <Route path={routePaths.login} element={<LoginPage />} />
      <Route path={routePaths.enterprise} element={<EnterpriseShell initialView="cameras" />} />
      <Route path={routePaths.enterpriseDashboard} element={<EnterpriseShell initialView="dashboard" />} />
      <Route path={routePaths.enterpriseCameras} element={<EnterpriseShell initialView="cameras" />} />
      <Route path={routePaths.enterpriseReports} element={<EnterpriseShell initialView="reports" />} />
      <Route path={routePaths.enterpriseProfile} element={<EnterpriseShell initialView="profile" />} />
      <Route path={routePaths.enterpriseSecurity} element={<EnterpriseShell initialView="security" />} />
      <Route path="*" element={<Navigate to={routePaths.enterpriseCameras} replace />} />
    </Routes>
  );
}
