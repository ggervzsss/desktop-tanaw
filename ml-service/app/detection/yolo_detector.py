from dataclasses import dataclass
from pathlib import Path
from threading import Lock

import numpy as np

from app.counting.geometry import Centroid, bbox_bottom_center, bbox_centroid


@dataclass(frozen=True)
class TrackResult:
    track_id: int
    bbox: tuple[int, int, int, int]
    confidence: float
    centroid: Centroid
    counting_point: Centroid


class YoloPersonTracker:
    def __init__(self, model_path: str = "yolov8n.pt", image_size: int = 480, max_detections: int = 32) -> None:
        self.model_path = model_path
        self.image_size = image_size
        self.max_detections = max_detections
        self._model = None
        self._device = "cpu"
        self._use_half = False
        self._warmed_up = False
        self._resolved_model_path: str | None = None
        self._lock = Lock()
        self._warmup_lock = Lock()

    def status(self) -> dict[str, bool | str | None]:
        with self._lock:
            return {
                "model_loaded": self._model is not None,
                "model_ready": self._warmed_up,
                "device": self._device,
                "model_path": self._resolved_model_path,
            }

    def _resolve_model_path(self) -> str:
        requested_path = Path(self.model_path)
        if requested_path.is_absolute():
            if requested_path.exists():
                return str(requested_path)
            raise FileNotFoundError(f"YOLO model file was not found at {requested_path}.")

        service_root = Path(__file__).resolve().parents[2]
        bundled_path = service_root / "models" / requested_path.name
        if bundled_path.exists():
            return str(bundled_path)

        raise FileNotFoundError(
            f"YOLO model file was not found at {bundled_path}. "
            "Ensure the bundled model exists under ml-service/models."
        )

    def _load_model(self):
        with self._lock:
            if self._model is not None:
                return self._model

            from ultralytics import YOLO
            import torch

            model_source = self._resolve_model_path()
            self._model = YOLO(model_source)
            self._resolved_model_path = model_source
            self._device = "cuda:0" if torch.cuda.is_available() else "cpu"
            self._use_half = self._device.startswith("cuda")
            try:
                self._model.fuse()
            except Exception:
                pass
            return self._model

    def warmup(self) -> None:
        with self._warmup_lock:
            with self._lock:
                if self._warmed_up:
                    return

            model = self._load_model()

            blank_frame = np.zeros((self.image_size, self.image_size, 3), dtype=np.uint8)
            model.predict(
                blank_frame,
                classes=[0],
                conf=0.25,
                device=self._device,
                half=self._use_half,
                imgsz=self.image_size,
                max_det=self.max_detections,
                verbose=False,
            )
            with self._lock:
                self._warmed_up = True

    def track_people(self, frame, confidence: float) -> list[TrackResult]:
        model = self._load_model()
        results = model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            classes=[0],
            conf=confidence,
            device=self._device,
            half=self._use_half,
            imgsz=self.image_size,
            iou=0.45,
            max_det=self.max_detections,
            verbose=False,
        )

        if not results:
            return []

        boxes = results[0].boxes
        if boxes is None:
            return []

        xyxy = boxes.xyxy.cpu().tolist()
        confidences = boxes.conf.cpu().tolist()
        track_ids = boxes.id.int().cpu().tolist() if boxes.id is not None else [-(index + 1) for index in range(len(xyxy))]

        tracked: list[TrackResult] = []
        for bbox, track_id, score in zip(xyxy, track_ids, confidences, strict=False):
            x1, y1, x2, y2 = bbox
            centroid = bbox_centroid(x1, y1, x2, y2)
            counting_point = bbox_bottom_center(x1, y1, x2, y2)
            tracked.append(
                TrackResult(
                    track_id=int(track_id),
                    bbox=(int(x1), int(y1), int(x2), int(y2)),
                    confidence=float(score),
                    centroid=centroid,
                    counting_point=counting_point,
                )
            )

        return tracked
