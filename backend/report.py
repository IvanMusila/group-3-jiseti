from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Report, Status, ReportType, User
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

report_bp = Blueprint('reports', __name__, url_prefix='/reports')

@report_bp.route('/', methods=['POST'])
@jwt_required()
def create_report():
    logger.debug(f"Received POST /reports/ with headers: {request.headers}")
    data = request.get_json()
    logger.debug(f"Parsed JSON data: {data}")
    if not data or not all(k in data for k in ['type', 'title', 'description', 'location']):
        logger.error("Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate report type
    valid_types = [e.value for e in ReportType]
    logger.debug(f"Valid report types: {valid_types}")
    if data['type'] not in valid_types:
        logger.error(f"Invalid type: {data['type']}")
        return jsonify({'error': 'Invalid type (must be red-flag or intervention)'}), 400

    current_user_id = get_jwt_identity()
    logger.debug(f"Current user ID from JWT: {current_user_id}")
    user = db.session.get(User, int(current_user_id))  # Use db.session.get
    if not user:
        logger.error(f"User not found for ID: {current_user_id}")
        return jsonify({'error': 'User not found'}), 404

    try:
        report = Report(
            type=data['type'],
            title=data['title'],
            description=data['description'],
            location=data['location'],
            created_by=int(current_user_id)
        )
        db.session.add(report)
        db.session.commit()
        logger.debug(f"Created report: {report.to_dict()}")
        return jsonify(report.to_dict()), 201
    except Exception as e:
        logger.error(f"Error creating report: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Failed to create report: {str(e)}'}), 422

@report_bp.route('/', methods=['GET'])
def list_reports():
    logger.debug(f"Received GET /reports/ with args: {request.args}")
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    reports = Report.query.paginate(page=page, per_page=per_page, error_out=False)
    logger.debug(f"Retrieved {reports.total} reports")
    return jsonify({
        'reports': [r.to_dict() for r in reports.items],
        'page': page,
        'per_page': per_page,
        'total': reports.total,
        'pages': reports.pages
    })

@report_bp.route('/<int:report_id>', methods=['PUT'])
@jwt_required()
def update_report(report_id):
    logger.debug(f"Received PUT /reports/{report_id} with headers: {request.headers}")
    report = db.session.get(Report, report_id)  # Use db.session.get
    if not report:
        logger.error(f"Report not found for ID: {report_id}")
        return jsonify({'error': 'Report not found'}), 404

    current_user_id = int(get_jwt_identity())
    logger.debug(f"Current user ID: {current_user_id}, Report created by: {report.created_by}")
    
    if report.created_by != current_user_id or report.status != Status.PENDING.value:
        logger.error("Unauthorized or report not editable")
        return jsonify({'error': 'Unauthorized or report not editable'}), 403

    data = request.get_json() or {}
    if 'title' in data:
        report.title = data['title']
    if 'description' in data:
        report.description = data['description']
    if 'location' in data:
        report.location = data['location']

    db.session.commit()
    logger.debug(f"Updated report: {report.to_dict()}")
    return jsonify(report.to_dict()), 200

@report_bp.route('/<int:report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    logger.debug(f"Received DELETE /reports/{report_id} with headers: {request.headers}")
    report = db.session.get(Report, report_id)  # Use db.session.get
    if not report:
        logger.error(f"Report not found for ID: {report_id}")
        return jsonify({'error': 'Report not found'}), 404

    current_user_id = int(get_jwt_identity())
    logger.debug(f"Current user ID: {current_user_id}, Report created by: {report.created_by}")
    
    if report.created_by != current_user_id or report.status != Status.PENDING.value:
        logger.error("Unauthorized or report not deletable")
        return jsonify({'error': 'Unauthorized or report not deletable'}), 403

    db.session.delete(report)
    db.session.commit()
    logger.debug(f"Deleted report ID: {report_id}")
    return jsonify({'message': 'Report deleted'}), 200