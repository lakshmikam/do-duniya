"""Isolate storage and disable real credentials before any app module is imported."""

import os
from pathlib import Path
import tempfile

os.environ["DO_DUNIYA_DB"] = str(
    Path(tempfile.mkdtemp(prefix="do-duniya-tests-")) / "game.sqlite3"
)
for key in [
    "GEMINI_API_KEY",
    "GNANI_API_KEY",
    "GNANI_PRISMA_KEY",
    "GNANI_TIMBRE_KEY",
    "TEST_ACCESS_CODE",
]:
    os.environ[key] = ""
