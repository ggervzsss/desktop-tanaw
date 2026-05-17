import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";
import { notifyError, notifySuccess } from "../../toasts/services/toast-service";
import { login } from "../api/login";
import type { LoginFormValues } from "../schemas/login-schema";
import { useAuthStore } from "../stores/auth-store";
import type { AuthRole } from "../types";

const getLandingRoute = (role: AuthRole) => (role === "enterprise" ? routePaths.enterpriseCameras : routePaths.enterpriseCameras);

export function useLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (session) => {
      setSession(session);
      notifySuccess("Secure login successful.");
      navigate(getLandingRoute(session.user.role), { replace: true });
    },
    onError: () => {
      notifyError("Login failed. Please check your credentials.");
    },
  });
}
