import React from "react";
import { Edit2, Save, Trash2 } from "lucide-react";
import { Card } from "../../../components/Card";
import type { Camera } from "../../../types/enterprise";
import { CameraEditControls } from "./CameraEditControls";
import { CameraReadOnlyDetails } from "./CameraReadOnlyDetails";
import { CameraValidationWarnings } from "./CameraValidationWarnings";
import { CameraVideoPreview } from "./CameraVideoPreview";
import { NoCameraSelected } from "./NoCameraSelected";

type CameraPreviewPanelProps = {
  activeCam?: Camera;
  editForm: Camera | null;
  isEditMode: boolean;
  warnings: string[];
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: () => void;
  onEditFormChange: React.Dispatch<React.SetStateAction<Camera | null>>;
};

export function CameraPreviewPanel({ activeCam, editForm, isEditMode, warnings, onCancelEdit, onDelete, onEdit, onSave, onEditFormChange }: CameraPreviewPanelProps) {
  if (!activeCam) return <NoCameraSelected />;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-sm shadow-md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#111827]">
          Node Config: <span className="text-[#065f46]">{activeCam.name}</span>
        </h3>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <button onClick={onCancelEdit} className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={onSave} className="flex items-center gap-1.5 rounded-sm bg-[#065f46] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]">
                <Save size={14} /> Save Config
              </button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-[#065f46] hover:text-[#065f46]" title="Edit Configuration">
                <Edit2 size={14} />
              </button>
              <button onClick={onDelete} className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-red-600 hover:text-red-600" title="Delete Node">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-gray-50 p-5">
        <CameraVideoPreview activeCam={activeCam} editForm={editForm} isEditMode={isEditMode} />
        <CameraValidationWarnings warnings={warnings} />
        {isEditMode && editForm ? <CameraEditControls editForm={editForm} onEditFormChange={onEditFormChange} /> : <CameraReadOnlyDetails activeCam={activeCam} />}
      </div>
    </Card>
  );
}
