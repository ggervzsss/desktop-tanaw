import asyncio
import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.camera.auth import redact_stream_credentials
from app.camera.camera_manager import CameraProcessingManager
from app.config.camera_config import (
    CameraStartRequest,
    CameraTestRequest,
    CameraTestResponse,
    CountResponse,
    DetectionResponse,
    HealthResponse,
    MetricsSummaryResponse,
    ReportSubmissionRequest,
    ReportSubmissionResponse,
    SessionResponse,
)


manager = CameraProcessingManager()

app = FastAPI(title="TANAW Local ML Camera Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def restore_active_session() -> None:
    threading.Thread(target=manager.restore_last_session, name="tanaw-restore-session", daemon=True).start()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    counts = manager.counts()
    return HealthResponse(running=bool(counts["running"]), error=counts["error"] if isinstance(counts["error"], str) else None)


@app.post("/camera/test", response_model=CameraTestResponse)
def test_camera(payload: CameraTestRequest) -> CameraTestResponse:
    ok, message = manager.test_connection(payload.stream_url, payload.camera_type, payload.username, payload.password)
    return CameraTestResponse(ok=ok, message=message)


@app.post("/camera/start")
def start_camera(payload: CameraStartRequest) -> dict[str, str]:
    try:
        manager.start(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=redact_stream_credentials(str(exc))) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=redact_stream_credentials(str(exc))) from exc

    return {"message": "Camera processing started."}


@app.post("/camera/stop")
def stop_camera() -> dict[str, str]:
    manager.stop()
    return {"message": "Camera processing stopped."}


@app.get("/counts", response_model=CountResponse)
def counts() -> CountResponse:
    return CountResponse(**manager.counts())


@app.get("/session", response_model=SessionResponse)
def session() -> SessionResponse:
    return SessionResponse(**manager.session())


@app.get("/metrics/summary", response_model=MetricsSummaryResponse)
def metrics_summary(include_submitted: bool = False) -> MetricsSummaryResponse:
    return MetricsSummaryResponse(**manager.metrics_summary(include_submitted=include_submitted))


@app.post("/reports/local-submit", response_model=ReportSubmissionResponse)
def record_local_report_submission(payload: ReportSubmissionRequest) -> ReportSubmissionResponse:
    return ReportSubmissionResponse(**manager.record_report_submission(payload.report_id, payload.period, payload.notes, payload.payload))


@app.post("/session/restore", response_model=SessionResponse)
def restore_session() -> SessionResponse:
    manager.restore_last_session()
    return SessionResponse(**manager.session())


@app.get("/detections", response_model=DetectionResponse)
def detections() -> DetectionResponse:
    return DetectionResponse(**manager.detections())


@app.get("/stream")
async def stream():
    async def frames():
        last_frame_id = 0
        while True:
            frame, last_frame_id = await asyncio.to_thread(manager.wait_for_stream_frame, last_frame_id)
            yield b"--frame\r\nContent-Type: image/jpeg\r\nCache-Control: no-cache\r\n\r\n" + frame + b"\r\n"

    return StreamingResponse(frames(), media_type="multipart/x-mixed-replace; boundary=frame")
