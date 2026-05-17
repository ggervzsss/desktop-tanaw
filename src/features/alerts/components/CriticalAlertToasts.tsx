import { AlertTriangle, X } from "lucide-react";
import type { EnterpriseNotification } from "../../../types/enterprise";

type CriticalAlertToastsProps = {
  toasts: EnterpriseNotification[];
  onReview: (toast: EnterpriseNotification) => void;
  onDismiss: (toastId: number) => void;
};

export function CriticalAlertToasts({ toasts, onReview, onDismiss }: CriticalAlertToastsProps) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-100 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="animate-in slide-in-from-right-8 fade-in pointer-events-auto flex w-80 items-start gap-3 rounded-r-sm border-l-4 border-[#a40e0e] bg-red-50 p-4 shadow-2xl">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#a40e0e]" />
          <div className="group flex-1 cursor-pointer" onClick={() => onReview(toast)}>
            <p className="text-sm font-black tracking-wider text-[#a40e0e] uppercase">Critical Alert</p>
            <p className="mt-1 text-xs leading-relaxed font-semibold text-red-900 group-hover:underline">{toast.message}</p>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-widest text-[#a40e0e] uppercase opacity-80 group-hover:opacity-100">Review Issue &rarr;</p>
          </div>
          <button onClick={() => onDismiss(toast.id)} className="rounded-sm bg-white/50 p-1 text-red-400 transition-colors hover:bg-white hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
