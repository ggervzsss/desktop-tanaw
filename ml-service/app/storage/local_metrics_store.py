import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator
from uuid import uuid4


class LocalMetricsStore:
    def __init__(self, app_data_dir: str | None = None) -> None:
        base_dir = app_data_dir or os.environ.get("TANAW_APP_DATA_DIR")
        if base_dir:
            self._root = Path(base_dir) / "ml-service"
        else:
            self._root = Path.home() / ".tanaw" / "ml-service"

        self._database_path = self._root / "tanaw_metrics.sqlite3"
        self._initialized = False

    def append_count_event(self, payload: dict[str, Any], recorded_at: str | None = None) -> str:
        event_id = str(uuid4())
        recorded_at = recorded_at or _utc_now()
        counts = payload.get("counts") if isinstance(payload.get("counts"), dict) else {}

        with self._connection() as connection:
            connection.execute(
                """
                insert into count_events (
                    event_id,
                    recorded_at,
                    camera_id,
                    camera_name,
                    direction,
                    track_id,
                    entry_count,
                    exit_count,
                    occupancy_count,
                    payload_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    recorded_at,
                    payload.get("camera_id"),
                    payload.get("camera_name"),
                    payload.get("direction"),
                    payload.get("track_id"),
                    _safe_int(counts.get("entry")),
                    _safe_int(counts.get("exit")),
                    _safe_int(counts.get("occupancy")),
                    json.dumps(payload, sort_keys=True),
                ),
            )

        return event_id

    def save_count_snapshot(self, payload: dict[str, Any], recorded_at: str | None = None) -> None:
        counts = payload.get("counts") if isinstance(payload.get("counts"), dict) else {}
        recorded_at = recorded_at or _utc_now()

        with self._connection() as connection:
            connection.execute(
                """
                insert into count_snapshots (
                    recorded_at,
                    camera_id,
                    camera_name,
                    entry_count,
                    exit_count,
                    occupancy_count,
                    running,
                    status,
                    error,
                    payload_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    recorded_at,
                    payload.get("camera_id"),
                    payload.get("camera_name"),
                    _safe_int(counts.get("entry")),
                    _safe_int(counts.get("exit")),
                    _safe_int(counts.get("occupancy")),
                    1 if payload.get("running") else 0,
                    payload.get("status"),
                    payload.get("error"),
                    json.dumps(payload, sort_keys=True),
                ),
            )

    def metrics_summary(self, include_submitted: bool = False) -> dict[str, int | str | None]:
        submitted_filter = "" if include_submitted else "where submitted_report_id is null"
        with self._connection() as connection:
            row = connection.execute(
                f"""
                select
                    count(*) as total_events,
                    sum(case when direction = 'entry' then 1 else 0 end) as entries,
                    sum(case when direction = 'exit' then 1 else 0 end) as exits,
                    max(occupancy_count) as peak_occupancy,
                    max(occupancy_count) as current_occupancy,
                    min(recorded_at) as first_event_at,
                    max(recorded_at) as last_event_at
                from count_events
                {submitted_filter}
                """
            ).fetchone()

            unsynced_count = connection.execute("select count(*) from count_events where synced_at is null").fetchone()[0]
            unsubmitted_count = connection.execute("select count(*) from count_events where submitted_report_id is null").fetchone()[0]

        entries = _safe_int(row["entries"])
        exits = _safe_int(row["exits"])
        return {
            "entries": entries,
            "exits": exits,
            "peak_occupancy": _safe_int(row["peak_occupancy"]),
            "current_occupancy": max(0, entries - exits),
            "unique_count": entries,
            "total_events": _safe_int(row["total_events"]),
            "unsubmitted_events": _safe_int(unsubmitted_count),
            "unsynced_events": _safe_int(unsynced_count),
            "first_event_at": row["first_event_at"],
            "last_event_at": row["last_event_at"],
        }

    def record_report_submission(self, report_id: str, period: str, notes: str | None = None, payload: dict[str, Any] | None = None) -> dict[str, int | str | None]:
        submitted_at = _utc_now()
        summary = self.metrics_summary(include_submitted=False)
        report_payload = payload or {}

        with self._connection() as connection:
            connection.execute(
                """
                insert or replace into report_submissions (
                    report_id,
                    period,
                    submitted_at,
                    entries,
                    exits,
                    peak_occupancy,
                    unique_count,
                    notes,
                    payload_json,
                    sync_status
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    report_id,
                    period,
                    submitted_at,
                    summary["entries"],
                    summary["exits"],
                    summary["peak_occupancy"],
                    summary["unique_count"],
                    notes,
                    json.dumps(report_payload, sort_keys=True),
                    "pending_cloud_sync",
                ),
            )
            connection.execute(
                """
                update count_events
                set submitted_report_id = ?
                where submitted_report_id is null
                """,
                (report_id,),
            )

        return {
            **summary,
            "report_id": report_id,
            "submitted_at": submitted_at,
            "sync_status": "pending_cloud_sync",
        }

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        self._initialize()
        connection = sqlite3.connect(self._database_path)
        connection.row_factory = sqlite3.Row
        try:
            connection.execute("pragma foreign_keys = on")
            yield connection
            connection.commit()
        finally:
            connection.close()

    def _initialize(self) -> None:
        if self._initialized:
            return

        self._root.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._database_path)
        try:
            connection.executescript(
                """
                create table if not exists count_events (
                    id integer primary key autoincrement,
                    event_id text not null unique,
                    recorded_at text not null,
                    camera_id integer,
                    camera_name text,
                    direction text not null check (direction in ('entry', 'exit')),
                    track_id integer,
                    entry_count integer not null default 0,
                    exit_count integer not null default 0,
                    occupancy_count integer not null default 0,
                    payload_json text not null,
                    submitted_report_id text,
                    synced_at text
                );

                create index if not exists idx_count_events_recorded_at on count_events(recorded_at);
                create index if not exists idx_count_events_submitted_report_id on count_events(submitted_report_id);
                create index if not exists idx_count_events_synced_at on count_events(synced_at);

                create table if not exists count_snapshots (
                    id integer primary key autoincrement,
                    recorded_at text not null,
                    camera_id integer,
                    camera_name text,
                    entry_count integer not null default 0,
                    exit_count integer not null default 0,
                    occupancy_count integer not null default 0,
                    running integer not null default 0,
                    status text,
                    error text,
                    payload_json text not null
                );

                create index if not exists idx_count_snapshots_recorded_at on count_snapshots(recorded_at);

                create table if not exists report_submissions (
                    report_id text primary key,
                    period text not null,
                    submitted_at text not null,
                    entries integer not null default 0,
                    exits integer not null default 0,
                    peak_occupancy integer not null default 0,
                    unique_count integer not null default 0,
                    notes text,
                    payload_json text not null,
                    sync_status text not null default 'pending_cloud_sync',
                    synced_at text
                );
                """
            )
            connection.commit()
        finally:
            connection.close()

        self._initialized = True


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_int(value: Any) -> int:
    return value if isinstance(value, int) else 0
