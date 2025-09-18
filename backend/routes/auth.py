from flask import Blueprint, request, jsonify
from backend.models import db, User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

# Signup route
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
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

    return jsonify({"message": "User created successfully"}), 201

# Login route
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        token = create_access_token(identity=user.id)
        return jsonify({
            "token": token,
            "user": {"id": user.id, "username": user.username}
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401
