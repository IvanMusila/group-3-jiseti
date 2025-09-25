from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, migrate, jwt
import os
import logging

load_dotenv()

logging.basicConfig(level=logging.DEBUG)

db = SQLAlchemy()
jwt = JWTManager()

def create_app(testing=False):
    app = Flask(__name__)

    # Default configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "super-secret"  # change in production

    # Testing
    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"  # in-memory DB
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # tokens never expire in tests

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Your routes and configurations
    @app.route('/')
    def hello():
        return 'Hello World!'
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
