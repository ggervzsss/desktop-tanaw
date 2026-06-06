import threading
import time
from dataclasses import dataclass
from datetime import datetime
import os

os.environ.setdefault("OPENCV_FFMPEG_LOGLEVEL", "16")
os.environ.setdefault("OPENCV_LOG_LEVEL", "ERROR")

import cv2
import numpy as np

from app.camera.stream_reader import (
    build_ip_webcam_snapshot_url,
    is_mjpeg_http_stream,
    iter_mjpeg_frames,
    open_capture,
    read_http_jpeg_frame,
    validate_http_jpeg_snapshot,
    validate_stream,
)
from app.camera.auth import build_authenticated_stream_url, redact_stream_credentials
from app.config.camera_config import CameraStartRequest
from app.counting.tripwire_counter import TripwireCounter
from app.detection.yolo_detector import YoloPersonTracker
from app.storage.session_store import SessionStore


@dataclass
class RuntimeState:
    running: bool = False
    status: str = "stopped"
    error: str | None = None


@dataclass(frozen=True)
class DisplayTrack:
    track_id: int
    bbox: tuple[int, int, int, int]
    confidence: float
    centroid: tuple[int, int]
    direction: str | None = None


class CameraProcessingManager:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._processing_thread: threading.Thread | None = None
        self._reader_thread: threading.Thread | None = None
        self._stream_thread: threading.Thread | None = None
        self._raw_frame_condition = threading.Condition(self._lock)
        self._latest_raw_frame = None
        self._latest_raw_frame_id = 0
        self._latest_jpeg: bytes | None = None
        self._latest_stream_jpeg: bytes | None = None
        self._latest_stream_frame_id = 0
        self._latest_tracks: list[DisplayTrack] = []
        self._state = RuntimeState()
        self._config: CameraStartRequest | None = None
        self._counter = TripwireCounter()
        self._tracker = YoloPersonTracker()
        self._session_store = SessionStore()
        self._session_updated_at: str | None = None
        self._restoring_session = False

    @property
    def running(self) -> bool:
        with self._lock:
            return self._state.running

    def test_connection(self, stream_url: str, camera_type: str = "IP_WEBCAM", username: str | None = None, password: str | None = None) -> tuple[bool, str]:
        try:
            config = CameraStartRequest(stream_url=stream_url, camera_type=camera_type, username=username, password=password)
        except Exception as exc:
            return False, redact_stream_credentials(str(exc))

        return self._validate_config_stream(config)

    def start(self, config: CameraStartRequest) -> None:
        ok, message = self._validate_config_stream(config)
        if not ok:
            raise ValueError(message)

        self.stop()

        with self._lock:
            self._config = config
            self._counter = TripwireCounter(
                tripwire_position=config.tripwire_position,
                entry_line=self._normalized_line(config.entry_line),
                exit_line=self._normalized_line(config.exit_line),
                reverse_direction=config.reverse_direction,
            )
            self._counter.reset()
            self._latest_jpeg = self._build_status_frame("Starting camera processing...")
            self._latest_stream_jpeg = self._latest_jpeg
            self._latest_stream_frame_id = 0
            self._state = RuntimeState(running=True, status="running", error=None)
            self._stop_event.clear()
            self._latest_raw_frame = None
            self._latest_raw_frame_id = 0
            self._latest_tracks = []
            self._reader_thread = threading.Thread(target=self._capture_loop, name="tanaw-camera-reader", daemon=True)
            self._processing_thread = threading.Thread(target=self._processing_loop, name="tanaw-camera-processing", daemon=True)
            self._stream_thread = threading.Thread(target=self._stream_encoding_loop, name="tanaw-camera-stream-encoder", daemon=True)
            self._reader_thread.start()
            self._processing_thread.start()
            self._stream_thread.start()
            self._persist_session_locked()

    def stop(self) -> None:
        threads: list[threading.Thread]
        with self._lock:
            threads = [thread for thread in (self._reader_thread, self._processing_thread, self._stream_thread) if thread is not None]
            self._stop_event.set()
            self._raw_frame_condition.notify_all()

        for thread in threads:
            if thread.is_alive():
                thread.join(timeout=5)

        with self._lock:
            self._reader_thread = None
            self._processing_thread = None
            self._stream_thread = None
            self._latest_raw_frame = None
            self._latest_tracks = []
            self._state.running = False
            if self._state.status != "error":
                self._state.status = "stopped"
            self._persist_session_locked()

    def counts(self) -> dict[str, int | str | bool | None]:
        with self._lock:
            snapshot = self._counter.counts.as_dict()
            return {
                **snapshot,
                "running": self._state.running,
                "status": self._state.status,
                "error": redact_stream_credentials(self._state.error) if self._state.error else None,
            }

    def detections(self) -> dict[str, int | str | bool | None | list[dict[str, int | float | str | tuple[int, int] | tuple[int, int, int, int] | None]]]:
        with self._lock:
            frame_height = None
            frame_width = None
            if self._latest_raw_frame is not None:
                frame_height, frame_width = self._latest_raw_frame.shape[:2]

            return {
                "running": self._state.running,
                "status": self._state.status,
                "error": redact_stream_credentials(self._state.error) if self._state.error else None,
                "frame_width": frame_width,
                "frame_height": frame_height,
                "tracks": [
                    {
                        "track_id": track.track_id,
                        "bbox": track.bbox,
                        "confidence": track.confidence,
                        "centroid": track.centroid,
                        "direction": track.direction,
                    }
                    for track in self._latest_tracks
                ],
            }

    def session(self) -> dict:
        with self._lock:
            counts = self.counts()
            return {
                "running": self._state.running,
                "status": self._state.status,
                "error": redact_stream_credentials(self._state.error) if self._state.error else None,
                "camera_id": self._config.camera_id if self._config else None,
                "camera_name": self._config.camera_name if self._config else None,
                "camera_config": self._public_config_dump() if self._config else None,
                "counts": counts,
                "updated_at": self._session_updated_at,
            }

    def metrics_summary(self, include_submitted: bool = False) -> dict:
        return self._session_store.metrics_summary(include_submitted=include_submitted)

    def record_report_submission(self, report_id: str, period: str, notes: str | None = None, payload: dict | None = None) -> dict:
        return self._session_store.record_report_submission(report_id=report_id, period=period, notes=notes, payload=payload)

    def restore_last_session(self) -> bool:
        if self.running or self._restoring_session:
            return False

        payload = self._session_store.load_session()
        if not payload or not payload.get("running"):
            self._restore_saved_snapshot(payload)
            return False

        camera_config = payload.get("camera_config")
        if not isinstance(camera_config, dict):
            self._restore_saved_snapshot(payload)
            return False

        try:
            config = CameraStartRequest(**camera_config)
        except Exception:
            self._restore_saved_snapshot(payload)
            return False

        self._restore_saved_snapshot(payload)
        self._restoring_session = True
        try:
            try:
                self.start(config)
                self._restore_saved_snapshot(payload)
                return True
            except Exception as exc:
                with self._raw_frame_condition:
                    self._state = RuntimeState(running=False, status="error", error=redact_stream_credentials(f"Unable to restore monitoring session: {exc}"))
                    self._config = config
                    self._persist_session_locked()
                    self._raw_frame_condition.notify_all()
                return False
        finally:
            self._restoring_session = False

    def latest_frame(self) -> bytes:
        with self._lock:
            if self._latest_stream_jpeg is not None:
                return self._latest_stream_jpeg
            if self._latest_jpeg is not None:
                return self._latest_jpeg
            else:
                return self._build_status_frame("No camera stream available.")

    def wait_for_stream_frame(self, last_frame_id: int, timeout: float = 1.0) -> tuple[bytes, int]:
        with self._raw_frame_condition:
            self._raw_frame_condition.wait_for(
                lambda: self._latest_stream_frame_id > last_frame_id,
                timeout=timeout,
            )

            if self._latest_stream_jpeg is not None:
                return self._latest_stream_jpeg, self._latest_stream_frame_id

            if self._latest_jpeg is not None:
                return self._latest_jpeg, last_frame_id

        return self._build_status_frame("No camera stream available."), last_frame_id

    def _capture_loop(self) -> None:
        config = self._config
        if config is None:
            self._set_error("Camera configuration is missing.")
            return

        runtime_stream_url = self._runtime_stream_url(config)
        snapshot_url = build_ip_webcam_snapshot_url(runtime_stream_url) if config.camera_type == "IP_WEBCAM" else None
        if snapshot_url is not None:
            self._ip_webcam_snapshot_capture_loop(config, snapshot_url)
            return

        if is_mjpeg_http_stream(runtime_stream_url):
            self._mjpeg_capture_loop(config, runtime_stream_url)
        else:
            self._opencv_capture_loop(config, runtime_stream_url)

    def _validate_config_stream(self, config: CameraStartRequest) -> tuple[bool, str]:
        runtime_stream_url = self._runtime_stream_url(config)
        snapshot_url = build_ip_webcam_snapshot_url(runtime_stream_url) if config.camera_type == "IP_WEBCAM" else None
        if snapshot_url is not None:
            ok, message = validate_http_jpeg_snapshot(snapshot_url)
            return ok, redact_stream_credentials(message)

        ok, message = validate_stream(runtime_stream_url)
        return ok, redact_stream_credentials(message)

    def _runtime_stream_url(self, config: CameraStartRequest) -> str:
        return build_authenticated_stream_url(config.stream_url, config.username, config.password)

    def _ip_webcam_snapshot_capture_loop(self, config: CameraStartRequest, snapshot_url: str) -> None:
        failed_reads = 0
        last_error = "Camera snapshot endpoint stopped returning frames."
        frame_interval = 1.0 / max(config.processing_fps, 1.0)

        try:
            while not self._stop_event.is_set():
                started_at = time.monotonic()

                try:
                    frame = read_http_jpeg_frame(snapshot_url)
                except Exception as exc:
                    frame = None
                    last_error = str(exc)

                if frame is None:
                    failed_reads += 1
                    if failed_reads >= 30:
                        self._set_error(redact_stream_credentials(f"Camera snapshot endpoint stopped returning frames: {last_error}"))
                        return
                else:
                    failed_reads = 0
                    frame = self._resize_for_processing(frame, config.max_frame_width)
                    self._publish_raw_frame(frame)

                elapsed = time.monotonic() - started_at
                remaining = frame_interval - elapsed
                if remaining > 0:
                    time.sleep(remaining)
        except Exception as exc:
            self._set_error(redact_stream_credentials(str(exc)))
        finally:
            with self._lock:
                if not self._stop_event.is_set() and self._state.status != "error":
                    self._state.status = "stopped"

    def _mjpeg_capture_loop(self, config: CameraStartRequest, stream_url: str) -> None:
        try:
            for frame in iter_mjpeg_frames(stream_url, self._stop_event):
                if self._stop_event.is_set():
                    break

                frame = self._resize_for_processing(frame, config.max_frame_width)
                self._publish_raw_frame(frame)

            if not self._stop_event.is_set():
                self._set_error("Camera stream stopped returning MJPEG frames.")
        except Exception as exc:
            self._set_error(redact_stream_credentials(str(exc)))
        finally:
            with self._lock:
                if self._state.status != "error":
                    self._state.status = "stopped"

    def _opencv_capture_loop(self, config: CameraStartRequest, stream_url: str) -> None:
        capture = open_capture(stream_url)
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
                self._publish_raw_frame(frame)
        except Exception as exc:
            self._set_error(redact_stream_credentials(str(exc)))
        finally:
            capture.release()
            with self._lock:
                if self._state.status != "error":
                    self._state.status = "stopped"

    def _publish_raw_frame(self, frame) -> None:
        with self._raw_frame_condition:
            self._latest_raw_frame = frame
            self._latest_raw_frame_id += 1
            self._state.status = "running"
            self._state.error = None
            self._raw_frame_condition.notify_all()

    def _processing_loop(self) -> None:
        config = self._config
        if config is None:
            self._set_error("Camera configuration is missing.")
            return

        last_processed_frame_id = 0
        frame_interval = 1.0 / max(config.processing_fps, 1.0)

        try:
            self._tracker.warmup()
            while not self._stop_event.is_set():
                frame, frame_id = self._wait_for_latest_frame(last_processed_frame_id)
                if frame is None:
                    continue

                started_at = time.monotonic()
                tracks = self._detect_and_count(frame, config.confidence)
                last_processed_frame_id = frame_id

                with self._lock:
                    self._latest_tracks = tracks
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

    def _stream_encoding_loop(self) -> None:
        config = self._config
        if config is None:
            self._set_error("Camera configuration is missing.")
            return

        last_encoded_raw_frame_id = 0
        frame_interval = 1.0 / max(config.stream_fps, 1.0)

        try:
            while not self._stop_event.is_set():
                frame_snapshot = self._next_display_frame_snapshot(last_encoded_raw_frame_id, timeout=1.0)
                if frame_snapshot is None:
                    continue

                (
                    frame,
                    raw_frame_id,
                    tracks,
                    tripwire_position,
                    entry_line,
                    exit_line,
                    reverse_direction,
                    entry_count,
                    exit_count,
                    occupancy_count,
                ) = frame_snapshot

                started_at = time.monotonic()
                display_frame = self._render_display_frame(frame, tracks, tripwire_position, entry_line, exit_line, reverse_direction, entry_count, exit_count, occupancy_count)
                encoded = self._encode_frame(display_frame)

                with self._raw_frame_condition:
                    self._latest_stream_jpeg = encoded
                    self._latest_stream_frame_id += 1
                    last_encoded_raw_frame_id = raw_frame_id
                    self._raw_frame_condition.notify_all()

                elapsed = time.monotonic() - started_at
                remaining = frame_interval - elapsed
                if remaining > 0:
                    time.sleep(remaining)
        except Exception as exc:
            self._set_error(str(exc))

    def _next_display_frame_snapshot(self, last_encoded_raw_frame_id: int, timeout: float):
        with self._raw_frame_condition:
            self._raw_frame_condition.wait_for(
                lambda: self._stop_event.is_set() or self._latest_raw_frame_id > last_encoded_raw_frame_id,
                timeout=timeout,
            )

            if self._stop_event.is_set() or self._latest_raw_frame is None or self._latest_raw_frame_id <= last_encoded_raw_frame_id:
                return None

            counts = self._counter.counts
            return (
                self._latest_raw_frame.copy(),
                self._latest_raw_frame_id,
                list(self._latest_tracks),
                self._counter.tripwire_position,
                self._counter.entry_line,
                self._counter.exit_line,
                self._counter.reverse_direction,
                counts.entry,
                counts.exit,
                counts.occupancy,
            )

    def _wait_for_latest_frame(self, last_processed_frame_id: int):
        with self._raw_frame_condition:
            self._raw_frame_condition.wait_for(
                lambda: self._stop_event.is_set() or self._latest_raw_frame_id > last_processed_frame_id,
                timeout=1.0,
            )

            if self._stop_event.is_set() or self._latest_raw_frame is None:
                return None, last_processed_frame_id

            return self._latest_raw_frame.copy(), self._latest_raw_frame_id

    def _detect_and_count(self, frame, confidence: float) -> list[DisplayTrack]:
        frame_height, frame_width = frame.shape[:2]
        tracks = self._tracker.track_people(frame, confidence)
        display_tracks: list[DisplayTrack] = []
        self._counter.begin_frame()

        for track in tracks:
            direction = self._counter.update(track.track_id, track.counting_point, frame_width, frame_height) if track.track_id > 0 else None
            if direction is not None:
                self._persist_count_event(track.track_id, direction)
            display_tracks.append(
                DisplayTrack(
                    track_id=track.track_id,
                    bbox=track.bbox,
                    confidence=track.confidence,
                    centroid=(int(track.centroid.x), int(track.centroid.y)),
                    direction=direction,
                )
            )

        return display_tracks

    def _render_display_frame(
        self,
        frame,
        tracks: list[DisplayTrack],
        tripwire_position: float,
        entry_line,
        exit_line,
        reverse_direction: bool,
        entry_count: int,
        exit_count: int,
        occupancy_count: int,
    ):
        height, width = frame.shape[:2]
        if entry_line is not None or exit_line is not None:
            self._draw_tripwire_line(frame, entry_line, width, height, "ENTRY", (74, 222, 128))
            self._draw_tripwire_line(frame, exit_line, width, height, "EXIT", (248, 113, 113))
        else:
            line_x = int(width * tripwire_position)

            cv2.line(frame, (line_x, 0), (line_x, height), (59, 130, 246), 2)
            if reverse_direction:
                cv2.putText(frame, "ENTRY", (max(8, line_x - 92), 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (74, 222, 128), 2, cv2.LINE_AA)
                cv2.putText(frame, "EXIT", (line_x + 12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 113, 113), 2, cv2.LINE_AA)
            else:
                cv2.putText(frame, "EXIT", (max(8, line_x - 74), 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 113, 113), 2, cv2.LINE_AA)
                cv2.putText(frame, "ENTRY", (line_x + 12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (74, 222, 128), 2, cv2.LINE_AA)

        for track in tracks:
            x1, y1, x2, y2 = track.bbox
            color = (74, 222, 128) if track.direction == "entry" else (248, 113, 113) if track.direction == "exit" else (34, 197, 94)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.circle(frame, track.centroid, 4, (250, 204, 21), -1)
            label = f"ID {track.track_id} {track.confidence:.2f}"
            cv2.rectangle(frame, (x1, max(0, y1 - 26)), (x1 + 126, y1), color, -1)
            cv2.putText(frame, label, (x1 + 6, max(18, y1 - 7)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (15, 23, 42), 1, cv2.LINE_AA)

        status = f"Entry {entry_count}  Exit {exit_count}  Occupancy {occupancy_count}"
        cv2.rectangle(frame, (12, height - 44), (380, height - 12), (15, 23, 42), -1)
        cv2.putText(frame, status, (24, height - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

        return frame

    def _draw_tripwire_line(self, frame, line, frame_width: int, frame_height: int, label: str, color: tuple[int, int, int]) -> None:
        if line is None:
            return

        (x1, y1), (x2, y2) = line
        start = (int(x1 * frame_width), int(y1 * frame_height))
        end = (int(x2 * frame_width), int(y2 * frame_height))
        cv2.line(frame, start, end, color, 3)
        cv2.circle(frame, start, 5, color, -1)
        cv2.circle(frame, end, 5, color, -1)
        cv2.putText(frame, label, (start[0] + 8, max(20, start[1] - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.62, color, 2, cv2.LINE_AA)

    def _normalized_line(self, line):
        if line is None:
            return None

        return ((line.start.x, line.start.y), (line.end.x, line.end.y))

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
            safe_message = redact_stream_credentials(message)
            self._state = RuntimeState(running=False, status="error", error=safe_message)
            self._latest_jpeg = self._build_status_frame(safe_message)
            self._latest_stream_jpeg = self._latest_jpeg
            self._latest_stream_frame_id += 1
            self._persist_session_locked()
            self._stop_event.set()
            self._raw_frame_condition.notify_all()

    def _build_status_frame(self, message: str) -> bytes:
        frame = np.zeros((540, 960, 3), dtype=np.uint8)
        frame[:] = (17, 24, 39)
        cv2.line(frame, (480, 0), (480, 540), (59, 130, 246), 2)
        cv2.putText(frame, "TANAW ML Camera Service", (270, 236), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, message[:72], (90, 288), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (203, 213, 225), 2, cv2.LINE_AA)
        return self._encode_frame(frame)

    def _persist_count_event(self, track_id: int, direction: str) -> None:
        with self._lock:
            counts = self._counter.counts.as_dict()
            try:
                self._session_store.append_event(
                    {
                        "camera_id": self._config.camera_id if self._config else None,
                        "camera_name": self._config.camera_name if self._config else None,
                        "direction": direction,
                        "track_id": track_id,
                        "counts": counts,
                    }
                )
            except OSError:
                pass
            self._persist_session_locked()

    def _persist_session_locked(self) -> None:
        counts = self._counter.counts.as_dict()
        payload = {
            "running": self._state.running,
            "status": self._state.status,
            "error": redact_stream_credentials(self._state.error) if self._state.error else None,
            "camera_id": self._config.camera_id if self._config else None,
            "camera_name": self._config.camera_name if self._config else None,
            "camera_config": self._config.model_dump(mode="json") if self._config else None,
            "counts": {
                **counts,
                "running": self._state.running,
                "status": self._state.status,
                "error": redact_stream_credentials(self._state.error) if self._state.error else None,
            },
        }
        try:
            self._session_store.save_session(payload)
            saved_payload = self._session_store.load_session()
            self._session_updated_at = saved_payload.get("updated_at") if saved_payload else None
        except OSError:
            return

    def _public_config_dump(self) -> dict:
        if self._config is None:
            return {}

        payload = self._config.model_dump(mode="json")
        if payload.get("password"):
            payload["password"] = None
        payload["stream_url"] = redact_stream_credentials(str(payload.get("stream_url", "")))
        return payload

    def _restore_saved_snapshot(self, payload: dict | None) -> None:
        if not payload:
            return

        counts_payload = payload.get("counts")
        if not isinstance(counts_payload, dict):
            return

        with self._lock:
            self._session_updated_at = payload.get("updated_at") if isinstance(payload.get("updated_at"), str) else None
            self._counter.counts.entry = _safe_int(counts_payload.get("entry"))
            self._counter.counts.exit = _safe_int(counts_payload.get("exit"))
            self._counter.counts.occupancy = _safe_int(counts_payload.get("occupancy"))
            started_at = counts_payload.get("started_at")
            if isinstance(started_at, str):
                try:
                    self._counter.counts.started_at = datetime.fromisoformat(started_at)
                except ValueError:
                    self._counter.counts.started_at = None
            if isinstance(payload.get("status"), str):
                self._state.status = payload["status"]
            if isinstance(payload.get("error"), str) or payload.get("error") is None:
                self._state.error = payload.get("error")


def _safe_int(value) -> int:
    return value if isinstance(value, int) else 0
