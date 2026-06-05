from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.counting.geometry import Centroid


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

    def update(self, track_id: int, centroid: Centroid, frame_width: int) -> str | None:
        line_x = self.line_x(frame_width)
        previous = self.previous_centroids.get(track_id)
        self.previous_centroids[track_id] = centroid

        if previous is None:
            return None

        direction: str | None = None
        if previous.x < line_x <= centroid.x:
            direction = "entry"
        elif previous.x > line_x >= centroid.x:
            direction = "exit"

        if direction is None:
            return None

        if self.reverse_direction:
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

