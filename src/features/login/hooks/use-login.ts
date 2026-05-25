import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";
import { notifyError, notifySuccess } from "../../toasts/services/toast-service";
import { login } from "../api/login";
import type { LoginFormValues } from "../schemas/login-schema";
import { useAuthStore } from "../stores/auth-store";
import type { AuthRole } from "../types";

const getLandingRoute = (role: AuthRole) => (role === "enterprise" ? routePaths.enterpriseCameras : routePaths.enterpriseCameras);

export function useLogin(redirectTo?: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (session) => {
      queryClient.removeQueries({ queryKey: ["enterprise-current-user"] });
      setSession(session);
      if (session.user.mustChangePassword) {
        notifySuccess("Temporary credentials verified.");
        navigate(routePaths.changePassword, { replace: true });
        return;
      }
      notifySuccess("Secure login successful.");
      navigate(redirectTo ?? getLandingRoute(session.user.role), { replace: true });
    },
    onError: () => {
      notifyError("Login failed. Please check your credentials.");
    },
  });
}
