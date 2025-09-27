from flask import Flask, jsonify, request, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logging.basicConfig(level=logging.DEBUG)

db = SQLAlchemy()
jwt = JWTManager()

def create_app(testing=False):
    app = Flask(__name__)

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")
    
    # COMPREHENSIVE CORS configuration
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

    db.init_app(app)
    jwt.init_app(app)
    
    auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
    
    
    @auth_bp.route("/register", methods=["OPTIONS"])
    @auth_bp.route("/login", methods=["OPTIONS"])
    def handle_options():
        return jsonify({"status": "preflight ok"}), 200
    
    # AUTH ROUTES
    @auth_bp.route("/register", methods=["POST"])
    def register():
        try:
            data = request.get_json() or {}
            return jsonify({
                "access_token": "mock-register-token",
                "user": {
                    "id": 1,
                    "username": data.get('username', 'testuser'),
                    "email": data.get('email', 'test@example.com'),
                    "role": "user"
                }
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @auth_bp.route("/login", methods=["POST"])
    def login():
        try:
            data = request.get_json() or {}
            return jsonify({
                "access_token": "mock-login-token",
                "user": {
                    "id": 1,
                    "username": "testuser",
                    "email": data.get('email', 'test@example.com'),
                    "role": "user"
                }
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @auth_bp.route("/me", methods=["GET"])
    def me():
        return jsonify({
            "id": 1,
            "username": "testuser",
            "email": "test@example.com",
            "role": "user"
        }), 200

    app.register_blueprint(auth_bp)
    
    # Basic routes
    @app.route('/')
    def hello():
        return jsonify({"message": "Jiseti Backend API", "status": "running"})
    
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "Server is running"})
    
    # GLOBAL OPTIONS HANDLER (catch-all)
    @app.route('/', methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def global_options_handler(path=None):
        return jsonify({"status": "preflight ok"}), 200
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)