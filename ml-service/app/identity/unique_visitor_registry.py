from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from typing import Any
from uuid import uuid4
from zoneinfo import ZoneInfo

import numpy as np

from app.storage.session_store import SessionStore


@dataclass(frozen=True)
class VisitorDecision:
    visitor_id: str | None
    is_unique_entry: bool
    reid_score: float | None
    reid_decision: str
    identity_confidence: str
    business_date: str

    def as_event_fields(self) -> dict[str, Any]:
        return {
            "visitor_id": self.visitor_id,
            "is_unique_entry": self.is_unique_entry,
            "reid_score": self.reid_score,
            "reid_decision": self.reid_decision,
            "identity_confidence": self.identity_confidence,
            "business_date": self.business_date,
        }


@dataclass
class VisitorIdentity:
    visitor_id: str
    business_date: str
    camera_id: int | None
    embedding: np.ndarray
    embedding_count: int
    model_name: str
    expires_at: str


class UniqueVisitorRegistry:
    def __init__(
        self,
        session_store: SessionStore,
        model_name: str = "person_reid_onnx",
        timezone_name: str = "Asia/Manila",
        retention_grace_hours: int = 2,
        strong_match_threshold: float = 0.72,
        new_visitor_threshold: float = 0.60,
        top_match_margin: float = 0.05,
    ) -> None:
        self._session_store = session_store
        self.model_name = model_name
        self.timezone = ZoneInfo(timezone_name)
        self.retention_grace_hours = retention_grace_hours
        self.strong_match_threshold = strong_match_threshold
        self.new_visitor_threshold = new_visitor_threshold
        self.top_match_margin = top_match_margin
        self._business_date: str | None = None
        self._camera_id: int | None = None
        self._gallery: list[VisitorIdentity] = []
        self._track_visitors: dict[int, str] = {}
        self._last_cleanup_at: str | None = None

    def prepare(self, camera_id: int | None, now: datetime | None = None) -> None:
        now = now or datetime.now(timezone.utc)
        self.cleanup_expired(now)
        business_date = self.business_date_for(now)
        if business_date == self._business_date and camera_id == self._camera_id:
            return

        self._business_date = business_date
        self._camera_id = camera_id
        self._track_visitors.clear()
        self._gallery = self._load_gallery(business_date, camera_id, now)

    def reset_session_tracks(self) -> None:
        self._track_visitors.clear()

    def remap_session_track(self, previous_track_id: int, target_track_id: int) -> None:
        visitor_id = self._track_visitors.pop(previous_track_id, None)
        if visitor_id is not None and target_track_id not in self._track_visitors:
            self._track_visitors[target_track_id] = visitor_id

    def visitor_id_for_track(self, track_id: int) -> str | None:
        return self._track_visitors.get(track_id)

    def cleanup_expired(self, now: datetime | None = None) -> int:
        now = now or datetime.now(timezone.utc)
        deleted_count = self._session_store.cleanup_expired_visitor_metadata(now.isoformat())
        self._last_cleanup_at = now.isoformat()
        if deleted_count and self._business_date is not None:
            self._gallery = self._load_gallery(self._business_date, self._camera_id, now)
        return deleted_count

    def status(self) -> dict[str, int | str | None]:
        return {
            "reid_gallery_size": len(self._gallery),
            "reid_business_date": self._business_date,
            "reid_last_cleanup_at": self._last_cleanup_at,
        }

    def resolve_entry(
        self,
        *,
        track_id: int,
        camera_id: int | None,
        embedding: np.ndarray | None,
        detection_confidence: float | None,
        bbox: tuple[int, int, int, int] | None,
        now: datetime | None = None,
    ) -> VisitorDecision:
        now = now or datetime.now(timezone.utc)
        self.prepare(camera_id, now)
        business_date = self.business_date_for(now)

        if track_id in self._track_visitors:
            visitor_id = self._track_visitors[track_id]
            decision = VisitorDecision(
                visitor_id=visitor_id,
                is_unique_entry=False,
                reid_score=1.0,
                reid_decision="track_existing",
                identity_confidence="high",
                business_date=business_date,
            )
            self._persist_sighting(decision, track_id, camera_id, detection_confidence, bbox, now)
            return decision

        if embedding is None:
            return VisitorDecision(
                visitor_id=None,
                is_unique_entry=True,
                reid_score=None,
                reid_decision="degraded_no_embedding",
                identity_confidence="degraded",
                business_date=business_date,
            )

        normalized = _normalize_embedding(embedding)
        if normalized is None:
            return VisitorDecision(
                visitor_id=None,
                is_unique_entry=True,
                reid_score=None,
                reid_decision="degraded_invalid_embedding",
                identity_confidence="degraded",
                business_date=business_date,
            )

        match, score, margin = self._best_match(normalized)
        if match is not None and score >= self.strong_match_threshold and margin >= self.top_match_margin:
            self._track_visitors[track_id] = match.visitor_id
            self._update_identity(match, normalized, now)
            decision = VisitorDecision(
                visitor_id=match.visitor_id,
                is_unique_entry=False,
                reid_score=score,
                reid_decision="matched_existing",
                identity_confidence="high",
                business_date=business_date,
            )
            self._persist_sighting(decision, track_id, camera_id, detection_confidence, bbox, now)
            return decision

        visitor_id = str(uuid4())
        decision_name = "new"
        confidence = "high"
        if score is not None and score >= self.new_visitor_threshold:
            decision_name = "ambiguous_new"
            confidence = "low"

        identity = VisitorIdentity(
            visitor_id=visitor_id,
            business_date=business_date,
            camera_id=camera_id,
            embedding=normalized,
            embedding_count=1,
            model_name=self.model_name,
            expires_at=self.expires_at_for(now).isoformat(),
        )
        self._gallery.append(identity)
        self._track_visitors[track_id] = visitor_id
        self._persist_identity(identity, now)
        decision = VisitorDecision(
            visitor_id=visitor_id,
            is_unique_entry=True,
            reid_score=score,
            reid_decision=decision_name,
            identity_confidence=confidence,
            business_date=business_date,
        )
        self._persist_sighting(decision, track_id, camera_id, detection_confidence, bbox, now)
        return decision

    def business_date_for(self, now: datetime) -> str:
        return now.astimezone(self.timezone).date().isoformat()

    def expires_at_for(self, now: datetime) -> datetime:
        local_now = now.astimezone(self.timezone)
        end_of_day = datetime.combine(local_now.date(), time.max, tzinfo=self.timezone)
        return (end_of_day + timedelta(hours=self.retention_grace_hours)).astimezone(timezone.utc)

    def _load_gallery(self, business_date: str, camera_id: int | None, now: datetime) -> list[VisitorIdentity]:
        rows = self._session_store.load_active_visitor_identities(business_date, now.isoformat())
        gallery: list[VisitorIdentity] = []
        for row in rows:
            if row.get("model_name") != self.model_name:
                continue
            row_camera_id = row.get("camera_id")
            if camera_id is not None and row_camera_id != camera_id:
                continue
            if camera_id is None and row_camera_id is not None:
                continue

            embedding = np.frombuffer(row["representative_embedding"], dtype=np.float32)
            expected_dim = int(row["embedding_dim"])
            if embedding.size != expected_dim:
                continue
            normalized = _normalize_embedding(embedding)
            if normalized is None:
                continue
            gallery.append(
                VisitorIdentity(
                    visitor_id=row["visitor_id"],
                    business_date=row["business_date"],
                    camera_id=row_camera_id,
                    embedding=normalized,
                    embedding_count=int(row["embedding_count"]),
                    model_name=row["model_name"],
                    expires_at=row["expires_at"],
                )
            )
        return gallery

    def _best_match(self, embedding: np.ndarray) -> tuple[VisitorIdentity | None, float | None, float]:
        if not self._gallery:
            return None, None, 1.0

        gallery_embeddings = np.stack([identity.embedding for identity in self._gallery]).astype(np.float32)
        scores = gallery_embeddings @ embedding.astype(np.float32)
        order = np.argsort(scores)[::-1]
        best_index = int(order[0])
        best_score = float(scores[best_index])
        second_score = float(scores[int(order[1])]) if len(order) > 1 else -1.0
        return self._gallery[best_index], best_score, best_score - second_score

    def _update_identity(self, identity: VisitorIdentity, embedding: np.ndarray, now: datetime) -> None:
        updated_count = identity.embedding_count + 1
        updated_embedding = _normalize_embedding((identity.embedding * identity.embedding_count + embedding) / updated_count)
        if updated_embedding is None:
            return

        identity.embedding = updated_embedding
        identity.embedding_count = updated_count
        identity.expires_at = self.expires_at_for(now).isoformat()
        self._persist_identity(identity, now)

    def _persist_identity(self, identity: VisitorIdentity, now: datetime) -> None:
        self._session_store.upsert_visitor_identity(
            visitor_id=identity.visitor_id,
            business_date=identity.business_date,
            camera_id=identity.camera_id,
            embedding=identity.embedding.astype(np.float32).tobytes(),
            embedding_dim=int(identity.embedding.size),
            embedding_count=identity.embedding_count,
            model_name=identity.model_name,
            expires_at=identity.expires_at,
            recorded_at=now.isoformat(),
        )

    def _persist_sighting(
        self,
        decision: VisitorDecision,
        track_id: int,
        camera_id: int | None,
        detection_confidence: float | None,
        bbox: tuple[int, int, int, int] | None,
        now: datetime,
    ) -> None:
        if decision.visitor_id is None:
            return

        self._session_store.append_visitor_sighting(
            {
                "visitor_id": decision.visitor_id,
                "business_date": decision.business_date,
                "camera_id": camera_id,
                "track_id": track_id,
                "direction": "entry",
                "reid_score": decision.reid_score,
                "reid_decision": decision.reid_decision,
                "identity_confidence": decision.identity_confidence,
                "detection_confidence": detection_confidence,
                "bbox": bbox,
            },
            now.isoformat(),
        )


def _normalize_embedding(embedding: np.ndarray) -> np.ndarray | None:
    normalized = np.asarray(embedding, dtype=np.float32).reshape(-1)
    norm = float(np.linalg.norm(normalized))
    if norm <= 1e-9:
        return None
    return (normalized / norm).astype(np.float32)
