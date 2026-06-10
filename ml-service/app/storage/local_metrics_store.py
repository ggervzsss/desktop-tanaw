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
        direction = payload.get("direction")
        is_unique_entry = payload.get("is_unique_entry")
        if is_unique_entry is None:
            is_unique_entry = direction == "entry"

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
                    visitor_id,
                    is_unique_entry,
                    reid_score,
                    reid_decision,
                    identity_confidence,
                    payload_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    recorded_at,
                    payload.get("camera_id"),
                    payload.get("camera_name"),
                    direction,
                    payload.get("track_id"),
                    _safe_int(counts.get("entry")),
                    _safe_int(counts.get("exit")),
                    _safe_int(counts.get("occupancy")),
                    payload.get("visitor_id"),
                    1 if is_unique_entry else 0,
                    _safe_float(payload.get("reid_score")),
                    payload.get("reid_decision"),
                    payload.get("identity_confidence"),
                    json.dumps(payload, sort_keys=True),
                ),
            )

        return event_id

    def upsert_visitor_identity(
        self,
        *,
        visitor_id: str,
        business_date: str,
        camera_id: int | None,
        embedding: bytes,
        embedding_dim: int,
        embedding_count: int,
        model_name: str,
        expires_at: str,
        recorded_at: str | None = None,
    ) -> None:
        recorded_at = recorded_at or _utc_now()
        with self._connection() as connection:
            connection.execute(
                """
                insert into visitor_identities (
                    visitor_id,
                    business_date,
                    camera_id,
                    first_seen_at,
                    last_seen_at,
                    representative_embedding,
                    embedding_dim,
                    embedding_count,
                    model_name,
                    expires_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(visitor_id) do update set
                    last_seen_at = excluded.last_seen_at,
                    representative_embedding = excluded.representative_embedding,
                    embedding_dim = excluded.embedding_dim,
                    embedding_count = excluded.embedding_count,
                    model_name = excluded.model_name,
                    expires_at = excluded.expires_at
                """,
                (
                    visitor_id,
                    business_date,
                    camera_id,
                    recorded_at,
                    recorded_at,
                    embedding,
                    embedding_dim,
                    embedding_count,
                    model_name,
                    expires_at,
                ),
            )

    def append_visitor_sighting(self, payload: dict[str, Any], recorded_at: str | None = None) -> str:
        sighting_id = str(uuid4())
        recorded_at = recorded_at or _utc_now()
        with self._connection() as connection:
            connection.execute(
                """
                insert into visitor_sightings (
                    sighting_id,
                    visitor_id,
                    recorded_at,
                    business_date,
                    camera_id,
                    track_id,
                    direction,
                    reid_score,
                    reid_decision,
                    identity_confidence,
                    detection_confidence,
                    bbox_json,
                    payload_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sighting_id,
                    payload["visitor_id"],
                    recorded_at,
                    payload["business_date"],
                    payload.get("camera_id"),
                    payload.get("track_id"),
                    payload.get("direction"),
                    _safe_float(payload.get("reid_score")),
                    payload["reid_decision"],
                    payload["identity_confidence"],
                    _safe_float(payload.get("detection_confidence")),
                    json.dumps(payload.get("bbox"), sort_keys=True) if payload.get("bbox") is not None else None,
                    json.dumps(payload, sort_keys=True),
                ),
            )

        return sighting_id

    def load_active_visitor_identities(self, business_date: str, now: str | None = None) -> list[dict[str, Any]]:
        now = now or _utc_now()
        with self._connection() as connection:
            rows = connection.execute(
                """
                select
                    visitor_id,
                    business_date,
                    camera_id,
                    first_seen_at,
                    last_seen_at,
                    representative_embedding,
                    embedding_dim,
                    embedding_count,
                    model_name,
                    expires_at
                from visitor_identities
                where business_date = ?
                    and expires_at > ?
                order by last_seen_at desc
                """,
                (business_date, now),
            ).fetchall()

        return [dict(row) for row in rows]

    def cleanup_expired_visitor_metadata(self, now: str | None = None) -> int:
        now = now or _utc_now()
        with self._connection() as connection:
            visitor_ids = [
                row["visitor_id"]
                for row in connection.execute(
                    """
                    select visitor_id
                    from visitor_identities
                    where expires_at <= ?
                    """,
                    (now,),
                ).fetchall()
            ]
            if not visitor_ids:
                return 0

            placeholders = ",".join("?" for _ in visitor_ids)
            connection.execute(f"delete from visitor_sightings where visitor_id in ({placeholders})", visitor_ids)
            connection.execute(f"delete from visitor_identities where visitor_id in ({placeholders})", visitor_ids)

        return len(visitor_ids)

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
                    sum(case when direction = 'entry' and is_unique_entry = 1 then 1 else 0 end) as unique_entries,
                    sum(case when direction = 'entry' and is_unique_entry = 1 and visitor_id is not null and visitor_id != '' then 1 else 0 end) as confirmed_unique_entries,
                    sum(case when direction = 'entry' and is_unique_entry = 1 and (visitor_id is null or visitor_id = '') then 1 else 0 end) as degraded_unique_entries,
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
            "unique_count": _safe_int(row["unique_entries"]),
            "confirmed_unique_count": _safe_int(row["confirmed_unique_entries"]),
            "degraded_unique_count": _safe_int(row["degraded_unique_entries"]),
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
        connection.row_factory = sqlite3.Row
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
                    visitor_id text,
                    is_unique_entry integer not null default 0,
                    reid_score real,
                    reid_decision text,
                    identity_confidence text,
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

                create table if not exists visitor_identities (
                    visitor_id text primary key,
                    business_date text not null,
                    camera_id integer,
                    first_seen_at text not null,
                    last_seen_at text not null,
                    representative_embedding blob not null,
                    embedding_dim integer not null,
                    embedding_count integer not null default 1,
                    model_name text not null,
                    expires_at text not null
                );

                create index if not exists idx_visitor_identities_business_date on visitor_identities(business_date);
                create index if not exists idx_visitor_identities_expires_at on visitor_identities(expires_at);

                create table if not exists visitor_sightings (
                    sighting_id text primary key,
                    visitor_id text not null,
                    recorded_at text not null,
                    business_date text not null,
                    camera_id integer,
                    track_id integer,
                    direction text not null check (direction in ('entry', 'exit')),
                    reid_score real,
                    reid_decision text not null,
                    identity_confidence text not null,
                    detection_confidence real,
                    bbox_json text,
                    payload_json text not null,
                    foreign key (visitor_id) references visitor_identities(visitor_id)
                );

                create index if not exists idx_visitor_sightings_business_date on visitor_sightings(business_date);
                """
            )
            _ensure_column(connection, "count_events", "visitor_id", "text")
            _ensure_column(connection, "count_events", "is_unique_entry", "integer not null default 0")
            _ensure_column(connection, "count_events", "reid_score", "real")
            _ensure_column(connection, "count_events", "reid_decision", "text")
            _ensure_column(connection, "count_events", "identity_confidence", "text")
            connection.execute(
                """
                update count_events
                set is_unique_entry = 1
                where direction = 'entry'
                    and reid_decision is null
                    and (visitor_id is null or visitor_id = '')
                    and is_unique_entry = 0
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


def _safe_float(value: Any) -> float | None:
    if isinstance(value, int | float):
        return float(value)
    return None


def _ensure_column(connection: sqlite3.Connection, table_name: str, column_name: str, definition: str) -> None:
    existing_columns = {
        row["name"]
        for row in connection.execute(f"pragma table_info({table_name})").fetchall()
    }
    if column_name in existing_columns:
        return

    connection.execute(f"alter table {table_name} add column {column_name} {definition}")
