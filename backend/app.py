from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")

    # ✅ Enable CORS for frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}},
        supports_credentials=True
    )

    db.init_app(app)
    jwt.init_app(app)

    # Import & register blueprints
    from backend.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    @app.route("/")
    def home():
        return jsonify({"status": "running"})

    return app

app = create_app()
