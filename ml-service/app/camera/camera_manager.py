import threading
import time
from dataclasses import dataclass

import cv2
import numpy as np

from app.camera.stream_reader import open_capture, validate_stream
from app.config.camera_config import CameraStartRequest
from app.counting.tripwire_counter import TripwireCounter
from app.detection.yolo_detector import YoloPersonTracker


@dataclass
class RuntimeState:
    running: bool = False
    status: str = "stopped"
    error: str | None = None


class CameraProcessingManager:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._processing_thread: threading.Thread | None = None
        self._reader_thread: threading.Thread | None = None
        self._raw_frame_condition = threading.Condition(self._lock)
        self._latest_raw_frame = None
        self._latest_raw_frame_id = 0
        self._latest_jpeg: bytes | None = None
        self._state = RuntimeState()
        self._config: CameraStartRequest | None = None
        self._counter = TripwireCounter()
        self._tracker = YoloPersonTracker()

    @property
    def running(self) -> bool:
        with self._lock:
            return self._state.running

    def test_connection(self, stream_url: str) -> tuple[bool, str]:
        return validate_stream(stream_url)

    def start(self, config: CameraStartRequest) -> None:
        ok, message = validate_stream(config.stream_url)
        if not ok:
            raise ValueError(message)

        self.stop()

        with self._lock:
            self._config = config
            self._counter = TripwireCounter(
                tripwire_position=config.tripwire_position,
                reverse_direction=config.reverse_direction,
            )
            self._counter.reset()
            self._latest_jpeg = self._build_status_frame("Starting camera processing...")
            self._state = RuntimeState(running=True, status="running", error=None)
            self._stop_event.clear()
            self._latest_raw_frame = None
            self._latest_raw_frame_id = 0
            self._reader_thread = threading.Thread(target=self._capture_loop, name="tanaw-camera-reader", daemon=True)
            self._processing_thread = threading.Thread(target=self._processing_loop, name="tanaw-camera-processing", daemon=True)
            self._reader_thread.start()
            self._processing_thread.start()

    def stop(self) -> None:
        threads: list[threading.Thread]
        with self._lock:
            threads = [thread for thread in (self._reader_thread, self._processing_thread) if thread is not None]
            self._stop_event.set()
            self._raw_frame_condition.notify_all()

        for thread in threads:
            if thread.is_alive():
                thread.join(timeout=5)

        with self._lock:
            self._reader_thread = None
            self._processing_thread = None
            self._latest_raw_frame = None
            self._state.running = False
            if self._state.status != "error":
                self._state.status = "stopped"

    def counts(self) -> dict[str, int | str | bool | None]:
        with self._lock:
            snapshot = self._counter.counts.as_dict()
            return {
                **snapshot,
                "running": self._state.running,
                "status": self._state.status,
                "error": self._state.error,
            }

    def latest_frame(self) -> bytes:
        with self._lock:
            if self._latest_jpeg is not None:
                return self._latest_jpeg

            return self._build_status_frame("No camera stream available.")

    def _capture_loop(self) -> None:
        config = self._config
        if config is None:
            self._set_error("Camera configuration is missing.")
            return

        capture = open_capture(config.stream_url)
        failed_reads = 0

        try:
            if not capture.isOpened():
                self._set_error("Camera stream could not be opened.")
                return

            while not self._stop_event.is_set():
                ok, frame = capture.read()
                if not ok or frame is None:
                    failed_reads += 1
                    if failed_reads >= 90:
                        self._set_error("Camera stream stopped returning frames.")
                        return
                    time.sleep(0.05)
                    continue

                failed_reads = 0
                frame = self._resize_for_processing(frame, config.max_frame_width)

                with self._raw_frame_condition:
                    self._latest_raw_frame = frame
                    self._latest_raw_frame_id += 1
                    self._state.status = "running"
                    self._state.error = None
                    self._raw_frame_condition.notify_all()
        except Exception as exc:
            self._set_error(str(exc))
        finally:
            capture.release()
            with self._lock:
                if self._state.status != "error":
                    self._state.status = "stopped"

    def _processing_loop(self) -> None:
        config = self._config
        if config is None:
            self._set_error("Camera configuration is missing.")
            return

        last_processed_frame_id = 0
        frame_interval = 1.0 / max(config.processing_fps, 1.0)

        try:
            while not self._stop_event.is_set():
                frame, frame_id = self._wait_for_latest_frame(last_processed_frame_id)
                if frame is None:
                    continue

                started_at = time.monotonic()
                processed = self._process_frame(frame, config.confidence)
                encoded = self._encode_frame(processed)
                last_processed_frame_id = frame_id

                with self._lock:
                    self._latest_jpeg = encoded
                    self._state.status = "running"
                    self._state.error = None

                elapsed = time.monotonic() - started_at
                remaining = frame_interval - elapsed
                if remaining > 0:
                    time.sleep(remaining)
        except Exception as exc:
            self._set_error(str(exc))
        finally:
            with self._lock:
                self._state.running = False
                if self._state.status != "error":
                    self._state.status = "stopped"

    def _wait_for_latest_frame(self, last_processed_frame_id: int):
        with self._raw_frame_condition:
            self._raw_frame_condition.wait_for(
                lambda: self._stop_event.is_set() or self._latest_raw_frame_id > last_processed_frame_id,
                timeout=1.0,
            )

            if self._stop_event.is_set() or self._latest_raw_frame is None:
                return None, last_processed_frame_id

            return self._latest_raw_frame.copy(), self._latest_raw_frame_id

    def _process_frame(self, frame, confidence: float):
        height, width = frame.shape[:2]
        line_x = self._counter.line_x(width)
        tracks = self._tracker.track_people(frame, confidence)

        cv2.line(frame, (line_x, 0), (line_x, height), (59, 130, 246), 2)
        if self._counter.reverse_direction:
            cv2.putText(frame, "ENTRY", (max(8, line_x - 92), 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (74, 222, 128), 2, cv2.LINE_AA)
            cv2.putText(frame, "EXIT", (line_x + 12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 113, 113), 2, cv2.LINE_AA)
        else:
            cv2.putText(frame, "EXIT", (max(8, line_x - 74), 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 113, 113), 2, cv2.LINE_AA)
            cv2.putText(frame, "ENTRY", (line_x + 12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (74, 222, 128), 2, cv2.LINE_AA)

        for track in tracks:
            x1, y1, x2, y2 = track.bbox
            direction = self._counter.update(track.track_id, track.centroid, width)
            color = (74, 222, 128) if direction == "entry" else (248, 113, 113) if direction == "exit" else (34, 197, 94)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.circle(frame, (int(track.centroid.x), int(track.centroid.y)), 4, (250, 204, 21), -1)
            label = f"ID {track.track_id} {track.confidence:.2f}"
            cv2.rectangle(frame, (x1, max(0, y1 - 26)), (x1 + 126, y1), color, -1)
            cv2.putText(frame, label, (x1 + 6, max(18, y1 - 7)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (15, 23, 42), 1, cv2.LINE_AA)

        counts = self._counter.counts
        status = f"Entry {counts.entry}  Exit {counts.exit}  Occupancy {counts.occupancy}"
        cv2.rectangle(frame, (12, height - 44), (380, height - 12), (15, 23, 42), -1)
        cv2.putText(frame, status, (24, height - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

        return frame

    def _resize_for_processing(self, frame, max_width: int):
        height, width = frame.shape[:2]
        if width <= max_width:
            return frame

        scale = max_width / width
        return cv2.resize(frame, (max_width, int(height * scale)), interpolation=cv2.INTER_AREA)

    def _encode_frame(self, frame) -> bytes:
        ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
        if not ok:
            raise RuntimeError("Failed to encode processed frame.")
        return buffer.tobytes()

    def _set_error(self, message: str) -> None:
        with self._raw_frame_condition:
            self._state = RuntimeState(running=False, status="error", error=message)
            self._latest_jpeg = self._build_status_frame(message)
            self._stop_event.set()
            self._raw_frame_condition.notify_all()

    def _build_status_frame(self, message: str) -> bytes:
        frame = np.zeros((540, 960, 3), dtype=np.uint8)
        frame[:] = (17, 24, 39)
        cv2.line(frame, (480, 0), (480, 540), (59, 130, 246), 2)
        cv2.putText(frame, "TANAW ML Camera Service", (270, 236), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, message[:72], (90, 288), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (203, 213, 225), 2, cv2.LINE_AA)
        return self._encode_frame(frame)
