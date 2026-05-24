import { type ChangeEvent, type FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, LockKeyhole, Shield, UserRound } from "lucide-react";
import { routePaths } from "../../../app/router/routePaths";
import { cn } from "../../../utils/cn";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginFormValues } from "../schemas/login-schema";
import { useAuthStore } from "../stores/auth-store";

const cityHallImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg";

const citySeal = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Seal_of_San_Pedro%2C_Laguna.png/1280px-Seal_of_San_Pedro%2C_Laguna.png";

type FormErrors = Partial<Record<keyof LoginFormValues, string>>;

const getAuthenticatedRoute = () => routePaths.enterpriseCameras;

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const redirectTo = locationState?.from?.pathname ? `${locationState.from.pathname}${locationState.from.search ?? ""}` : undefined;
  const loginMutation = useLogin(redirectTo);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<LoginFormValues>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  if (isAuthenticated) {
    return <Navigate to={getAuthenticatedRoute()} replace />;
  }

  const updateField = (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FormErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormValues;
        nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    loginMutation.mutate(parsed.data);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url('${cityHallImage}')` }} />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(5,91,37,0.92),rgba(42,48,99,0.72),rgba(17,24,39,0.9))]" />

      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-lg border border-white/45 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={citySeal} alt="San Pedro Logo" className="mb-4 h-24 w-24 drop-shadow-md" />
          <h1 className="font-display text-tanaw-green text-3xl font-bold">TANAW</h1>
          <p className="text-tanaw-navy mt-1 text-sm font-semibold tracking-wide">System Login Portal</p>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="text-tanaw-navy mb-2 block text-sm font-semibold">Username</span>
            <div className="relative">
              <UserRound size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                className={cn(
                  "focus:ring-tanaw-green/25 w-full rounded-md border bg-gray-50 py-3 pr-4 pl-10 text-sm transition outline-none focus:ring-2",
                  errors.username ? "border-tanaw-red" : "border-gray-300",
                )}
                placeholder="Enterprise ID or contact email"
                value={values.username}
                onChange={updateField("username")}
              />
            </div>
            {errors.username && <span className="text-tanaw-red mt-1 block text-xs font-semibold">{errors.username}</span>}
          </label>

          <label className="block">
            <span className="text-tanaw-navy mb-2 block text-sm font-semibold">Password</span>
            <div className="relative">
              <LockKeyhole size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                className={cn(
                  "focus:ring-tanaw-green/25 w-full rounded-md border bg-gray-50 py-3 pr-11 pl-10 text-sm transition outline-none focus:ring-2",
                  errors.password ? "border-tanaw-red" : "border-gray-300",
                )}
                placeholder="Enter password"
                value={values.password}
                onChange={updateField("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="hover:text-tanaw-green absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-gray-500 transition hover:bg-gray-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="text-tanaw-red mt-1 block text-xs font-semibold">{errors.password}</span>}
          </label>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="bg-tanaw-green shadow-tanaw-green/25 hover:bg-tanaw-green-dark flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Shield size={19} />
            {loginMutation.isPending ? "Verifying..." : "Secure Login"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-gray-500">Use the Enterprise ID shown after setup, or the registered contact email.</p>
      </motion.form>
    </div>
  );
}
