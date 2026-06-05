from dataclasses import dataclass
from pathlib import Path
from threading import Lock

from app.counting.geometry import Centroid, bbox_centroid


@dataclass(frozen=True)
class TrackResult:
    track_id: int
    bbox: tuple[int, int, int, int]
    confidence: float
    centroid: Centroid


class YoloPersonTracker:
    def __init__(self, model_path: str = "yolov8n.pt") -> None:
        self.model_path = model_path
        self._model = None
        self._lock = Lock()

    def _load_model(self):
        with self._lock:
            if self._model is not None:
                return self._model

            from ultralytics import YOLO

            model_source = self.model_path
            local_model = Path(__file__).resolve().parents[2] / "models" / self.model_path
            if local_model.exists():
                model_source = str(local_model)

            self._model = YOLO(model_source)
            return self._model

    def track_people(self, frame, confidence: float) -> list[TrackResult]:
        model = self._load_model()
        results = model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            classes=[0],
            conf=confidence,
            verbose=False,
        )

        if not results:
            return []

        boxes = results[0].boxes
        if boxes is None or boxes.id is None:
            return []

        xyxy = boxes.xyxy.cpu().tolist()
        track_ids = boxes.id.int().cpu().tolist()
        confidences = boxes.conf.cpu().tolist()

        tracked: list[TrackResult] = []
        for bbox, track_id, score in zip(xyxy, track_ids, confidences, strict=False):
            x1, y1, x2, y2 = bbox
            centroid = bbox_centroid(x1, y1, x2, y2)
            tracked.append(
                TrackResult(
                    track_id=int(track_id),
                    bbox=(int(x1), int(y1), int(x2), int(y2)),
                    confidence=float(score),
                    centroid=centroid,
                )
            )

        return tracked

