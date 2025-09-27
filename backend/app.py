from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
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
    
    # SIMPLIFIED CORS configuration - apply to all routes
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Import and register auth blueprint
    from backend.routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    # Basic routes
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