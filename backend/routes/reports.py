from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.report import Report
from backend.models.user import User
from math import ceil

reports_bp = Blueprint("reports", __name__)

# Create report
@reports_bp.route("/", methods=["POST"])
@jwt_required()
def create_report():
    data = request.get_json() or {}
    rtype = data.get("type")
    title = data.get("title")
    description = data.get("description")
    lat = data.get("latitude")
    lon = data.get("longitude")
    uid = get_jwt_identity()

    if not rtype or not title:
        return jsonify({"error": "Missing type or title"}), 400

    try:
        report = Report(
            type=rtype,
            title=title,
            description=description,
            latitude=lat,
            longitude=lon,
            user_id=uid,
            status="pending"
        )
        db.session.add(report)
        db.session.commit()
        return jsonify(report.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Get all reports with pagination
@reports_bp.route("/", methods=["GET"])
def get_reports():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    
    reports = Report.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "reports": [r.to_dict() for r in reports.items],
        "total": reports.total,
        "pages": reports.pages,
        "current_page": page
    })

# Get single report
@reports_bp.route("/<int:report_id>", methods=["GET"])
def get_report(report_id):
    report = Report.query.get_or_404(report_id)
    return jsonify(report.to_dict())

# Update report
@reports_bp.route("/<int:report_id>", methods=["PUT"])
@jwt_required()
def update_report(report_id):
    report = Report.query.get_or_404(report_id)
    uid = get_jwt_identity()
    
    if report.user_id != uid:
        return jsonify({"error": "Not authorized"}), 403
    
    data = request.get_json() or {}
    if report.status != "pending":
        return jsonify({"error": "Can only update pending reports"}), 400
    
    # Update allowed fields
    if "title" in data:
        report.title = data["title"]
    if "description" in data:
        report.description = data["description"]
    if "latitude" in data:
        report.latitude = data["latitude"]
    if "longitude" in data:
        report.longitude = data["longitude"]
    
    db.session.commit()
    return jsonify(report.to_dict())

# Delete report
@reports_bp.route("/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    report = Report.query.get_or_404(report_id)
    uid = get_jwt_identity()
    
    if report.user_id != uid:
        return jsonify({"error": "Not authorized"}), 403
    
    if report.status != "pending":
        return jsonify({"error": "Can only delete pending reports"}), 400
    
    db.session.delete(report)
    db.session.commit()
    return jsonify({"message": "Report deleted"})
