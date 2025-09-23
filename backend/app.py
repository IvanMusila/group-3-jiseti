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
    app.config["JWT_SECRET_KEY"] = "super-secret"

    # Testing config
    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Authentication routes
    from backend.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    
    # Report routes (if they exist)
    try:
        from backend.routes.reports import reports_bp
        app.register_blueprint(reports_bp, url_prefix="/api/reports")
    except ImportError:
        pass

    return app
