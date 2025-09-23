from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import db, Report, User

admin_bp = Blueprint("admin", __name__)

def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        uid = get_jwt_identity()
        user = User.query.get(uid)
        if not user or user.role != "admin":
            return jsonify({"error": "admin required"}), 403
        return fn(*args, **kwargs)
    return wrapper

# Admin can update status
@admin_bp.route("/report/<int:report_id>/status", methods=["PUT"])
@jwt_required()
@admin_required
def update_status(report_id):
    report = Report.query.get_or_404(report_id)
    data = request.get_json() or {}
    status = data.get("status")
    if status not in ("under_investigation", "rejected", "resolved"):
        return jsonify({"error": "invalid status"}), 400
    report.status = status
    db.session.commit()
    return jsonify(report.serialize()), 200
