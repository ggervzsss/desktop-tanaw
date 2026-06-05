import time

import cv2


def resolve_capture_source(stream_url: str) -> str | int:
    normalized = stream_url.strip()
    if normalized.isdigit():
        return int(normalized)
    return normalized


def open_capture(stream_url: str):
    source = resolve_capture_source(stream_url)
    capture = cv2.VideoCapture(source)
    capture.set(cv2.CAP_PROP_BUFFERSIZE, 2)

    if hasattr(cv2, "CAP_PROP_OPEN_TIMEOUT_MSEC"):
        capture.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)
    if hasattr(cv2, "CAP_PROP_READ_TIMEOUT_MSEC"):
        capture.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)

    return capture


def validate_stream(stream_url: str, attempts: int = 8) -> tuple[bool, str]:
    capture = open_capture(stream_url)
    try:
        if not capture.isOpened():
            return False, "Camera stream could not be opened."

        for _ in range(attempts):
            ok, frame = capture.read()
            if ok and frame is not None:
                return True, "Camera stream is reachable."
            time.sleep(0.15)

        return False, "Camera stream opened, but no frames were readable."
    finally:
        capture.release()

