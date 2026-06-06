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
            self.assertEqual(summary["unsubmitted_events"], 2)

            submission = store.record_report_submission("REP-001", "Current Period", "notes", {"source": "test"})
            self.assertEqual(submission["report_id"], "REP-001")
            self.assertEqual(submission["sync_status"], "pending_cloud_sync")
            self.assertEqual(store.metrics_summary()["unsubmitted_events"], 0)


def _event(direction: str, entry: int, exit: int, occupancy: int) -> dict:
    return {
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


if __name__ == "__main__":
    unittest.main()
