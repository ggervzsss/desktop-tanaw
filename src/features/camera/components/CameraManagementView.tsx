import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmationDialog } from "../../../components/ConfirmationDialog";
import type { Camera } from "../../../types/enterprise";
import { CameraAddModal } from "./CameraAddModal";
import { CameraList } from "./CameraList";
import { CameraPreviewPanel } from "./CameraPreviewPanel";
import type { CameraFormValues } from "../types/camera";
import { getValidationWarnings } from "../utils/camera-validation";
import { validateRequiredText, validateRtspUrl } from "../../../utils/form-validation";

type CameraManagementViewProps = {
  cameras: Camera[];
  setCameras: React.Dispatch<React.SetStateAction<Camera[]>>;
};

const emptyCameraForm: CameraFormValues = { name: "", rtsp: "", zone: "" };
type CameraFormErrors = Partial<Record<keyof CameraFormValues, string>>;

export function CameraManagementView({ cameras, setCameras }: CameraManagementViewProps) {
  const [activeCamId, setActiveCamId] = useState<number | null>(cameras[0]?.id ?? null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCam, setNewCam] = useState<CameraFormValues>(emptyCameraForm);
  const [cameraFormErrors, setCameraFormErrors] = useState<CameraFormErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [editForm, setEditForm] = useState<Camera | null>(null);
  const [cameraPendingDelete, setCameraPendingDelete] = useState<Camera | null>(null);

  const activeCam = cameras.find((camera) => camera.id === activeCamId);
  const warnings = isEditMode && editForm ? getValidationWarnings(editForm.config) : getValidationWarnings(activeCam?.config);

  useEffect(() => {
    if (activeCam) {
      setEditForm(JSON.parse(JSON.stringify(activeCam)) as Camera);
    }
  }, [activeCam]);

  const handleDelete = () => {
    if (!activeCam) return;
    setCameraPendingDelete(activeCam);
  };

  const confirmDeleteCamera = () => {
    if (!cameraPendingDelete) return;

    const updated = cameras.filter((camera) => camera.id !== cameraPendingDelete.id);
    setCameras(updated);
    setActiveCamId(updated[0]?.id || null);
    setIsEditMode(false);
    setCameraPendingDelete(null);
  };

  const handleSave = () => {
    if (!editForm) return;
    setCameras((current) => current.map((camera) => (camera.id === activeCamId ? editForm : camera)));
    setIsEditMode(false);
  };

  const handleAddCamera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateCameraForm(newCam);
    setCameraFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsValidating(true);

    window.setTimeout(() => {
      const newCameraNode: Camera = {
        id: Date.now(),
        name: newCam.name.trim(),
        status: "online",
        zone: newCam.zone.trim(),
        fps: 30,
        resolution: "1080p",
        type: "Entry/Exit",
        rtsp: newCam.rtsp.trim(),
        config: {
          tripwire: 50,
          roi: { top: 10, left: 10, width: 80, height: 80 },
          reverse: false,
        },
      };

      setCameras([...cameras, newCameraNode]);
      setActiveCamId(newCameraNode.id);
      setNewCam(emptyCameraForm);
      setCameraFormErrors({});
      setIsValidating(false);
      setShowAddModal(false);
    }, 1500);
  };

  const handleNewCameraChange = (values: CameraFormValues) => {
    setNewCam(values);
    setCameraFormErrors({});
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCameraFormErrors({});
  };

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {showAddModal && <CameraAddModal newCam={newCam} isValidating={isValidating} errors={cameraFormErrors} onClose={closeAddModal} onSubmit={handleAddCamera} onChange={handleNewCameraChange} />}
      {cameraPendingDelete && (
        <ConfirmationDialog
          cancelLabel="Keep Camera"
          confirmLabel="Delete Camera"
          onCancel={() => setCameraPendingDelete(null)}
          onConfirm={confirmDeleteCamera}
          title="Delete Camera Node"
          variant="danger"
        >
          <p>
            Are you sure you want to delete <span className="font-bold text-[#111827]">{cameraPendingDelete.name}</span>? This will stop all edge counting on this node.
          </p>
        </ConfirmationDialog>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Edge Device Management</h2>
          <p className="mt-1 text-sm text-gray-500">Configure RTSP streams and visual counting zones for your establishment.</p>
        </div>
        <button
          onClick={() => {
            setCameraFormErrors({});
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#044a36]"
        >
          <Plus size={16} /> Add Camera Node
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <CameraList
            cameras={cameras}
            activeCamId={activeCamId}
            onSelect={(cameraId) => {
              setActiveCamId(cameraId);
              setIsEditMode(false);
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <CameraPreviewPanel
            activeCam={activeCam}
            editForm={editForm}
            isEditMode={isEditMode}
            warnings={warnings}
            onCancelEdit={() => setIsEditMode(false)}
            onDelete={handleDelete}
            onEdit={() => setIsEditMode(true)}
            onSave={handleSave}
            onEditFormChange={setEditForm}
          />
        </div>
      </div>
    </div>
  );
}

function validateCameraForm(values: CameraFormValues) {
  const errors: CameraFormErrors = {};
  const nameError = validateRequiredText(values.name, "Camera name", 2);
  const zoneError = validateRequiredText(values.zone, "Assigned zone", 2);
  const rtspError = validateRtspUrl(values.rtsp);

  if (nameError) errors.name = nameError;
  if (zoneError) errors.zone = zoneError;
  if (rtspError) errors.rtsp = rtspError;

  return errors;
}
