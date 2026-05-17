import { AlertTriangle } from "lucide-react";

type CameraValidationWarningsProps = {
  warnings: string[];
};

export function CameraValidationWarnings({ warnings }: CameraValidationWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {warnings.map((warning) => (
        <div key={warning} className="flex items-start gap-3 rounded-sm border border-orange-200 bg-orange-50 p-3 shadow-inner">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-600" />
          <p className="text-xs leading-relaxed font-medium text-orange-800">{warning}</p>
        </div>
      ))}
    </div>
  );
}
