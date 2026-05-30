import { type FormEvent, useEffect, useState } from "react";
import { Check, RefreshCw, Save, Shield, Upload } from "lucide-react";
import { Card } from "../../../components/Card";
import { ContactNumberInput } from "../../../components/ContactNumberInput";
import { useAuthStore } from "../../login/stores/auth-store";
import { normalizeEmail, normalizeName, toPhilippineLocalDigits, validateEmail, validateName, validatePhilippineContactNumber, validateRequiredText } from "../../../utils/form-validation";

type ProfileFormState = {
  managerName: string;
  email: string;
  phoneLocal: string;
  enterpriseName: string;
  address: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

export function ProfileView() {
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const enterpriseName = user?.enterpriseName ?? user?.displayName ?? user?.name ?? "Enterprise Account";
  const managerName = user?.managerName ?? user?.name ?? user?.displayName ?? "Not provided";
  const initials = getInitials(enterpriseName);
  const [form, setForm] = useState<ProfileFormState>(() => ({
    managerName,
    email: user?.email ?? "",
    phoneLocal: toPhilippineLocalDigits(user?.phone ?? ""),
    enterpriseName,
    address: user?.address ?? "",
  }));
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  useEffect(() => {
    setForm({
      managerName,
      email: user?.email ?? "",
      phoneLocal: toPhilippineLocalDigits(user?.phone ?? ""),
      enterpriseName,
      address: user?.address ?? "",
    });
    setErrors({});
  }, [enterpriseName, managerName, user?.address, user?.email, user?.phone]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateProfileForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setTimeout(() => {
      setForm((current) => ({
        ...current,
        managerName: normalizeName(current.managerName),
        email: normalizeEmail(current.email),
        enterpriseName: current.enterpriseName.trim(),
        address: current.address.trim(),
      }));
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="animate-in fade-in mx-auto max-w-4xl space-y-6 font-['Inter'] duration-500 lg:mx-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Enterprise Profile</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your establishment's identity and primary contact details.</p>
      </div>

      <Card className="p-6 md:p-8">
        {/* Avatar Area */}
        <div className="mb-8 flex flex-col items-start gap-6 border-b border-gray-100 pb-8 sm:flex-row sm:items-center">
          <div className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 shadow-sm">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Upload size={20} className="text-white" />
            </div>
            <span className="text-tanaw-navy font-['Bai_Jamjuree'] text-2xl font-bold transition-opacity group-hover:opacity-0">{initials}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Establishment Logo</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Upload a professional logo or primary display picture.
              <br />
              Recommended format: 256x256px PNG or JPG.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Full Name / Lead Admin</label>
              <input
                type="text"
                value={form.managerName}
                onChange={(event) => updateField("managerName", event.target.value)}
                className={`w-full rounded-sm border p-3 text-sm transition-colors outline-none focus:border-[#065f46] ${errors.managerName ? "border-tanaw-red" : "border-gray-300"}`}
                required
              />
              {errors.managerName && <p className="text-tanaw-red mt-1.5 text-xs font-semibold">{errors.managerName}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Business Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={`w-full rounded-sm border p-3 text-sm transition-colors outline-none focus:border-[#065f46] ${errors.email ? "border-tanaw-red" : "border-gray-300"}`}
                required
              />
              {errors.email && <p className="text-tanaw-red mt-1.5 text-xs font-semibold">{errors.email}</p>}
            </div>
            <div>
              <ContactNumberInput label="Contact Number" value={form.phoneLocal} onChange={(value) => updateField("phoneLocal", value)} error={errors.phoneLocal} required />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Enterprise Name</label>
              <input
                type="text"
                value={form.enterpriseName}
                onChange={(event) => updateField("enterpriseName", event.target.value)}
                className={`w-full rounded-sm border p-3 text-sm transition-colors outline-none focus:border-[#065f46] ${errors.enterpriseName ? "border-tanaw-red" : "border-gray-300"}`}
                required
              />
              {errors.enterpriseName && <p className="text-tanaw-red mt-1.5 text-xs font-semibold">{errors.enterpriseName}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Registered Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className={`w-full rounded-sm border p-3 text-sm transition-colors outline-none focus:border-[#065f46] ${errors.address ? "border-tanaw-red" : "border-gray-300"}`}
              />
              {errors.address && <p className="text-tanaw-red mt-1.5 text-xs font-semibold">{errors.address}</p>}
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-sm border border-gray-200 bg-gray-50 p-4 shadow-inner">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
              <Shield size={14} className="text-[#065f46]" /> Enterprise Identity (Read-Only)
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">Current Node</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">{enterpriseName}</div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">LGU Affiliation</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">{[user?.category ?? "Registered Enterprise", user?.barangay ? `Barangay ${user.barangay}` : "San Pedro City"].join(" - ")}</div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">Enterprise ID</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">{user?.enterpriseId ?? "Not assigned"}</div>
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-500">To modify your establishment's structural identity, please contact the LGU Administrator.</p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex min-w-42.5 items-center justify-center gap-2 rounded-sm bg-[#065f46] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-[#065f46]/70"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : isSuccess ? <Check size={16} /> : <Save size={16} />}
              {isLoading ? "Saving..." : isSuccess ? "Saved Successfully" : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );

  function updateField<FieldName extends keyof ProfileFormState>(field: FieldName, value: ProfileFormState[FieldName]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }
}

function validateProfileForm(form: ProfileFormState) {
  const errors: ProfileFormErrors = {};
  const managerNameError = validateName(form.managerName, "Full name");
  const emailError = validateEmail(form.email);
  const phoneError = validatePhilippineContactNumber(form.phoneLocal ? `+63${form.phoneLocal}` : "", true);
  const enterpriseNameError = validateRequiredText(form.enterpriseName, "Enterprise name", 2);

  if (managerNameError) errors.managerName = managerNameError;
  if (emailError) errors.email = emailError;
  if (phoneError) errors.phoneLocal = phoneError;
  if (enterpriseNameError) errors.enterpriseName = enterpriseNameError;

  return errors;
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "EA";
}
