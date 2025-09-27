from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
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

    # Register blueprints
    from backend.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    # Health check
    @app.route("/")
    def home():
        return jsonify({"status": "running"}), 200

    @app.route("/ping")
    def ping(): 
        return {"msg": "pong"}, 200

    return app

# For local runs (Render uses wsgi.py)
if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
