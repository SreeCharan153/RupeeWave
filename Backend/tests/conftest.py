# tests/conftest.py
import os
os.environ["TESTING"] = "1"   # << set BEFORE importing main/app

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    return TestClient(app)
