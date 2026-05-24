export type AuthRole = "enterprise";

export type AuthUser = {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  role: AuthRole;
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  mustChangePassword?: boolean;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
