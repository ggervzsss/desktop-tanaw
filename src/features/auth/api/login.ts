import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { staffApi } from "../../../shared/lib/axios";
import type { LoginFormValues } from "../schemas/login-schema";
import type { AuthRole, LoginResponse } from "../types";

const getRoleForUsername = (username: string): AuthRole => {
  void username;
  return "enterprise";
};

const createMockLoginResponse = (config: InternalAxiosRequestConfig, credentials: LoginFormValues): Promise<AxiosResponse<LoginResponse>> =>
  new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (!credentials.username || !credentials.password) {
        reject(new Error("Missing credentials."));
        return;
      }

      const role = getRoleForUsername(credentials.username);

      resolve({
        data: {
          token: `tanaw-session-${Date.now()}`,
          user: {
            id: `${role}-${credentials.username.toLowerCase().replace(/\s+/g, "-")}`,
            name: "SPL Market Branch",
            email: "admin@splmarket.ph",
            role,
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    }, 650);
  });

export async function login(credentials: LoginFormValues) {
  const response = await staffApi.post<LoginResponse>("/auth/login", credentials, {
    adapter: (config) => createMockLoginResponse(config, credentials),
  });

  return response.data;
}
