import sys
from pathlib import Path

# Make the backend package importable
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402,F401