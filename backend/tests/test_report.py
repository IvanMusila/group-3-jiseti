from typing import Generator
import pytest
from flask import Flask
from flask.testing import FlaskClient
from app import create_app, db
from models import Report, Status, ReportType, User
from flask_jwt_extended import create_access_token
import logging

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@pytest.fixture
def app() -> Generator[Flask, None, None]:
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    with app.app_context():
        # Debug: Check metadata before creating tables
        logger.debug(f"Metadata tables before create_all: {list(db.metadata.tables.keys())}")
        db.drop_all()  # Ensure clean state
        db.create_all()  # Create all tables
        # Debug: Verify tables exist
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        logger.debug(f"Tables created: {tables}")
        assert 'users' in tables, "users table not created"
        assert 'reports' in tables, "reports table not created"
        # Create a test user in the same session
        user = User(username='testuser', email='test@example.com', password_hash='hash', role='user')
        db.session.add(user)
        db.session.commit()
        logger.debug(f"Created test user: {user.id}")
        yield app, user  # Yield both app and user
        db.drop_all()

@pytest.fixture
def client(app: Flask) -> FlaskClient:
    app, _ = app  # Unpack the app from the tuple
    return app.test_client()

@pytest.fixture
def user(app: Flask) -> User:
    _, user = app  # Unpack the user from the tuple
    return user

@pytest.fixture
def token(user: User) -> str:
    token = create_access_token(identity=str(user.id))  # Convert user.id to string
    logger.debug(f"Generated JWT token: {token}")
    return token

def test_create_report(client: FlaskClient, user: User, token: str) -> None:
    headers = {'Authorization': f'Bearer {token}'}
    data = {
        'type': 'red-flag',
        'title': 'Corruption Case',
        'description': 'Suspicious activity at town hall',
        'location': '12.34,56.78'
    }
    response = client.post('/reports/', json=data, headers=headers)
    if response.status_code != 201:
        logger.error(f"test_create_report failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.status_code == 201
    assert response.json is not None
    assert response.json['title'] == 'Corruption Case'
    assert response.json['status'] == 'pending'

def test_create_report_invalid_type(client: FlaskClient, user: User, token: str) -> None:
    headers = {'Authorization': f'Bearer {token}'}
    data = {
        'type': 'invalid',
        'title': 'Test',
        'description': 'Test',
        'location': '0,0'
    }
    response = client.post('/reports/', json=data, headers=headers)
    if response.status_code != 400:
        logger.error(f"test_create_report_invalid_type failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.status_code == 400
    assert response.json is not None
    assert 'Invalid type' in response.json['error']

def test_list_reports(client: FlaskClient, user: User, token: str) -> None:
    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/reports/', json={
        'type': 'intervention',
        'title': 'Bad Road',
        'description': 'Potholes on Main St',
        'location': '10.0,20.0'
    }, headers=headers)
    if response.status_code != 201:
        logger.error(f"test_list_reports POST failed with status {response.status_code}, response: {response.data.decode()}")
    response = client.get('/reports/?page=1&per_page=5')
    if response.status_code != 200:
        logger.error(f"test_list_reports GET failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.status_code == 200
    assert response.json is not None
    assert len(response.json['reports']) == 1
    assert response.json['total'] == 1

def test_update_report(client: FlaskClient, user: User, token: str) -> None:
    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/reports/', json={
        'type': 'red-flag',
        'title': 'Test',
        'description': 'Test desc',
        'location': '0,0'
    }, headers=headers)
    if response.status_code != 201:
        logger.error(f"test_update_report POST failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.json is not None
    report_id = response.json['id']
    response = client.put(f'/reports/{report_id}', json={'title': 'Updated'}, headers=headers)
    if response.status_code != 200:
        logger.error(f"test_update_report PUT failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.status_code == 200
    assert response.json is not None
    assert response.json['title'] == 'Updated'

def test_update_report_unauthorized(client: FlaskClient, user: User, token: str) -> None:
    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/reports/', json={
        'type': 'red-flag',
        'title': 'Test',
        'description': 'Test',
        'location': '0,0'
    }, headers=headers)
    if response.status_code != 201:
        logger.error(f"test_update_report_unauthorized POST failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.json is not None
    report_id = response.json['id']
    with client.application.app_context():
        report = db.session.get(Report, report_id)  # Use db.session.get
        report.status = 'resolved'
        db.session.commit()
    response = client.put(f'/reports/{report_id}', json={'title': 'Fail'}, headers=headers)
    if response.status_code != 403:
        logger.error(f"test_update_report_unauthorized PUT failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.status_code == 403

def test_delete_report(client: FlaskClient, user: User, token: str) -> None:
    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/reports/', json={
        'type': 'red-flag',
        'title': 'Test',
        'description': 'Test',
        'location': '0,0'
    }, headers=headers)
    if response.status_code != 201:
        logger.error(f"test_delete_report POST failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.json is not None
    report_id = response.json['id']
    response = client.delete(f'/reports/{report_id}', headers=headers)
    if response.status_code != 200:
        logger.error(f"test_delete_report DELETE failed with status {response.status_code}, response: {response.data.decode()}")
    assert response.status_code == 200
    with client.application.app_context():
        assert db.session.get(Report, report_id) is None  # Use db.session.get