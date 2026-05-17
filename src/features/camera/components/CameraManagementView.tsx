import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle, Edit2, Maximize, Move, Plus, RefreshCw, Save, Shield, Trash2, Video, X } from "lucide-react";
import { Card } from "../../../components/Card";
import type { Camera } from "../../../types/enterprise";

type CameraManagementViewProps = {
  cameras: Camera[];
  setCameras: React.Dispatch<React.SetStateAction<Camera[]>>;
};

export function CameraManagementView({ cameras, setCameras }: CameraManagementViewProps) {
  const [activeCamId, setActiveCamId] = useState<number | null>(cameras[0]?.id ?? null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Modal State
  const [newCam, setNewCam] = useState({ name: "", rtsp: "", zone: "" });
  const [isValidating, setIsValidating] = useState(false);

  const activeCam = cameras.find((c) => c.id === activeCamId);
  const [editForm, setEditForm] = useState<Camera | null>(null);

  useEffect(() => {
    if (activeCam) {
      setEditForm(JSON.parse(JSON.stringify(activeCam))); // Deep copy for editing
    }
  }, [activeCam, isEditMode]);

  const handleDelete = () => {
    if (!activeCam) return;
    if (window.confirm(`Are you sure you want to delete ${activeCam.name}? This will stop all edge counting on this node.`)) {
      const updated = cameras.filter((c) => c.id !== activeCamId);
      setCameras(updated);
      setActiveCamId(updated[0]?.id || null);
      setIsEditMode(false);
    }
  };

  const handleSave = () => {
    if (!editForm) return;
    setCameras((prev) => prev.map((c) => (c.id === activeCamId ? editForm : c)));
    setIsEditMode(false);
  };

  const handleAddCamera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsValidating(true);

    // Simulate connection validation delay
    setTimeout(() => {
      const newCameraNode = {
        id: Date.now(),
        name: newCam.name,
        status: "online",
        zone: newCam.zone,
        fps: 30,
        resolution: "1080p",
        type: "Entry/Exit",
        rtsp: newCam.rtsp,
        config: {
          tripwire: 50,
          roi: { top: 10, left: 10, width: 80, height: 80 },
          reverse: false,
        },
      };
      setCameras([...cameras, newCameraNode]);
      setActiveCamId(newCameraNode.id);
      setNewCam({ name: "", rtsp: "", zone: "" });
      setIsValidating(false);
      setShowAddModal(false);
    }, 1500);
  };

  const getValidationWarnings = (config?: Camera["config"]) => {
    const warnings: string[] = [];
    if (!config) return warnings;
    if (config.tripwire < 20 || config.tripwire > 80) {
      warnings.push("Warning: Tripwire placed too close to the frame edge. Head occlusion may occur, reducing accuracy.");
    }
    if (config.roi.width < 40 || config.roi.height < 40) {
      warnings.push("Warning: Region of Interest (ROI) is small. Ensure it fully covers the primary entry/exit pathway.");
    }
    return warnings;
  };

  const warnings = isEditMode && editForm ? getValidationWarnings(editForm.config) : getValidationWarnings(activeCam?.config);

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {/* ADD CAMERA MODAL */}
      {showAddModal && (
        <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-sm border-t-4 border-[#065f46] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-[#111827]">
                <Video size={20} className="text-[#065f46]" /> Register Camera Node
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCamera} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">Camera Name</label>
                <input
                  required
                  type="text"
                  value={newCam.name}
                  onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                  placeholder="e.g., South Gate Main"
                  className="w-full rounded-sm border border-gray-300 p-2.5 text-sm outline-none focus:border-[#065f46]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">Assigned Zone</label>
                <input
                  required
                  type="text"
                  value={newCam.zone}
                  onChange={(e) => setNewCam({ ...newCam, zone: e.target.value })}
                  placeholder="e.g., Lobby"
                  className="w-full rounded-sm border border-gray-300 p-2.5 text-sm outline-none focus:border-[#065f46]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">RTSP Stream URL</label>
                <input
                  required
                  type="text"
                  value={newCam.rtsp}
                  onChange={(e) => setNewCam({ ...newCam, rtsp: e.target.value })}
                  placeholder="rtsp://username:password@ip:port/stream"
                  className="w-full rounded-sm border border-gray-300 p-2.5 font-mono text-sm outline-none focus:border-[#065f46]"
                />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-sm border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                <Shield size={16} className="mt-0.5 shrink-0" />
                <p>Credentials are processed locally on the edge node. Video streams are never transmitted to the cloud.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36] disabled:bg-gray-400"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Validating Stream...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Connect Node
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Edge Device Management</h2>
          <p className="mt-1 text-sm text-gray-500">Configure RTSP streams and visual counting zones for your establishment.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#044a36]"
        >
          <Plus size={16} /> Add Camera Node
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Cameras List */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="rounded-sm border-t-4 border-t-[#111827] bg-white p-4 shadow-md">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
              <Video size={16} className="text-[#065f46]" /> Configured Nodes
            </h3>
            <div className="space-y-3">
              {cameras.map((cam) => {
                const isActive = activeCamId === cam.id;
                return (
                  <div
                    key={cam.id}
                    onClick={() => {
                      setActiveCamId(cam.id);
                      setIsEditMode(false);
                    }}
                    className={`cursor-pointer rounded-sm border p-3 transition-all ${isActive ? "border-[#065f46] bg-green-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className={`truncate pr-2 text-sm font-bold ${isActive ? "text-[#065f46]" : "text-[#111827]"}`}>{cam.name}</span>
                      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cam.status === "online" ? "bg-[#45a549] shadow-[0_0_4px_#45a549]" : "bg-[#a40e0e]"}`}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-gray-500">
                      <span className="truncate">Zone: {cam.zone}</span>
                      <span className="truncate">Type: {cam.type}</span>
                      <span>Res: {cam.resolution}</span>
                      <span>FPS: {cam.fps}</span>
                    </div>
                  </div>
                );
              })}
              {cameras.length === 0 && <div className="rounded-sm border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No cameras registered.</div>}
            </div>
          </Card>
        </div>

        {/* Camera Setup / Preview */}
        <div className="lg:col-span-2">
          {activeCam ? (
            <Card className="flex h-full flex-col overflow-hidden rounded-sm shadow-md">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
                <h3 className="text-sm font-bold text-[#111827]">
                  Node Config: <span className="text-[#065f46]">{activeCam.name}</span>
                </h3>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <button onClick={() => setIsEditMode(false)} className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100">
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded-sm bg-[#065f46] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]"
                      >
                        <Save size={14} /> Save Config
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-[#065f46] hover:text-[#065f46]"
                        title="Edit Configuration"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="rounded-sm border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-red-600 hover:text-red-600"
                        title="Delete Node"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col bg-gray-50 p-5">
                {/* Visual Preview Area */}
                <div className={`relative mb-5 aspect-video w-full overflow-hidden rounded-sm bg-[#111827] ${isEditMode ? "ring-2 ring-[#065f46] ring-offset-2" : ""}`}>
                  {/* Simulate video stream background */}
                  {activeCam.status === "online" ? (
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg/1280px-6346Poblacion_City_Hall_San_Pedro_Laguna_27.jpg')] bg-cover bg-center opacity-40"></div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-sm font-bold tracking-wider text-red-500 uppercase">Stream Offline</div>
                  )}
                  <div className="absolute inset-0 bg-black/30"></div>

                  {activeCam.status === "online" && (
                    <>
                      {/* Dynamic Configuration Overlays */}
                      {(() => {
                        const config = isEditMode && editForm ? editForm.config : activeCam.config;
                        return (
                          <div className="pointer-events-none absolute inset-0">
                            {/* ROI Bounding Box */}
                            <div
                              className={`absolute border-2 border-dashed ${isEditMode ? "border-[#2d5eff] bg-[#2d5eff]/10" : "border-[#2d5eff]/60 bg-[#2d5eff]/5"}`}
                              style={{
                                top: `${config.roi.top}%`,
                                left: `${config.roi.left}%`,
                                width: `${config.roi.width}%`,
                                height: `${config.roi.height}%`,
                              }}
                            >
                              <span className="absolute right-1 bottom-1 rounded-sm bg-white/90 px-1 text-[9px] font-bold text-[#2d5eff] shadow-sm">ROI</span>
                            </div>

                            {/* Tripwire */}
                            <div className={`absolute h-0.5 w-full shadow-[0_0_8px_rgba(255,210,0,0.8)] ${isEditMode ? "bg-yellow-400" : "bg-yellow-400/80"}`} style={{ top: `${config.tripwire}%` }}>
                              <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-sm bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black shadow-md">
                                {config.reverse ? (
                                  <>
                                    EXIT <span className="text-sm font-black">↓</span> ENTRY <span className="text-sm font-black">↑</span>
                                  </>
                                ) : (
                                  <>
                                    ENTRY <span className="text-sm font-black">↓</span> EXIT <span className="text-sm font-black">↑</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Top Right Live Badges */}
                  {activeCam.status === "online" && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className="flex items-center gap-1 rounded-sm border border-green-500/50 bg-black/60 px-2 py-1 text-[10px] font-bold text-green-400 shadow-sm backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span> LIVE
                      </span>
                      <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.fps} FPS</span>
                      <span className="rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{activeCam.resolution}</span>
                    </div>
                  )}

                  {/* Watermark */}
                  <div className="pointer-events-none absolute bottom-3 left-3 font-['Bai_Jamjuree'] text-2xl font-bold text-white/30 select-none">TANAW Edge Preview</div>
                </div>

                {/* Validation Warnings */}
                {warnings.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {warnings.map((warn, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-sm border border-orange-200 bg-orange-50 p-3 shadow-inner">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-600" />
                        <p className="text-xs leading-relaxed font-medium text-orange-800">{warn}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Controls vs Read Only Details */}
                {isEditMode && editForm ? (
                  <div className="grid grid-cols-1 gap-6 rounded-sm border border-gray-200 bg-white p-4 shadow-inner md:grid-cols-2">
                    {/* Tripwire Settings */}
                    <div>
                      <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
                        <Move size={14} className="text-[#065f46]" /> Tripwire Config
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 flex justify-between text-xs font-semibold text-gray-600">
                            <span>Y-Axis Position</span> <span className="font-mono text-[#065f46]">{editForm.config.tripwire}%</span>
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={editForm.config.tripwire}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  tripwire: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full accent-[#065f46]"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 p-2">
                          <span className="text-xs font-semibold text-gray-700">Direction Logic Swap</span>
                          <button
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  reverse: !editForm.config.reverse,
                                },
                              })
                            }
                            className={`rounded-sm px-3 py-1 text-xs font-bold transition-colors ${editForm.config.reverse ? "bg-[#111827] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                          >
                            {editForm.config.reverse ? "Swapped (Out/In)" : "Default (In/Out)"}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* ROI Settings */}
                    <div>
                      <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
                        <Maximize size={14} className="text-[#2d5eff]" /> Region of Interest
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Top Offset</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={editForm.config.roi.top}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    top: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Left Offset</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={editForm.config.roi.left}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    left: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Width Coverage</label>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={editForm.config.roi.width}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    width: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Height Coverage</label>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={editForm.config.roi.height}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                config: {
                                  ...editForm.config,
                                  roi: {
                                    ...editForm.config.roi,
                                    height: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-[#2d5eff]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">RTSP Stream URL</label>
                      <input type="text" readOnly value={activeCam.rtsp} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 font-mono text-sm text-gray-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Assigned Zone</label>
                      <input type="text" readOnly value={activeCam.zone} className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Counting Logic</label>
                      <div className="w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-800">{activeCam.type}</div>
                    </div>
                    <div className="flex items-center">
                      <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${activeCam.status === "online" ? "text-[#065f46]" : "text-red-600"}`}>
                        {activeCam.status === "online" ? (
                          <>
                            <CheckCircle size={18} /> Stream Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={18} /> Stream Disconnected
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex h-full min-h-100 flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-transparent p-8 shadow-none">
              <Video size={48} className="mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-500">No Camera Selected</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-gray-400">Select a node from the list or add a new camera to configure its edge processing properties.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
