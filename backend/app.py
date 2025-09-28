from flask import Flask, jsonify, request, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
import os
import re

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Config - Fix database URL for Python 3.13 compatibility
    database_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
    
    # If using PostgreSQL, force psycopg3
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")

    # ✅ CORS applied globally for all API routes
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}},
        supports_credentials=True
    )

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)

    # CREATE AUTH BLUEPRINT DIRECTLY (no import needed)
    auth_bp = Blueprint("auth", __name__)
    
    # Simple User model
    class User(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(80), unique=True, nullable=False)
        email = db.Column(db.String(120), unique=True, nullable=False)
        password = db.Column(db.String(120), nullable=False)
        role = db.Column(db.String(20), default='user')
        
        def to_dict(self):
            return {
                "id": self.id,
                "username": self.username,
                "email": self.email,
                "role": self.role
            }
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # OPTIONS handlers for CORS preflight
    @auth_bp.route("/register", methods=["OPTIONS"])
    @auth_bp.route("/login", methods=["OPTIONS"])
    def handle_options():
        return jsonify({"status": "preflight ok"}), 200
    
    # Auth routes
    @auth_bp.route("/register", methods=["POST"])
    def register():
        try:
            data = request.get_json() or {}
            
            # Validate required fields
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"Missing field: {field}"}), 400
            
            # Check if email already exists
            if User.query.filter_by(email=data['email']).first():
                return jsonify({"error": "Email already registered"}), 400
            
            # Create new user
            user = User(
                username=data['username'],
                email=data['email'],
                password=data['password']  # In production, hash this!
            )
            
            db.session.add(user)
            db.session.commit()
            
            # Create access token
            access_token = create_access_token(identity=str(user.id))
            
            return jsonify({
                "access_token": access_token,
                "user": user.to_dict(),
                "message": "Registration successful"
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Internal server error"}), 500
    
    @auth_bp.route("/login", methods=["POST"])
    def login():
        try:
            data = request.get_json() or {}
            
            if not data.get('email') or not data.get('password'):
                return jsonify({"error": "Missing email or password"}), 400
            
            user = User.query.filter_by(email=data['email']).first()
            if not user or user.password != data['password']:
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Create access token
            access_token = create_access_token(identity=str(user.id))
            
            return jsonify({
                "access_token": access_token,
                "user": user.to_dict(),
                "message": "Login successful"
            }), 200
            
        except Exception as e:
            return jsonify({"error": "Internal server error"}), 500
    
    @auth_bp.route("/me", methods=["GET"])
    def me():
        return jsonify({
            "id": 1,
            "username": "testuser",
            "email": "test@example.com",
            "role": "user"
        }), 200

    # Register the blueprint
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    # Health check
    @app.route("/")
    def home():
        return jsonify({"status": "running", "message": "Jiseti Backend API"}), 200

    @app.route("/ping")
    def ping(): 
        return {"msg": "pong"}, 200
    
    # Global OPTIONS handler for all routes
    @app.route('/', methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path=None):
        return jsonify({"status": "preflight ok"}), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)