from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()

def create_app(testing=False):
    app = Flask(__name__)

    # Default config
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "super-secret"  # change in production

    # Testing config
    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"  # in-memory DB
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # tokens never expire in tests

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Import and register blueprints
    from backend.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app