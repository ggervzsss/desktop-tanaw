import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../app/router/routes";
import { login } from "../api/login";
import type { LoginFormValues } from "../schemas/login-schema";
import { useAuthStore } from "../stores/auth-store";
import type { AuthRole } from "../types";

const getLandingRoute = (role: AuthRole) => (role === "enterprise" ? routes.enterpriseCameras : routes.enterpriseCameras);

export function useLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (session) => {
      setSession(session);
      toast.success("Secure login successful.");
      navigate(getLandingRoute(session.user.role), { replace: true });
    },
    onError: () => {
      toast.error("Login failed. Please check your credentials.");
    },
  });
}
