from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
# from backend.routes.auth import auth_bp

load_dotenv()

logging.basicConfig(level=logging.DEBUG)

db = SQLAlchemy()
jwt = JWTManager()

def create_app(testing=False):
    app = Flask(__name__)

    # Default configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")
    
    # CORS configuration - APPLIED TO ALL ROUTES
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

    # Testing
    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Import and register blueprints
    # from backend.routes.auth import auth_bp
    # app.register_blueprint(auth_bp)
    
    # Your routes
    @app.route('/')
    def hello():
        return 'Hello World!'
    
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "Server is running"})
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)