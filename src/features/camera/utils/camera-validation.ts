import type { CameraConfig } from "../types/camera";

export function getValidationWarnings(config?: CameraConfig) {
  const warnings: string[] = [];
  if (!config) return warnings;

  if (config.tripwires) {
    if (lineLength(config.tripwires.entry) < 10 || lineLength(config.tripwires.exit) < 10) {
      warnings.push("Warning: Tripwire line is short. Longer lines are more reliable for crossing detection.");
    }
  } else if (config.tripwire < 20 || config.tripwire > 80) {
    warnings.push("Warning: Tripwire placed too close to the frame edge. Head occlusion may occur, reducing accuracy.");
  }

  if (config.roi.width < 40 || config.roi.height < 40) {
    warnings.push("Warning: Region of Interest (ROI) is small. Ensure it fully covers the primary entry/exit pathway.");
  }

  return warnings;
}

function lineLength(line: CameraConfig["tripwires"]["entry"]) {
  const deltaX = line.end.x - line.start.x;
  const deltaY = line.end.y - line.start.y;
  return Math.hypot(deltaX, deltaY);
}
