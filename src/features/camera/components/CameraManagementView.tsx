import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmationDialog } from "../../../components/ConfirmationDialog";
import type { Camera } from "../../../types/enterprise";
import { validateCameraStreamUrl, validateRequiredText } from "../../../utils/form-validation";
import { CameraAddModal } from "./CameraAddModal";
import { CameraList } from "./CameraList";
import { CameraPreviewPanel } from "./CameraPreviewPanel";
import type { CameraFormValues } from "../types/camera";
import { getValidationWarnings } from "../utils/camera-validation";
import {
  DEFAULT_ML_SERVICE_BASE_URL,
  EMPTY_ML_COUNTS,
  getMlCounts,
  getMlHealth,
  getPreviewStreamUrl,
  getMlServiceStatus,
  restartMlService,
  startCameraProcessing,
  stopCameraProcessing,
  testCameraConnection,
} from "../services/ml-service";
import type { MlCounts, MlHealth, MlServiceStatus } from "../services/ml-service";

type CameraManagementViewProps = {
  cameras: Camera[];
  setCameras: React.Dispatch<React.SetStateAction<Camera[]>>;
};

const CAMERA_STORAGE_KEY = "tanaw.enterprise.camera-configs";

const emptyCameraForm: CameraFormValues = {
  cameraType: "IP_WEBCAM",
  confidence: 0.35,
  name: "",
  password: "",
  rtsp: "",
  username: "",
  zone: "",
};

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
  const [hydratedFromStorage, setHydratedFromStorage] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<MlServiceStatus | null>(null);
  const [health, setHealth] = useState<MlHealth | null>(null);
  const [counts, setCounts] = useState<MlCounts>(EMPTY_ML_COUNTS);
  const [processingCameraId, setProcessingCameraId] = useState<number | null>(null);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRestartingService, setIsRestartingService] = useState(false);

  const activeCam = cameras.find((camera) => camera.id === activeCamId);
  const warnings = isEditMode && editForm ? getValidationWarnings(editForm.config) : getValidationWarnings(activeCam?.config);
  const mlBaseUrl = serviceStatus?.baseUrl ?? DEFAULT_ML_SERVICE_BASE_URL;
  const streamUrl = useMemo(() => getPreviewStreamUrl(mlBaseUrl, activeCam, streamVersion), [activeCam, mlBaseUrl, streamVersion]);

  const updateCameraStatus = useCallback(
    (cameraId: number, status: Camera["status"]) => {
      setCameras((current) => current.map((camera) => (camera.id === cameraId ? { ...camera, status } : camera)));
    },
    [setCameras],
  );

  const refreshMlStatus = useCallback(async () => {
    const nextStatus = await getMlServiceStatus();
    setServiceStatus(nextStatus);

    try {
      const nextHealth = await getMlHealth(nextStatus.baseUrl);
      setHealth(nextHealth);
    } catch (error) {
      setHealth(null);
      setMonitoringError(toErrorMessage(error));
    }
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const nextCounts = await getMlCounts(mlBaseUrl);
      setCounts(nextCounts);

      if (!nextCounts.running) {
        setProcessingCameraId(null);
        setCameras((current) => current.map((camera) => (camera.status === "running" ? { ...camera, status: nextCounts.status === "error" ? "error" : "stopped" } : camera)));
      }
    } catch {
      setCounts((current) => ({ ...current, running: false, status: "offline" }));
    }
  }, [mlBaseUrl, setCameras]);

  useEffect(() => {
    const saved = window.localStorage.getItem(CAMERA_STORAGE_KEY);
    if (!saved) {
      setHydratedFromStorage(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Camera[];
      const normalized = parsed.map(normalizeCamera);
      setCameras(normalized);
      setActiveCamId(normalized[0]?.id ?? null);
    } catch {
      window.localStorage.removeItem(CAMERA_STORAGE_KEY);
    } finally {
      setHydratedFromStorage(true);
    }
  }, [setCameras]);

  useEffect(() => {
    if (!hydratedFromStorage) return;
    window.localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(cameras));
  }, [cameras, hydratedFromStorage]);

  useEffect(() => {
    if (activeCamId !== null && cameras.some((camera) => camera.id === activeCamId)) return;
    setActiveCamId(cameras[0]?.id ?? null);
  }, [activeCamId, cameras]);

  useEffect(() => {
    if (activeCam) {
      setEditForm(JSON.parse(JSON.stringify(activeCam)) as Camera);
    }
  }, [activeCam]);

  useEffect(() => {
    void refreshMlStatus();
    const intervalId = window.setInterval(() => void refreshMlStatus(), 4000);
    return () => window.clearInterval(intervalId);
  }, [refreshMlStatus]);

  useEffect(() => {
    void refreshCounts();
    const intervalId = window.setInterval(() => void refreshCounts(), 1000);
    return () => window.clearInterval(intervalId);
  }, [refreshCounts]);

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

    const rtspError = validateCameraStreamUrl(editForm.rtsp);
    if (rtspError) {
      setMonitoringError(rtspError);
      return;
    }

    if (!Number.isFinite(editForm.confidence) || editForm.confidence < 0.05 || editForm.confidence > 0.95) {
      setMonitoringError("Confidence threshold must be between 0.05 and 0.95.");
      return;
    }

    setCameras((current) => current.map((camera) => (camera.id === activeCamId ? { ...editForm, status: camera.rtsp === editForm.rtsp ? editForm.status : "untested" } : camera)));
    setMonitoringError(null);
    setIsEditMode(false);
  };

  const handleAddCamera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateCameraForm(newCam);
    setCameraFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsValidating(true);

    const newCameraNode: Camera = {
      cameraType: newCam.cameraType,
      confidence: newCam.confidence,
      config: {
        reverse: false,
        roi: { top: 10, left: 10, width: 80, height: 80 },
        tripwire: 50,
      },
      fps: 0,
      id: Date.now(),
      name: newCam.name.trim(),
      password: newCam.password.trim() || undefined,
      resolution: "Adaptive",
      rtsp: newCam.rtsp.trim(),
      status: "untested",
      type: "Entry/Exit",
      username: newCam.username.trim() || undefined,
      zone: newCam.zone.trim(),
    };

    setCameras((current) => [...current, newCameraNode]);
    setActiveCamId(newCameraNode.id);
    setNewCam(emptyCameraForm);
    setCameraFormErrors({});
    setMonitoringError(null);
    setIsValidating(false);
    setShowAddModal(false);
  };

  const handleNewCameraChange = (values: CameraFormValues) => {
    setNewCam(values);
    setCameraFormErrors({});
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCameraFormErrors({});
  };

  const handleTestConnection = useCallback(async () => {
    if (!activeCam) return;

    setIsTesting(true);
    setMonitoringError(null);

    try {
      const result = await testCameraConnection(mlBaseUrl, activeCam.rtsp);
      updateCameraStatus(activeCam.id, result.ok ? "online" : "offline");
      setMonitoringError(result.ok ? null : result.message);
      await refreshMlStatus();
    } catch (error) {
      updateCameraStatus(activeCam.id, "error");
      setMonitoringError(toErrorMessage(error));
    } finally {
      setIsTesting(false);
    }
  }, [activeCam, mlBaseUrl, refreshMlStatus, updateCameraStatus]);

  const handleStartProcessing = useCallback(async () => {
    if (!activeCam) return;

    setIsStarting(true);
    setMonitoringError(null);

    try {
      await startCameraProcessing(mlBaseUrl, activeCam);
      updateCameraStatus(activeCam.id, "running");
      setProcessingCameraId(activeCam.id);
      setCounts({ ...EMPTY_ML_COUNTS, running: true, status: "running" });
      setStreamVersion((current) => current + 1);
      await refreshMlStatus();
      await refreshCounts();
    } catch (error) {
      updateCameraStatus(activeCam.id, "error");
      setMonitoringError(toErrorMessage(error));
    } finally {
      setIsStarting(false);
    }
  }, [activeCam, mlBaseUrl, refreshCounts, refreshMlStatus, updateCameraStatus]);

  const handleStopProcessing = useCallback(async () => {
    const cameraId = processingCameraId ?? activeCam?.id;
    if (!cameraId) return;

    setIsStopping(true);
    setMonitoringError(null);

    try {
      await stopCameraProcessing(mlBaseUrl);
      updateCameraStatus(cameraId, "stopped");
      setProcessingCameraId(null);
      setCounts(EMPTY_ML_COUNTS);
      setStreamVersion((current) => current + 1);
      await refreshMlStatus();
      await refreshCounts();
    } catch (error) {
      setMonitoringError(toErrorMessage(error));
    } finally {
      setIsStopping(false);
    }
  }, [activeCam?.id, mlBaseUrl, processingCameraId, refreshCounts, refreshMlStatus, updateCameraStatus]);

  const handleRestartService = useCallback(async () => {
    setIsRestartingService(true);
    setMonitoringError(null);

    try {
      const nextStatus = await restartMlService();
      setServiceStatus(nextStatus);
      setProcessingCameraId(null);
      setCounts(EMPTY_ML_COUNTS);
      setStreamVersion((current) => current + 1);
    } catch (error) {
      setMonitoringError(toErrorMessage(error));
    } finally {
      setIsRestartingService(false);
    }
  }, []);

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
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Camera Integration & Counting</h2>
          <p className="mt-1 text-sm text-gray-500">Configure IP Webcam streams, run local YOLOv8 processing, and monitor tripwire counts.</p>
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
            counts={counts}
            editForm={editForm}
            error={monitoringError}
            health={health}
            isRestartingService={isRestartingService}
            isEditMode={isEditMode}
            isStarting={isStarting}
            isStopping={isStopping}
            isTesting={isTesting}
            processingCameraId={processingCameraId}
            serviceStatus={serviceStatus}
            streamUrl={streamUrl}
            warnings={warnings}
            onCancelEdit={() => setIsEditMode(false)}
            onDelete={handleDelete}
            onEdit={() => setIsEditMode(true)}
            onEditFormChange={setEditForm}
            onRestartService={handleRestartService}
            onSave={handleSave}
            onStartProcessing={handleStartProcessing}
            onStopProcessing={handleStopProcessing}
            onTestConnection={handleTestConnection}
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
  const streamError = validateCameraStreamUrl(values.rtsp);

  if (nameError) errors.name = nameError;
  if (zoneError) errors.zone = zoneError;
  if (streamError) errors.rtsp = streamError;
  if (!Number.isFinite(values.confidence) || values.confidence < 0.05 || values.confidence > 0.95) {
    errors.confidence = "Confidence threshold must be between 0.05 and 0.95.";
  }

  return errors;
}

function normalizeCamera(camera: Camera): Camera {
  const streamUrl = camera.rtsp ?? "";
  const cameraType = camera.cameraType ?? (streamUrl.startsWith("http") ? "IP_WEBCAM" : "RTSP_CCTV");

  return {
    ...camera,
    cameraType,
    confidence: camera.confidence ?? 0.35,
    fps: camera.fps ?? 0,
    resolution: camera.resolution ?? "Adaptive",
    status: camera.status ?? "untested",
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The ML camera service request failed.";
}
