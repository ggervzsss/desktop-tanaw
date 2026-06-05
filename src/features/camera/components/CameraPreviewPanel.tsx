import React from "react";
import { Edit2, Save, Trash2 } from "lucide-react";
import { Card } from "../../../components/Card";
import type { Camera } from "../../../types/enterprise";
import { CameraEditControls } from "./CameraEditControls";
import { CameraMonitoringPanel } from "./CameraMonitoringPanel";
import { CameraReadOnlyDetails } from "./CameraReadOnlyDetails";
import { CameraValidationWarnings } from "./CameraValidationWarnings";
import { CameraVideoPreview } from "./CameraVideoPreview";
import { NoCameraSelected } from "./NoCameraSelected";
import type { MlCounts, MlDetections, MlHealth, MlServiceStatus } from "../services/ml-service";

type CameraPreviewPanelProps = {
  activeCam?: Camera;
  counts: MlCounts;
  detections: MlDetections;
  editForm: Camera | null;
  error: string | null;
  health: MlHealth | null;
  isRestartingService: boolean;
  isEditMode: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isTesting: boolean;
  processingCameraId: number | null;
  serviceStatus: MlServiceStatus | null;
  streamUrl: string;
  warnings: string[];
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onRestartService: () => void;
  onSave: () => void;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
  onTestConnection: () => void;
  onEditFormChange: React.Dispatch<React.SetStateAction<Camera | null>>;
};

export function CameraPreviewPanel({
  activeCam,
  counts,
  detections,
  editForm,
  error,
  health,
  isRestartingService,
  isEditMode,
  isStarting,
  isStopping,
  isTesting,
  processingCameraId,
  serviceStatus,
  streamUrl,
  warnings,
  onCancelEdit,
  onDelete,
  onEdit,
  onRestartService,
  onSave,
  onStartProcessing,
  onStopProcessing,
  onTestConnection,
  onEditFormChange,
}: CameraPreviewPanelProps) {
  if (!activeCam) return <NoCameraSelected />;

  const isProcessing = processingCameraId === activeCam.id && counts.running;

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
              <button
                onClick={onEdit}
                className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-[#065f46] hover:text-[#065f46]"
                title="Edit Configuration"
              >
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
        <CameraMonitoringPanel
          activeCam={activeCam}
          counts={counts}
          error={error}
          health={health}
          isRestartingService={isRestartingService}
          isStarting={isStarting}
          isStopping={isStopping}
          isTesting={isTesting}
          processingCameraId={processingCameraId}
          serviceStatus={serviceStatus}
          onRestartService={onRestartService}
          onStartProcessing={onStartProcessing}
          onStopProcessing={onStopProcessing}
          onTestConnection={onTestConnection}
        />
        <CameraVideoPreview
          activeCam={activeCam}
          detections={detections}
          editForm={editForm}
          isProcessing={isProcessing}
          isEditMode={isEditMode}
          onEditFormChange={onEditFormChange}
          streamUrl={streamUrl}
        />
        <CameraValidationWarnings warnings={warnings} />
        {isEditMode && editForm ? <CameraEditControls editForm={editForm} onEditFormChange={onEditFormChange} /> : <CameraReadOnlyDetails activeCam={activeCam} />}
      </div>
    </Card>
  );
}
