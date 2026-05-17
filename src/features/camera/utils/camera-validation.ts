import type { CameraConfig } from "../types/camera";

export function getValidationWarnings(config?: CameraConfig) {
  const warnings: string[] = [];
  if (!config) return warnings;

  if (config.tripwire < 20 || config.tripwire > 80) {
    warnings.push("Warning: Tripwire placed too close to the frame edge. Head occlusion may occur, reducing accuracy.");
  }

  if (config.roi.width < 40 || config.roi.height < 40) {
    warnings.push("Warning: Region of Interest (ROI) is small. Ensure it fully covers the primary entry/exit pathway.");
  }

  return warnings;
}
