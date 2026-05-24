import { staffApi } from "../../../lib/axios";
import type { LoginFormValues } from "../schemas/login-schema";
import type { LoginResponse } from "../types";

function normalizeSession(response: LoginResponse): LoginResponse {
  return {
    ...response,
    user: {
      ...response.user,
      name: response.user.name ?? response.user.displayName ?? response.user.enterpriseName ?? "Enterprise User",
    },
  };
}

export async function login(credentials: LoginFormValues) {
  const response = await staffApi.post<LoginResponse>("/auth/login", {
    ...credentials,
    loginScope: "enterprise",
  });

  return normalizeSession(response.data);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const response = await staffApi.post<LoginResponse>("/auth/change-password", { currentPassword, newPassword });

  return normalizeSession(response.data);
}
