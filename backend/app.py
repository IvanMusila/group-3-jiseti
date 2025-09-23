from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, migrate, jwt
import os
import logging

load_dotenv()

logging.basicConfig(level=logging.DEBUG)

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configurations
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('TEST_DATABASE_URL', os.getenv('DATABASE_URL'))
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-secret-key')

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Import models after db.init_app to avoid circular import
    from models import User, Report
    logging.debug(f"Models registered: {list(db.metadata.tables.keys())}")

    # Import and register blueprints
    try:
        from report import report_bp
        app.register_blueprint(report_bp)
        logging.debug("Report blueprint registered successfully")
    except ImportError as e:
        app.logger.warning(f"Report blueprint not registered: {e}")

    @app.route('/')
    def hello():
        return 'Hello World!'

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)