import { type FormEvent, useState } from "react";
import { Check, RefreshCw, Save, Shield, Upload } from "lucide-react";
import { Card } from "../../../components/Card";

export function ProfileView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
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
            <span className="font-['Bai_Jamjuree'] text-2xl font-bold text-[#2a3063] transition-opacity group-hover:opacity-0">SP</span>
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

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Full Name / Lead Admin</label>
              <input type="text" defaultValue="Juan Dela Cruz" className="w-full rounded-sm border border-gray-300 p-3 text-sm transition-colors outline-none focus:border-[#065f46]" required />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Business Email</label>
              <input type="email" defaultValue="admin@splmarket.ph" className="w-full rounded-sm border border-gray-300 p-3 text-sm transition-colors outline-none focus:border-[#065f46]" required />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Contact Number</label>
              <input type="tel" defaultValue="+63 917 123 4567" className="w-full rounded-sm border border-gray-300 p-3 text-sm transition-colors outline-none focus:border-[#065f46]" required />
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-sm border border-gray-200 bg-gray-50 p-4 shadow-inner">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
              <Shield size={14} className="text-[#065f46]" /> Enterprise Identity (Read-Only)
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">Current Node</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">SPL Market Branch</div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">LGU Affiliation</label>
                <div className="rounded-sm border border-gray-200 bg-gray-100 p-2.5 text-sm font-semibold text-[#111827]">San Pedro City</div>
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
}
