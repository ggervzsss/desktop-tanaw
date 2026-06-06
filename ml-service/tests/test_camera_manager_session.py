import tempfile
import threading
import unittest

import numpy as np

from app.camera.camera_manager import CameraProcessingManager, ProcessingSession
from app.config.camera_config import CameraStartRequest
from app.storage.session_store import SessionStore


class CameraProcessingManagerSessionTest(unittest.TestCase):
    def test_stale_session_cannot_publish_raw_frame(self) -> None:
        manager = CameraProcessingManager()
        current_session = _session(1)
        stale_session = _session(2)

        with manager._lock:
            manager._active_session = current_session

        frame = np.zeros((8, 8, 3), dtype=np.uint8)
        manager._publish_raw_frame(stale_session, frame)

        self.assertIsNone(manager._latest_raw_frame)
        self.assertEqual(manager._latest_raw_frame_id, 0)

        manager._publish_raw_frame(current_session, frame)

        self.assertIs(manager._latest_raw_frame, frame)
        self.assertEqual(manager._latest_raw_frame_id, 1)

    def test_stale_session_cannot_replace_current_error_state(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            manager = CameraProcessingManager()
            manager._session_store = SessionStore(directory)
            current_session = _session(1)
            stale_session = _session(2)

            with manager._lock:
                manager._config = current_session.config
                manager._active_session = current_session

            manager._set_session_error(stale_session, "stale failure")

            self.assertIs(manager._active_session, current_session)
            self.assertNotEqual(manager._state.status, "error")

            manager._set_session_error(current_session, "current failure")

            self.assertIsNone(manager._active_session)
            self.assertEqual(manager._state.status, "error")
            self.assertEqual(manager._state.error, "current failure")
            self.assertTrue(current_session.stop_event.is_set())


def _session(session_id: int) -> ProcessingSession:
    return ProcessingSession(
        session_id=session_id,
        config=CameraStartRequest(stream_url="000"),
        stop_event=threading.Event(),
    )


if __name__ == "__main__":
    unittest.main()
