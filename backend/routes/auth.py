from flask import Blueprint, request, jsonify
<<<<<<< HEAD
from backend.models import db, User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

# Signup route
=======
from backend.app import db
from backend.models.user import User
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

auth_bp = Blueprint("auth", __name__)

>>>>>>> main
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

<<<<<<< HEAD
    return jsonify({"message": "User created successfully"}), 201

# Login route
=======
    return jsonify({"msg": "User created successfully"}), 201

>>>>>>> main
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

<<<<<<< HEAD
    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        token = create_access_token(identity=user.id)
        return jsonify({
            "token": token,
            "user": {"id": user.id, "username": user.username}
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401
=======
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        # Convert to string for JWT compatibility
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "msg": "Login successful",
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    try:
        current_user_id = get_jwt_identity()
        # Convert back to integer for database query
        user = User.query.get(int(current_user_id))

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user identity"}), 422
>>>>>>> main
