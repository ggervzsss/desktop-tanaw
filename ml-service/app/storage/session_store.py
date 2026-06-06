import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.storage.local_metrics_store import LocalMetricsStore


class SessionStore:
    def __init__(self, app_data_dir: str | None = None) -> None:
        base_dir = app_data_dir or os.environ.get("TANAW_APP_DATA_DIR")
        if base_dir:
            self._root = Path(base_dir) / "ml-service"
        else:
            self._root = Path.home() / ".tanaw" / "ml-service"

        self._session_path = self._root / "active_session.json"
        self._events_path = self._root / "events.jsonl"
        self._metrics_store = LocalMetricsStore(app_data_dir)

    def load_session(self) -> dict[str, Any] | None:
        if not self._session_path.exists():
            return None

        try:
            with self._session_path.open("r", encoding="utf-8") as file:
                payload = json.load(file)
        except (OSError, json.JSONDecodeError):
            return None

        return payload if isinstance(payload, dict) else None

    def save_session(self, payload: dict[str, Any]) -> None:
        self._root.mkdir(parents=True, exist_ok=True)
        serializable = {
            **payload,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        temporary_path = self._session_path.with_suffix(".tmp")

        with temporary_path.open("w", encoding="utf-8") as file:
            json.dump(serializable, file, indent=2, sort_keys=True)

        temporary_path.replace(self._session_path)
        self._metrics_store.save_count_snapshot(serializable, serializable["updated_at"])

    def append_event(self, payload: dict[str, Any]) -> None:
        self._root.mkdir(parents=True, exist_ok=True)
        event = {
            **payload,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }

        with self._events_path.open("a", encoding="utf-8") as file:
            file.write(json.dumps(event, sort_keys=True))
            file.write("\n")

        self._metrics_store.append_count_event(event, event["recorded_at"])

    def metrics_summary(self, include_submitted: bool = False) -> dict[str, int | str | None]:
        return self._metrics_store.metrics_summary(include_submitted=include_submitted)

    def record_report_submission(self, report_id: str, period: str, notes: str | None = None, payload: dict[str, Any] | None = None) -> dict[str, int | str | None]:
        return self._metrics_store.record_report_submission(report_id=report_id, period=period, notes=notes, payload=payload)
