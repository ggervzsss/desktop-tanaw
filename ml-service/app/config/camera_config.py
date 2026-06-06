from typing import Literal

from pydantic import BaseModel, Field, field_validator


CameraType = Literal["IP_WEBCAM", "RTSP_CCTV", "USB_WEBCAM", "ONVIF_CCTV"]


class TripwirePoint(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)


class TripwireLine(BaseModel):
    start: TripwirePoint
    end: TripwirePoint


class CameraStartRequest(BaseModel):
    stream_url: str = Field(..., min_length=3)
    confidence: float = Field(default=0.35, ge=0.05, le=0.95)
    camera_id: int | None = None
    camera_name: str | None = Field(default=None, max_length=120)
    camera_type: CameraType = "IP_WEBCAM"
    username: str | None = Field(default=None, max_length=120)
    password: str | None = Field(default=None, max_length=240)
    tripwire_position: float = Field(default=0.5, ge=0.1, le=0.9)
    entry_line: TripwireLine | None = None
    exit_line: TripwireLine | None = None
    reverse_direction: bool = False
    processing_fps: float = Field(default=5.0, ge=1.0, le=15.0)
    stream_fps: float = Field(default=24.0, ge=1.0, le=30.0)
    max_frame_width: int = Field(default=640, ge=320, le=1280)

    @field_validator("stream_url")
    @classmethod
    def validate_stream_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Stream URL is required.")

        if normalized.isdigit():
            return normalized

        if normalized.startswith(("http://", "https://", "rtsp://")):
            return normalized

        raise ValueError("Stream URL must start with http://, https://, rtsp://, or be a numeric webcam index.")


class CameraTestRequest(BaseModel):
    stream_url: str = Field(..., min_length=3)
    camera_type: CameraType = "IP_WEBCAM"
    username: str | None = Field(default=None, max_length=120)
    password: str | None = Field(default=None, max_length=240)

    @field_validator("stream_url")
    @classmethod
    def validate_stream_url(cls, value: str) -> str:
        return CameraStartRequest(stream_url=value).stream_url


class CameraTestResponse(BaseModel):
    ok: bool
    message: str


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    running: bool
    error: str | None = None


class CountResponse(BaseModel):
    entry: int
    exit: int
    occupancy: int
    running: bool
    status: str
    started_at: str | None = None
    error: str | None = None


class DetectionTrackResponse(BaseModel):
    track_id: int
    bbox: tuple[int, int, int, int]
    confidence: float
    centroid: tuple[int, int]
    direction: str | None = None


class DetectionResponse(BaseModel):
    running: bool
    status: str
    error: str | None = None
    frame_width: int | None = None
    frame_height: int | None = None
    tracks: list[DetectionTrackResponse]


class SessionResponse(BaseModel):
    running: bool
    status: str
    error: str | None = None
    camera_id: int | None = None
    camera_name: str | None = None
    camera_config: dict | None = None
    counts: CountResponse
    updated_at: str | None = None


class MetricsSummaryResponse(BaseModel):
    entries: int
    exits: int
    peak_occupancy: int
    current_occupancy: int
    unique_count: int
    total_events: int
    unsubmitted_events: int
    unsynced_events: int
    first_event_at: str | None = None
    last_event_at: str | None = None


class ReportSubmissionRequest(BaseModel):
    report_id: str = Field(..., min_length=3, max_length=80)
    period: str = Field(default="Current Period", min_length=1, max_length=120)
    notes: str | None = Field(default=None, max_length=5000)
    payload: dict | None = None


class ReportSubmissionResponse(MetricsSummaryResponse):
    report_id: str
    submitted_at: str
    sync_status: str
