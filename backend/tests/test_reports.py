import json
import os
from io import BytesIO

from models import db, Report, ReportMedia


def register(client, username, email, password='secret123'):
    response = client.post(
        '/api/v1/auth/register',
        json={'username': username, 'email': email, 'password': password}
    )
    assert response.status_code == 201, response.get_json()
    payload = response.get_json()
    return payload['access_token'], payload['user']['id']


def auth_header(token):
    return {'Authorization': f'Bearer {token}'}


def create_sample_report(client, token, title='Flooded road'):
    response = client.post(
        '/api/v1/reports',
        json={
            'title': title,
            'description': 'Severe flooding blocking access',
            'location': 'Downtown',
            'type': 'infrastructure'
        },
        headers=auth_header(token)
    )
    assert response.status_code == 201, response.get_json()
    return response.get_json()


def create_report_with_attachment(client, token, filename='evidence.txt'):
    response = client.post(
        '/api/v1/reports',
        data={
            'title': 'Report with attachment',
            'description': 'Includes supporting media',
            'location': 'Downtown',
            'type': 'infrastructure',
            'media': (BytesIO(b'Attachment content'), filename)
        },
        content_type='multipart/form-data',
        headers=auth_header(token)
    )
    assert response.status_code == 201, response.get_json()
    return response.get_json()


def test_owner_can_update_pending_report(client, app):
    token, _ = register(client, 'alice', 'alice@example.com')
    report = create_sample_report(client, token)

    update_response = client.put(
        f"/api/v1/reports/{report['id']}",
        json={'title': 'Updated title', 'description': 'Updated description'},
        headers=auth_header(token)
    )

    assert update_response.status_code == 200
    data = update_response.get_json()
    assert data['title'] == 'Updated title'
    assert data['description'] == 'Updated description'


def test_non_owner_cannot_update_report(client, app):
    owner_token, _ = register(client, 'bob', 'bob@example.com')
    stranger_token, _ = register(client, 'carol', 'carol@example.com')
    report = create_sample_report(client, owner_token, title='Unsafe bridge')

    response = client.put(
        f"/api/v1/reports/{report['id']}",
        json={'title': 'I should not update this'},
        headers=auth_header(stranger_token)
    )

    assert response.status_code == 403
    assert response.get_json()['message'] == 'You do not have permission to modify this report'


def test_owner_cannot_update_non_pending_report(client, app):
    token, _ = register(client, 'dave', 'dave@example.com')
    report = create_sample_report(client, token, title='Potholes everywhere')

    with app.app_context():
        stored_report = Report.query.get(report['id'])
        stored_report.status = 'resolved'
        db.session.commit()

    response = client.put(
        f"/api/v1/reports/{report['id']}",
        json={'description': 'Trying to update after resolution'},
        headers=auth_header(token)
    )

    assert response.status_code == 403
    assert response.get_json()['message'] == 'Only pending reports can be modified'


def test_non_owner_cannot_delete_report(client, app):
    owner_token, _ = register(client, 'erin', 'erin@example.com')
    stranger_token, _ = register(client, 'frank', 'frank@example.com')
    report = create_sample_report(client, owner_token, title='Illegal dumping')

    response = client.delete(
        f"/api/v1/reports/{report['id']}",
        headers=auth_header(stranger_token)
    )

    assert response.status_code == 403
    assert response.get_json()['message'] == 'You do not have permission to delete this report'


def test_owner_cannot_delete_non_pending_report(client, app):
    token, _ = register(client, 'gina', 'gina@example.com')
    report = create_sample_report(client, token, title='Broken street lights')

    with app.app_context():
        stored_report = Report.query.get(report['id'])
        stored_report.status = 'under-investigation'
        db.session.commit()

    response = client.delete(
        f"/api/v1/reports/{report['id']}",
        headers=auth_header(token)
    )

    assert response.status_code == 403
    assert response.get_json()['message'] == 'Only pending reports can be deleted'


def test_owner_can_add_media_when_updating_pending_report(client, app):
    token, _ = register(client, 'hazel', 'hazel@example.com')
    report = create_sample_report(client, token)

    update_response = client.put(
        f"/api/v1/reports/{report['id']}",
        data={
            'media': (BytesIO(b'Fresh evidence'), 'evidence.png'),
        },
        content_type='multipart/form-data',
        headers=auth_header(token)
    )

    assert update_response.status_code == 200
    payload = update_response.get_json()
    assert len(payload.get('media', [])) == 1
    stored_media = ReportMedia.query.filter_by(report_id=report['id']).all()
    assert len(stored_media) == 1


def test_owner_can_remove_existing_media(client, app):
    token, _ = register(client, 'iris', 'iris@example.com')
    report = create_report_with_attachment(client, token, filename='proof.jpg')
    media = report.get('media', [])
    assert len(media) == 1

    media_id = media[0]['id']
    response = client.put(
        f"/api/v1/reports/{report['id']}",
        json={'remove_media_ids': [media_id]},
        headers=auth_header(token)
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload.get('media') == []

    with app.app_context():
        assert ReportMedia.query.filter_by(report_id=report['id']).count() == 0
        uploads_dir = os.environ.get('FLASK_INSTANCE_PATH')
        if uploads_dir:
            path = os.path.join(uploads_dir, 'uploads', media[0]['filename'])
            assert not os.path.exists(path)


def test_owner_can_replace_media_with_new_upload(client, app):
    token, _ = register(client, 'jade', 'jade@example.com')
    report = create_report_with_attachment(client, token, filename='accident.jpg')
    media = report.get('media', [])
    assert len(media) == 1

    media_id = media[0]['id']
    response = client.put(
        f"/api/v1/reports/{report['id']}",
        data={
            'title': 'Updated title',
            'description': 'Updated description',
            'location': 'City centre',
            'remove_media_ids': json.dumps([media_id]),
            'media': (BytesIO(b'New evidence image'), 'new-photo.png'),
        },
        content_type='multipart/form-data',
        headers=auth_header(token)
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['title'] == 'Updated title'
    assert len(payload.get('media', [])) == 1
    assert payload['media'][0]['original_filename'] == 'new-photo.png'

    with app.app_context():
        stored_media = ReportMedia.query.filter_by(report_id=report['id']).all()
        assert len(stored_media) == 1
        assert stored_media[0].original_filename == 'new-photo.png'


def test_get_reports_filters_by_status(client, app):
    token, _ = register(client, 'kyle', 'kyle@example.com')
    pending_report = create_sample_report(client, token, title='Pending case')
    resolved_report = create_sample_report(client, token, title='Resolved case')

    with app.app_context():
        stored = Report.query.get(resolved_report['id'])
        stored.status = 'resolved'
        db.session.commit()

    response = client.get('/api/v1/reports?status=resolved')
    assert response.status_code == 200
    payload = response.get_json()
    assert payload['totalItems'] == 1
    assert payload['items'][0]['id'] == resolved_report['id']


def test_get_reports_supports_search(client, app):
    token, _ = register(client, 'lisa', 'lisa@example.com')
    create_sample_report(client, token, title='Blocked drainage')
    target = create_sample_report(client, token, title='Collapsed bridge')

    response = client.get('/api/v1/reports?search=bridge')
    assert response.status_code == 200
    payload = response.get_json()
    assert payload['totalItems'] == 1
    assert payload['items'][0]['id'] == target['id']
