from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.counting.geometry import Centroid

NormalizedLine = tuple[tuple[float, float], tuple[float, float]]


@dataclass
class CountSnapshot:
    entry: int = 0
    exit: int = 0
    occupancy: int = 0
    started_at: datetime | None = None

    def as_dict(self) -> dict[str, int | str | None]:
        return {
            "entry": self.entry,
            "exit": self.exit,
            "occupancy": self.occupancy,
            "started_at": self.started_at.isoformat() if self.started_at else None,
        }


@dataclass
class TripwireCounter:
    tripwire_position: float = 0.5
    entry_line: NormalizedLine | None = None
    exit_line: NormalizedLine | None = None
    reverse_direction: bool = False
    counts: CountSnapshot = field(default_factory=CountSnapshot)
    previous_centroids: dict[int, Centroid] = field(default_factory=dict)
    counted_events: set[tuple[int, str]] = field(default_factory=set)

    def reset(self) -> None:
        self.counts = CountSnapshot(started_at=datetime.now(timezone.utc))
        self.previous_centroids.clear()
        self.counted_events.clear()

    def line_x(self, frame_width: int) -> int:
        return int(frame_width * self.tripwire_position)

    def update(self, track_id: int, centroid: Centroid, frame_width: int, frame_height: int) -> str | None:
        previous = self.previous_centroids.get(track_id)
        self.previous_centroids[track_id] = centroid

        if previous is None:
            return None

        direction = self._line_crossing_direction(previous, centroid, frame_width, frame_height)

        if direction is None:
            return None

        if self.entry_line is None and self.exit_line is None and self.reverse_direction:
            direction = "exit" if direction == "entry" else "entry"

        event_key = (track_id, direction)
        if event_key in self.counted_events:
            return None

        self.counted_events.add(event_key)
        if direction == "entry":
            self.counts.entry += 1
            self.counts.occupancy += 1
        else:
            self.counts.exit += 1
            self.counts.occupancy = max(0, self.counts.occupancy - 1)

        return direction

    def _line_crossing_direction(self, previous: Centroid, current: Centroid, frame_width: int, frame_height: int) -> str | None:
        if self.entry_line is not None or self.exit_line is not None:
            if self.entry_line is not None and _movement_crosses_line(previous, current, self.entry_line, frame_width, frame_height):
                return "entry"
            if self.exit_line is not None and _movement_crosses_line(previous, current, self.exit_line, frame_width, frame_height):
                return "exit"
            return None

        line_x = self.line_x(frame_width)
        if previous.x < line_x <= current.x:
            return "entry"
        if previous.x > line_x >= current.x:
            return "exit"

        return None


def _movement_crosses_line(previous: Centroid, current: Centroid, line: NormalizedLine, frame_width: int, frame_height: int) -> bool:
    line_start, line_end = _scale_line(line, frame_width, frame_height)
    movement_start = (previous.x, previous.y)
    movement_end = (current.x, current.y)
    return _segments_intersect(movement_start, movement_end, line_start, line_end)


def _scale_line(line: NormalizedLine, frame_width: int, frame_height: int) -> tuple[tuple[float, float], tuple[float, float]]:
    (x1, y1), (x2, y2) = line
    return (x1 * frame_width, y1 * frame_height), (x2 * frame_width, y2 * frame_height)


def _segments_intersect(
    first_start: tuple[float, float],
    first_end: tuple[float, float],
    second_start: tuple[float, float],
    second_end: tuple[float, float],
) -> bool:
    orientation_1 = _orientation(first_start, first_end, second_start)
    orientation_2 = _orientation(first_start, first_end, second_end)
    orientation_3 = _orientation(second_start, second_end, first_start)
    orientation_4 = _orientation(second_start, second_end, first_end)

    if orientation_1 != orientation_2 and orientation_3 != orientation_4:
        return True

    if orientation_1 == 0 and _on_segment(first_start, second_start, first_end):
        return True
    if orientation_2 == 0 and _on_segment(first_start, second_end, first_end):
        return True
    if orientation_3 == 0 and _on_segment(second_start, first_start, second_end):
        return True
    if orientation_4 == 0 and _on_segment(second_start, first_end, second_end):
        return True

    return False


def _orientation(first: tuple[float, float], second: tuple[float, float], third: tuple[float, float]) -> int:
    value = (second[1] - first[1]) * (third[0] - second[0]) - (second[0] - first[0]) * (third[1] - second[1])
    if abs(value) < 1e-9:
        return 0
    return 1 if value > 0 else 2


def _on_segment(first: tuple[float, float], second: tuple[float, float], third: tuple[float, float]) -> bool:
    return min(first[0], third[0]) <= second[0] <= max(first[0], third[0]) and min(first[1], third[1]) <= second[1] <= max(first[1], third[1])
