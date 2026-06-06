import tempfile
import unittest
from pathlib import Path

from app.detection.yolo_detector import YoloPersonTracker


class YoloPersonTrackerTest(unittest.TestCase):
    def test_default_model_path_resolves_to_bundled_models_directory(self) -> None:
        tracker = YoloPersonTracker()

        model_path = Path(tracker._resolve_model_path())

        self.assertEqual(model_path.name, "yolov8n.pt")
        self.assertEqual(model_path.parent.name, "models")
        self.assertTrue(model_path.exists())

    def test_missing_absolute_model_path_raises_clear_error(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            missing_model = Path(directory) / "missing.pt"
            tracker = YoloPersonTracker(model_path=str(missing_model))

            with self.assertRaisesRegex(FileNotFoundError, "YOLO model file was not found"):
                tracker._resolve_model_path()


if __name__ == "__main__":
    unittest.main()
