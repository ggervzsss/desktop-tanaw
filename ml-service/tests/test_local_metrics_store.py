import tempfile
import unittest
from pathlib import Path

from app.storage.local_metrics_store import LocalMetricsStore


class LocalMetricsStoreTest(unittest.TestCase):
    def test_count_events_are_summarized_and_marked_submitted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = LocalMetricsStore(str(Path(directory)))
            store.append_count_event(_event("entry", entry=1, exit=0, occupancy=1))
            store.append_count_event(_event("exit", entry=1, exit=1, occupancy=0))

            summary = store.metrics_summary()
            self.assertEqual(summary["entries"], 1)
            self.assertEqual(summary["exits"], 1)
            self.assertEqual(summary["peak_occupancy"], 1)
            self.assertEqual(summary["unique_count"], 1)
            self.assertEqual(summary["unsubmitted_events"], 2)

            submission = store.record_report_submission("REP-001", "Current Period", "notes", {"source": "test"})
            self.assertEqual(submission["report_id"], "REP-001")
            self.assertEqual(submission["sync_status"], "pending_cloud_sync")
            self.assertEqual(store.metrics_summary()["unsubmitted_events"], 0)

    def test_unique_count_uses_identity_decision_fields(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = LocalMetricsStore(str(Path(directory)))
            store.append_count_event(_event("entry", entry=1, exit=0, occupancy=1, is_unique_entry=True))
            store.append_count_event(_event("exit", entry=1, exit=1, occupancy=0))
            store.append_count_event(_event("entry", entry=2, exit=1, occupancy=1, is_unique_entry=False))

            summary = store.metrics_summary()

            self.assertEqual(summary["entries"], 2)
            self.assertEqual(summary["exits"], 1)
            self.assertEqual(summary["unique_count"], 1)

    def test_expired_visitor_metadata_cleanup_preserves_count_events(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = LocalMetricsStore(str(Path(directory)))
            store.upsert_visitor_identity(
                visitor_id="visitor-1",
                business_date="2026-06-07",
                camera_id=1,
                embedding=b"\x00" * 8,
                embedding_dim=2,
                embedding_count=1,
                model_name="test",
                expires_at="2026-06-07T02:00:00+00:00",
                recorded_at="2026-06-07T01:00:00+00:00",
            )
            store.append_visitor_sighting(
                {
                    "visitor_id": "visitor-1",
                    "business_date": "2026-06-07",
                    "camera_id": 1,
                    "track_id": 99,
                    "direction": "entry",
                    "reid_decision": "new",
                    "identity_confidence": "high",
                },
                "2026-06-07T01:05:00+00:00",
            )
            store.append_count_event(_event("entry", entry=1, exit=0, occupancy=1, is_unique_entry=True))

            deleted_count = store.cleanup_expired_visitor_metadata("2026-06-07T03:00:00+00:00")

            self.assertEqual(deleted_count, 1)
            self.assertEqual(store.load_active_visitor_identities("2026-06-07", "2026-06-07T03:00:00+00:00"), [])
            self.assertEqual(store.metrics_summary()["total_events"], 1)


def _event(direction: str, entry: int, exit: int, occupancy: int, is_unique_entry: bool | None = None) -> dict:
    payload = {
        "camera_id": 1,
        "camera_name": "Test Camera",
        "counts": {
            "entry": entry,
            "exit": exit,
            "occupancy": occupancy,
        },
        "direction": direction,
        "track_id": 99,
    }
    if is_unique_entry is not None:
        payload["is_unique_entry"] = is_unique_entry
    return {
        **payload,
    }


if __name__ == "__main__":
    unittest.main()
