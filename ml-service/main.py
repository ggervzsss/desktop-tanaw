import os

import uvicorn

from app.main import app


def main():
    port = int(os.environ.get("TANAW_ML_SERVICE_PORT", "8765"))
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=False)


if __name__ == "__main__":
    main()
