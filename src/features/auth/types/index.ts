export type AuthRole = "enterprise";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
