from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import db, Report, User
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
        return jsonify({"error": "type and title required"}), 400

    report = Report(
        reporter_id=uid,
        type=rtype,
        title=title,
        description=description,
        latitude=lat,
        longitude=lon
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.serialize()), 201

# List reports with pagination and optional filtering by type/status
@reports_bp.route("/", methods=["GET"])
def list_reports():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    rtype = request.args.get("type")
    status = request.args.get("status")

    query = Report.query.order_by(Report.created_at.desc())
    if rtype:
        query = query.filter_by(type=rtype)
    if status:
        query = query.filter_by(status=status)

    total = query.count()
    reports = query.offset((page-1)*per_page).limit(per_page).all()
    pages = ceil(total / per_page) if per_page else 1

    return jsonify({
        "data": [r.serialize() for r in reports],
        "meta": {"page": page, "per_page": per_page, "total": total, "pages": pages}
    }), 200

# Update report (only allowed for creator and only while pending)
@reports_bp.route("/<int:report_id>", methods=["PUT"])
@jwt_required()
def update_report(report_id):
    uid = get_jwt_identity()
    report = Report.query.get_or_404(report_id)
    if report.reporter_id != uid:
        return jsonify({"error": "forbidden"}), 403
    if report.status != "pending":
        return jsonify({"error": "cannot edit non-pending report"}), 400

    data = request.get_json() or {}
    report.title = data.get("title", report.title)
    report.description = data.get("description", report.description)
    report.latitude = data.get("latitude", report.latitude)
    report.longitude = data.get("longitude", report.longitude)

    db.session.commit()
    return jsonify(report.serialize()), 200

# Delete report (only creator & only pending)
@reports_bp.route("/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    uid = get_jwt_identity()
    report = Report.query.get_or_404(report_id)
    if report.reporter_id != uid:
        return jsonify({"error": "forbidden"}), 403
    if report.status != "pending":
        return jsonify({"error": "cannot delete non-pending report"}), 400
    db.session.delete(report)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200
