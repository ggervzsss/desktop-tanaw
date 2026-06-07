from math import hypot
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


CameraType = Literal["IP_WEBCAM", "RTSP_CCTV", "USB_WEBCAM", "ONVIF_CCTV"]


class TripwirePoint(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)


class TripwireLine(BaseModel):
    start: TripwirePoint
    end: TripwirePoint


class RegionOfInterest(BaseModel):
    top: float = Field(default=0.10, ge=0.0, le=1.0)
    left: float = Field(default=0.10, ge=0.0, le=1.0)
    width: float = Field(default=0.80, ge=0.10, le=1.0)
    height: float = Field(default=0.80, ge=0.10, le=1.0)

    @model_validator(mode="after")
    def validate_bounds(self) -> "RegionOfInterest":
        if self.left + self.width > 1.0:
            raise ValueError("ROI left + width must not exceed 1.0.")
        if self.top + self.height > 1.0:
            raise ValueError("ROI top + height must not exceed 1.0.")
        return self


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
    roi: RegionOfInterest = Field(default_factory=RegionOfInterest)
    reverse_direction: bool = False
    processing_fps: float = Field(default=5.0, ge=1.0, le=15.0)
    stream_fps: float = Field(default=24.0, ge=1.0, le=30.0)
    max_frame_width: int = Field(default=640, ge=320, le=1280)
    event_cooldown_seconds: float = Field(default=3.6, ge=0.5, le=30.0)
    paired_line_max_gap_seconds: float = Field(default=18.0, ge=1.0, le=120.0)
    track_ttl_seconds: float = Field(default=9.0, ge=1.0, le=60.0)

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

    @model_validator(mode="after")
    def validate_counting_geometry(self) -> "CameraStartRequest":
        if self.entry_line is None and self.exit_line is None:
            return self

        if self.entry_line is None or self.exit_line is None:
            raise ValueError("Both entry_line and exit_line are required when using custom tripwire lines.")

        entry_length = _line_length(self.entry_line)
        exit_length = _line_length(self.exit_line)
        if entry_length < 0.10 or exit_length < 0.10:
            raise ValueError("Tripwire lines must be at least 0.10 normalized units long.")

        if _lines_overlap(self.entry_line, self.exit_line, tolerance=0.03):
            raise ValueError("Entry and exit tripwire lines must not overlap.")

        return self


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
    model_loaded: bool = False
    model_ready: bool = False
    model_loading: bool = False
    device: str | None = None
    model_path: str | None = None
    reid_model_loaded: bool = False
    reid_model_ready: bool = False
    reid_model_loading: bool = False
    reid_status: str | None = None
    reid_model_path: str | None = None
    reid_error: str | None = None
    reid_average_inference_ms: float | None = None
    reid_gallery_size: int = 0
    reid_business_date: str | None = None
    reid_last_cleanup_at: str | None = None


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
    visitor_id: str | None = None
    is_unique_entry: bool | None = None
    reid_score: float | None = None
    reid_decision: str | None = None
    identity_confidence: str | None = None
    inside_roi: bool | None = None
    counting_eligible: bool | None = None


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


def _line_length(line: TripwireLine) -> float:
    return hypot(line.end.x - line.start.x, line.end.y - line.start.y)


def _lines_overlap(first: TripwireLine, second: TripwireLine, tolerance: float) -> bool:
    same_direction = _point_distance(first.start, second.start) < tolerance and _point_distance(first.end, second.end) < tolerance
    reverse_direction = _point_distance(first.start, second.end) < tolerance and _point_distance(first.end, second.start) < tolerance
    return same_direction or reverse_direction


def _point_distance(first: TripwirePoint, second: TripwirePoint) -> float:
    return hypot(second.x - first.x, second.y - first.y)
