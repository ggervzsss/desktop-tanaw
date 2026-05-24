import { staffApi } from "../../../lib/axios";
import type { LoginFormValues } from "../schemas/login-schema";
import type { LoginResponse } from "../types";

export async function login(credentials: LoginFormValues) {
  const response = await staffApi.post<LoginResponse>("/auth/login", credentials);

  return {
    ...response.data,
    user: {
      ...response.data.user,
      name: response.data.user.name ?? response.data.user.displayName ?? response.data.user.enterpriseName ?? "Enterprise User",
    },
  };
}
