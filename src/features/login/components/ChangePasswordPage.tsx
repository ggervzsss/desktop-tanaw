import { type ChangeEvent, type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { routePaths } from "../../../app/router/routePaths";
import { cn } from "../../../utils/cn";
import { notifyError, notifySuccess } from "../../toasts/services/toast-service";
import { changePassword, logout as logoutRequest } from "../api/login";
import { useAuthStore } from "../stores/auth-store";

const cityHallImage =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg";

const citySeal = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Seal_of_San_Pedro%2C_Laguna.png/1280px-Seal_of_San_Pedro%2C_Laguna.png";

type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordErrors = Partial<Record<keyof PasswordValues, string>>;

const initialValues: PasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const [values, setValues] = useState<PasswordValues>(initialValues);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return <Navigate to={routePaths.login} replace />;
  }

  if (!user.mustChangePassword) {
    return <Navigate to={routePaths.enterpriseCameras} replace />;
  }

  const updateField = (field: keyof PasswordValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    const nextErrors: PasswordErrors = {};

    if (!values.currentPassword.trim()) {
      nextErrors.currentPassword = "Current temporary password is required.";
    }
    if (values.newPassword.length < 8) {
      nextErrors.newPassword = "New password must be at least 8 characters.";
    }
    if (values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await changePassword(values.currentPassword, values.newPassword);
      setSession(session);
      notifySuccess("Password updated.");
      navigate(routePaths.enterpriseCameras, { replace: true });
    } catch {
      notifyError("Unable to update password. Check the temporary password and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToLogin = async () => {
    try {
      await logoutRequest();
    } finally {
      logout();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950 px-4 py-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url('${cityHallImage}')` }} />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(5,91,37,0.92),rgba(42,48,99,0.72),rgba(17,24,39,0.9))]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-white/45 bg-white/95 p-5 shadow-2xl backdrop-blur-md sm:p-6"
      >
        <button
          type="button"
          onClick={handleReturnToLogin}
          className="hover:text-tanaw-green absolute top-4 left-4 rounded-md p-2 text-gray-500 transition hover:bg-gray-100"
          aria-label="Return to login"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="mb-5 flex flex-col items-center text-center">
          <img src={citySeal} alt="San Pedro Logo" className="mb-3 h-16 w-16 drop-shadow-md sm:h-20 sm:w-20" />
          <h1 className="font-display text-tanaw-green text-2xl font-bold sm:text-3xl">TANAW</h1>
          <p className="text-tanaw-navy mt-1 text-sm font-semibold tracking-wide">Enterprise Password Reset</p>
        </div>

        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white">
              <KeyRound size={17} />
            </span>
            <div>
              <p className="text-tanaw-navy text-sm font-bold">Temporary password verified</p>
              <p className="mt-1 text-xs leading-relaxed font-medium text-amber-800">Set a private password before accessing the Enterprise Desktop workspace.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <PasswordField
            label="Current Temporary Password"
            value={values.currentPassword}
            error={errors.currentPassword}
            onChange={updateField("currentPassword")}
          />
          <PasswordField label="New Password" value={values.newPassword} error={errors.newPassword} onChange={updateField("newPassword")} />
          <PasswordField
            label="Confirm New Password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={updateField("confirmPassword")}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-tanaw-green shadow-tanaw-green/25 hover:bg-tanaw-green-dark flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ShieldCheck size={19} />
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block">
      <span className="text-tanaw-navy mb-1.5 block text-sm font-semibold">{label}</span>
      <div className="relative">
        <LockKeyhole size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          type={showPassword ? "text" : "password"}
          className={cn("focus:ring-tanaw-green/25 w-full rounded-md border bg-gray-50 py-2.5 pr-11 pl-10 text-sm transition outline-none focus:ring-2", error ? "border-tanaw-red" : "border-gray-300")}
          value={value}
          onChange={onChange}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="hover:text-tanaw-green absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-gray-500 transition hover:bg-gray-100"
          aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <span className="text-tanaw-red mt-1 block text-xs font-semibold">{error}</span>}
    </label>
  );
}
