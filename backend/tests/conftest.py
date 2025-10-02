import os
import shutil
import sys
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent
TEST_INSTANCE_PATH = ROOT_DIR / "test_instance"
TEST_INSTANCE_PATH.mkdir(exist_ok=True)

os.environ.setdefault("FLASK_INSTANCE_PATH", str(TEST_INSTANCE_PATH))

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app import create_app
from models import db


@pytest.fixture
def app():
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI='sqlite:///:memory:',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
        uploads_dir = TEST_INSTANCE_PATH / "uploads"
        if uploads_dir.exists():
            for entry in uploads_dir.iterdir():
                if entry.is_file():
                    entry.unlink()
                else:
                    shutil.rmtree(entry)


@pytest.fixture
def client(app):
    return app.test_client()
