import { type ChangeEvent, type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
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

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginMutation = useLogin();
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
          <h1 className="font-display text-3xl font-bold text-tanaw-green">TANAW</h1>
          <p className="mt-1 text-sm font-semibold tracking-wide text-[#2a3063]">System Login Portal</p>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2a3063]">Username</span>
            <div className="relative">
              <UserRound size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                className={cn(
                  "w-full rounded-md border bg-gray-50 py-3 pr-4 pl-10 text-sm transition outline-none focus:ring-2 focus:ring-[#055b25]/25",
                  errors.username ? "border-[#a40e0e]" : "border-gray-300",
                )}
                placeholder="admin or staff username"
                value={values.username}
                onChange={updateField("username")}
              />
            </div>
            {errors.username && <span className="mt-1 block text-xs font-semibold text-[#a40e0e]">{errors.username}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2a3063]">Password</span>
            <div className="relative">
              <LockKeyhole size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                className={cn(
                  "w-full rounded-md border bg-gray-50 py-3 pr-11 pl-10 text-sm transition outline-none focus:ring-2 focus:ring-[#055b25]/25",
                  errors.password ? "border-[#a40e0e]" : "border-gray-300",
                )}
                placeholder="Enter password"
                value={values.password}
                onChange={updateField("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-gray-500 transition hover:bg-gray-100 hover:text-tanaw-green"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="mt-1 block text-xs font-semibold text-[#a40e0e]">{errors.password}</span>}
          </label>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-tanaw-green px-4 py-3 font-bold text-white shadow-lg shadow-[#055b25]/25 transition hover:bg-[#044a1e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Shield size={19} />
            {loginMutation.isPending ? "Verifying..." : "Secure Login"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-gray-500">Enterprise desktop access is restricted to registered establishment operators.</p>
      </motion.form>
    </div>
  );
}
