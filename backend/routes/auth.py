from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

# ✅ Preflight OPTIONS handler
@auth_bp.route("/register", methods=["OPTIONS"])
@auth_bp.route("/login", methods=["OPTIONS"])
def handle_options():
    return jsonify({"status": "ok"}), 200

@auth_bp.route("/register", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201
