import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
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
from app.counting.geometry import Centroid
from app.detection.yolo_detector import YoloPersonTracker
from app.identity import UniqueVisitorRegistry, VisitorDecision
from app.reid import PersonReIdentifier, TrackAppearanceBuffer
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
    visitor_id: str | None = None
    is_unique_entry: bool | None = None
    reid_score: float | None = None
    reid_decision: str | None = None
    identity_confidence: str | None = None
    inside_roi: bool | None = None
    counting_eligible: bool | None = None


@dataclass(frozen=True)
class ProcessingSession:
    session_id: int
    config: CameraStartRequest
    stop_event: threading.Event


class CameraProcessingManager:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._active_session: ProcessingSession | None = None
        self._next_session_id = 0
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
        self._reidentifier = PersonReIdentifier()
        self._appearance_buffer = TrackAppearanceBuffer()
        self._session_store = SessionStore()
        self._visitor_registry = UniqueVisitorRegistry(self._session_store, model_name=self._reidentifier.model_name)
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
                event_cooldown_frames=_seconds_to_frames(config.event_cooldown_seconds, config.processing_fps),
                paired_line_max_gap_frames=_seconds_to_frames(config.paired_line_max_gap_seconds, config.processing_fps),
                track_ttl_frames=_seconds_to_frames(config.track_ttl_seconds, config.processing_fps),
            )
            self._counter.reset()
            self._appearance_buffer = TrackAppearanceBuffer()
            self._visitor_registry.prepare(config.camera_id)
            self._visitor_registry.reset_session_tracks()
            self._latest_jpeg = self._build_status_frame("Initializing ML model...")
            self._latest_stream_jpeg = self._latest_jpeg
            self._latest_stream_frame_id += 1
            self._state = RuntimeState(running=False, status="starting", error=None)
            self._persist_session_locked()

        try:
            self._tracker.warmup()
            self._reidentifier.warmup()
        except Exception as exc:
            safe_message = redact_stream_credentials(f"Unable to initialize ML model: {exc}")
            with self._raw_frame_condition:
                self._state = RuntimeState(running=False, status="error", error=safe_message)
                self._latest_jpeg = self._build_status_frame(safe_message)
                self._latest_stream_jpeg = self._latest_jpeg
                self._latest_stream_frame_id += 1
                self._persist_session_locked()
                self._raw_frame_condition.notify_all()
            raise RuntimeError(safe_message) from exc

        with self._lock:
            self._next_session_id += 1
            session = ProcessingSession(session_id=self._next_session_id, config=config, stop_event=threading.Event())
            self._active_session = session
            self._config = config
            self._latest_jpeg = self._build_status_frame("Starting camera processing...")
            self._latest_stream_jpeg = self._latest_jpeg
            self._latest_stream_frame_id = 0
            self._state = RuntimeState(running=True, status="running", error=None)
            self._latest_raw_frame = None
            self._latest_raw_frame_id = 0
            self._latest_tracks = []
            self._reader_thread = threading.Thread(target=self._capture_loop, args=(session,), name="tanaw-camera-reader", daemon=True)
            self._processing_thread = threading.Thread(target=self._processing_loop, args=(session,), name="tanaw-camera-processing", daemon=True)
            self._stream_thread = threading.Thread(target=self._stream_encoding_loop, args=(session,), name="tanaw-camera-stream-encoder", daemon=True)
            self._reader_thread.start()
            self._processing_thread.start()
            self._stream_thread.start()
            self._persist_session_locked()

    def stop(self) -> None:
        threads: list[threading.Thread]
        with self._lock:
            session = self._active_session
            threads = [thread for thread in (self._reader_thread, self._processing_thread, self._stream_thread) if thread is not None]
            if session is not None:
                session.stop_event.set()
            self._active_session = None
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
                        "visitor_id": track.visitor_id,
                        "is_unique_entry": track.is_unique_entry,
                        "reid_score": track.reid_score,
                        "reid_decision": track.reid_decision,
                        "identity_confidence": track.identity_confidence,
                        "inside_roi": track.inside_roi,
                        "counting_eligible": track.counting_eligible,
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

    def model_status(self) -> dict:
        return {
            **self._tracker.status(),
            **self._reidentifier.status(),
            **self._visitor_registry.status(),
        }

    def record_report_submission(self, report_id: str, period: str, notes: str | None = None, payload: dict | None = None) -> dict:
        submission = self._session_store.record_report_submission(report_id=report_id, period=period, notes=notes, payload=payload)
        self._visitor_registry.cleanup_expired()
        return submission

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

    def _capture_loop(self, session: ProcessingSession) -> None:
        config = session.config
        if not self._is_current_session(session):
            return

        runtime_stream_url = self._runtime_stream_url(config)
        snapshot_url = build_ip_webcam_snapshot_url(runtime_stream_url) if config.camera_type == "IP_WEBCAM" else None
        if snapshot_url is not None:
            self._ip_webcam_snapshot_capture_loop(session, snapshot_url)
            return

        if is_mjpeg_http_stream(runtime_stream_url):
            self._mjpeg_capture_loop(session, runtime_stream_url)
        else:
            self._opencv_capture_loop(session, runtime_stream_url)

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

    def _ip_webcam_snapshot_capture_loop(self, session: ProcessingSession, snapshot_url: str) -> None:
        config = session.config
        failed_reads = 0
        last_error = "Camera snapshot endpoint stopped returning frames."
        frame_interval = 1.0 / max(config.processing_fps, 1.0)

        try:
            while not session.stop_event.is_set() and self._is_current_session(session):
                started_at = time.monotonic()

                try:
                    frame = read_http_jpeg_frame(snapshot_url)
                except Exception as exc:
                    frame = None
                    last_error = str(exc)

                if frame is None:
                    failed_reads += 1
                    if failed_reads >= 30:
                        self._set_session_error(session, redact_stream_credentials(f"Camera snapshot endpoint stopped returning frames: {last_error}"))
                        return
                else:
                    failed_reads = 0
                    frame = self._resize_for_processing(frame, config.max_frame_width)
                    self._publish_raw_frame(session, frame)

                elapsed = time.monotonic() - started_at
                remaining = frame_interval - elapsed
                if remaining > 0:
                    session.stop_event.wait(remaining)
        except Exception as exc:
            self._set_session_error(session, redact_stream_credentials(str(exc)))
        finally:
            with self._lock:
                if self._is_current_session_locked(session) and not session.stop_event.is_set() and self._state.status != "error":
                    self._state.status = "stopped"

    def _mjpeg_capture_loop(self, session: ProcessingSession, stream_url: str) -> None:
        config = session.config
        try:
            for frame in iter_mjpeg_frames(stream_url, session.stop_event):
                if session.stop_event.is_set() or not self._is_current_session(session):
                    break

                frame = self._resize_for_processing(frame, config.max_frame_width)
                self._publish_raw_frame(session, frame)

            if not session.stop_event.is_set() and self._is_current_session(session):
                self._set_session_error(session, "Camera stream stopped returning MJPEG frames.")
        except Exception as exc:
            self._set_session_error(session, redact_stream_credentials(str(exc)))
        finally:
            with self._lock:
                if self._is_current_session_locked(session) and self._state.status != "error":
                    self._state.status = "stopped"

    def _opencv_capture_loop(self, session: ProcessingSession, stream_url: str) -> None:
        config = session.config
        capture = open_capture(stream_url)
        failed_reads = 0

        try:
            if not capture.isOpened():
                self._set_session_error(session, "Camera stream could not be opened.")
                return

            while not session.stop_event.is_set() and self._is_current_session(session):
                ok, frame = capture.read()
                if not ok or frame is None:
                    failed_reads += 1
                    if failed_reads >= 90:
                        self._set_session_error(session, "Camera stream stopped returning frames.")
                        return
                    session.stop_event.wait(0.05)
                    continue

                failed_reads = 0
                frame = self._resize_for_processing(frame, config.max_frame_width)
                self._publish_raw_frame(session, frame)
        except Exception as exc:
            self._set_session_error(session, redact_stream_credentials(str(exc)))
        finally:
            capture.release()
            with self._lock:
                if self._is_current_session_locked(session) and self._state.status != "error":
                    self._state.status = "stopped"

    def _publish_raw_frame(self, session: ProcessingSession, frame) -> None:
        with self._raw_frame_condition:
            if not self._is_current_session_locked(session):
                return
            self._latest_raw_frame = frame
            self._latest_raw_frame_id += 1
            self._state.status = "running"
            self._state.error = None
            self._raw_frame_condition.notify_all()

    def _processing_loop(self, session: ProcessingSession) -> None:
        config = session.config
        if not self._is_current_session(session):
            return

        last_processed_frame_id = 0
        frame_interval = 1.0 / max(config.processing_fps, 1.0)
        last_cleanup_at = time.monotonic()

        try:
            self._tracker.warmup()
            while not session.stop_event.is_set() and self._is_current_session(session):
                if time.monotonic() - last_cleanup_at >= 3600:
                    self._visitor_registry.cleanup_expired()
                    last_cleanup_at = time.monotonic()

                frame, frame_id = self._wait_for_latest_frame(session, last_processed_frame_id)
                if frame is None:
                    continue

                started_at = time.monotonic()
                tracks = self._detect_and_count(session, frame, config.confidence)
                last_processed_frame_id = frame_id

                with self._lock:
                    if not self._is_current_session_locked(session):
                        return
                    self._latest_tracks = tracks
                    self._state.status = "running"
                    self._state.error = None

                elapsed = time.monotonic() - started_at
                remaining = frame_interval - elapsed
                if remaining > 0:
                    session.stop_event.wait(remaining)
        except Exception as exc:
            self._set_session_error(session, str(exc))
        finally:
            with self._lock:
                if self._is_current_session_locked(session):
                    self._state.running = False
                if self._is_current_session_locked(session) and self._state.status != "error":
                    self._state.status = "stopped"

    def _stream_encoding_loop(self, session: ProcessingSession) -> None:
        config = session.config
        if not self._is_current_session(session):
            return

        last_encoded_raw_frame_id = 0
        frame_interval = 1.0 / max(config.stream_fps, 1.0)

        try:
            while not session.stop_event.is_set() and self._is_current_session(session):
                frame_snapshot = self._next_display_frame_snapshot(session, last_encoded_raw_frame_id, timeout=1.0)
                if frame_snapshot is None:
                    continue

                (
                    frame,
                    raw_frame_id,
                    tracks,
                    tripwire_position,
                    entry_line,
                    exit_line,
                    roi,
                    reverse_direction,
                    entry_count,
                    exit_count,
                    occupancy_count,
                ) = frame_snapshot

                started_at = time.monotonic()
                display_frame = self._render_display_frame(frame, tracks, tripwire_position, entry_line, exit_line, roi, reverse_direction, entry_count, exit_count, occupancy_count)
                encoded = self._encode_frame(display_frame)

                with self._raw_frame_condition:
                    if not self._is_current_session_locked(session):
                        return
                    self._latest_stream_jpeg = encoded
                    self._latest_stream_frame_id += 1
                    last_encoded_raw_frame_id = raw_frame_id
                    self._raw_frame_condition.notify_all()

                elapsed = time.monotonic() - started_at
                remaining = frame_interval - elapsed
                if remaining > 0:
                    session.stop_event.wait(remaining)
        except Exception as exc:
            self._set_session_error(session, str(exc))

    def _next_display_frame_snapshot(self, session: ProcessingSession, last_encoded_raw_frame_id: int, timeout: float):
        with self._raw_frame_condition:
            self._raw_frame_condition.wait_for(
                lambda: session.stop_event.is_set() or not self._is_current_session_locked(session) or self._latest_raw_frame_id > last_encoded_raw_frame_id,
                timeout=timeout,
            )

            if session.stop_event.is_set() or not self._is_current_session_locked(session) or self._latest_raw_frame is None or self._latest_raw_frame_id <= last_encoded_raw_frame_id:
                return None

            counts = self._counter.counts
            return (
                self._latest_raw_frame.copy(),
                self._latest_raw_frame_id,
                list(self._latest_tracks),
                self._counter.tripwire_position,
                self._counter.entry_line,
                self._counter.exit_line,
                session.config.roi,
                self._counter.reverse_direction,
                counts.entry,
                counts.exit,
                counts.occupancy,
            )

    def _wait_for_latest_frame(self, session: ProcessingSession, last_processed_frame_id: int):
        with self._raw_frame_condition:
            self._raw_frame_condition.wait_for(
                lambda: session.stop_event.is_set() or not self._is_current_session_locked(session) or self._latest_raw_frame_id > last_processed_frame_id,
                timeout=1.0,
            )

            if session.stop_event.is_set() or not self._is_current_session_locked(session) or self._latest_raw_frame is None:
                return None, last_processed_frame_id

            return self._latest_raw_frame.copy(), self._latest_raw_frame_id

    def _detect_and_count(self, session: ProcessingSession, frame, confidence: float) -> list[DisplayTrack]:
        frame_height, frame_width = frame.shape[:2]
        tracks = self._tracker.track_people(frame, confidence)
        if not self._is_current_session(session):
            return []

        display_tracks: list[DisplayTrack] = []
        self._counter.begin_frame()
        self._appearance_buffer.begin_frame(self._counter.frame_index)

        for track in tracks:
            if not self._is_current_session(session):
                return []

            inside_roi = self._point_inside_roi(track.counting_point, frame_width, frame_height, session.config)
            counting_eligible = track.track_id > 0 and inside_roi
            if counting_eligible:
                self._collect_track_embedding(frame, track, frame_width, frame_height)
            direction = self._counter.update(track.track_id, track.counting_point, frame_width, frame_height) if counting_eligible else None
            visitor_decision = None
            if direction is not None:
                if direction == "entry":
                    visitor_decision = self._resolve_unique_entry(session, frame, track)
                self._persist_count_event(session, track.track_id, direction, visitor_decision)
            display_tracks.append(
                DisplayTrack(
                    track_id=track.track_id,
                    bbox=track.bbox,
                    confidence=track.confidence,
                    centroid=(int(track.centroid.x), int(track.centroid.y)),
                    direction=direction,
                    visitor_id=visitor_decision.visitor_id if visitor_decision else None,
                    is_unique_entry=visitor_decision.is_unique_entry if visitor_decision else None,
                    reid_score=visitor_decision.reid_score if visitor_decision else None,
                    reid_decision=visitor_decision.reid_decision if visitor_decision else None,
                    identity_confidence=visitor_decision.identity_confidence if visitor_decision else None,
                    inside_roi=inside_roi,
                    counting_eligible=counting_eligible,
                )
            )

        return display_tracks

    def _point_inside_roi(self, point: Centroid, frame_width: int, frame_height: int, config: CameraStartRequest) -> bool:
        roi = config.roi
        x = point.x / max(frame_width, 1)
        y = point.y / max(frame_height, 1)
        return roi.left <= x <= roi.left + roi.width and roi.top <= y <= roi.top + roi.height

    def _collect_track_embedding(self, frame, track, frame_width: int, frame_height: int) -> None:
        if not self._appearance_buffer.should_sample(track, frame_width, frame_height, self._counter.frame_index):
            return

        result = self._reidentifier.embed(frame, track.bbox)
        if result is None:
            return

        quality = self._appearance_buffer.quality_score(track, frame_width, frame_height)
        self._appearance_buffer.record_sample(track.track_id, result.embedding, quality, self._counter.frame_index)

    def _resolve_unique_entry(self, session: ProcessingSession, frame, track) -> VisitorDecision:
        embedding = self._appearance_buffer.embedding_for_track(track.track_id)
        if embedding is None:
            result = self._reidentifier.embed(frame, track.bbox)
            if result is not None:
                embedding = result.embedding
                self._appearance_buffer.record_sample(track.track_id, result.embedding, track.confidence, self._counter.frame_index)

        with self._lock:
            camera_id = self._config.camera_id if self._config else None

        if not self._is_current_session(session):
            return VisitorDecision(
                visitor_id=None,
                is_unique_entry=True,
                reid_score=None,
                reid_decision="stale_session",
                identity_confidence="degraded",
                business_date=self._visitor_registry.business_date_for(datetime.now(timezone.utc)),
            )

        return self._visitor_registry.resolve_entry(
            track_id=track.track_id,
            camera_id=camera_id,
            embedding=embedding,
            detection_confidence=track.confidence,
            bbox=track.bbox,
        )

    def _render_display_frame(
        self,
        frame,
        tracks: list[DisplayTrack],
        tripwire_position: float,
        entry_line,
        exit_line,
        roi,
        reverse_direction: bool,
        entry_count: int,
        exit_count: int,
        occupancy_count: int,
    ):
        height, width = frame.shape[:2]
        self._draw_roi(frame, roi, width, height)
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

    def _draw_roi(self, frame, roi, frame_width: int, frame_height: int) -> None:
        x1 = int(roi.left * frame_width)
        y1 = int(roi.top * frame_height)
        x2 = int((roi.left + roi.width) * frame_width)
        y2 = int((roi.top + roi.height) * frame_height)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (59, 130, 246), 2)
        cv2.putText(frame, "ROI", (x1 + 8, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (59, 130, 246), 2, cv2.LINE_AA)

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

    def _is_current_session(self, session: ProcessingSession) -> bool:
        with self._lock:
            return self._is_current_session_locked(session)

    def _is_current_session_locked(self, session: ProcessingSession) -> bool:
        return self._active_session is session

    def _set_session_error(self, session: ProcessingSession, message: str) -> None:
        with self._raw_frame_condition:
            if not self._is_current_session_locked(session):
                return

            safe_message = redact_stream_credentials(message)
            self._state = RuntimeState(running=False, status="error", error=safe_message)
            self._latest_jpeg = self._build_status_frame(safe_message)
            self._latest_stream_jpeg = self._latest_jpeg
            self._latest_stream_frame_id += 1
            session.stop_event.set()
            self._active_session = None
            self._persist_session_locked()
            self._raw_frame_condition.notify_all()

    def _build_status_frame(self, message: str) -> bytes:
        frame = np.zeros((540, 960, 3), dtype=np.uint8)
        frame[:] = (17, 24, 39)
        cv2.line(frame, (480, 0), (480, 540), (59, 130, 246), 2)
        cv2.putText(frame, "TANAW ML Camera Service", (270, 236), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, message[:72], (90, 288), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (203, 213, 225), 2, cv2.LINE_AA)
        return self._encode_frame(frame)

    def _persist_count_event(self, session: ProcessingSession, track_id: int, direction: str, visitor_decision: VisitorDecision | None = None) -> None:
        with self._lock:
            if not self._is_current_session_locked(session):
                return

            counts = self._counter.counts.as_dict()
            visitor_fields = visitor_decision.as_event_fields() if visitor_decision else {}
            try:
                self._session_store.append_event(
                    {
                        "camera_id": self._config.camera_id if self._config else None,
                        "camera_name": self._config.camera_name if self._config else None,
                        "direction": direction,
                        "track_id": track_id,
                        **visitor_fields,
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


def _seconds_to_frames(seconds: float, processing_fps: float) -> int:
    return max(1, int(round(seconds * max(processing_fps, 1.0))))
