from flask import Flask, jsonify, request, Blueprint, current_app, send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import db, User, Report, ReportMedia
import os
import logging
import traceback
from uuid import uuid4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
    
    # If using PostgreSQL, force psycopg3
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")
    app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_UPLOAD_SIZE", 16 * 1024 * 1024))

    upload_folder = os.path.join(app.instance_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["ALLOWED_EXTENSIONS"] = {
        "png", "jpg", "jpeg", "gif", "webp",
        "mp4", "mov", "avi", "mkv", "webm",
        "mp3", "wav", "aac", "ogg",
        "pdf", "doc", "docx", "xls", "xlsx", "csv"
    }

    # ✅ CORS applied globally for all API routes
    CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "https://jiseti-frontend-w02k.onrender.com", 
                "http://127.0.0.1:3000", 
                "http://localhost:3000"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "supports_credentials": True
        }
    }
    )

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)

    def allowed_file(filename: str) -> bool:
        allowed_extensions = app.config.get("ALLOWED_EXTENSIONS", set())
        return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

    # CREATE AUTH BLUEPRINT
    auth_bp = Blueprint("auth", __name__)

    # Create tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("✅ Database tables created successfully")
        except Exception as e:
            logger.error(f"❌ Database creation error: {str(e)}")
            logger.error(traceback.format_exc())
    
    # OPTIONS handlers for CORS preflight
    @auth_bp.route("/register", methods=["OPTIONS"])
    @auth_bp.route("/login", methods=["OPTIONS"])
    def handle_options():
        return jsonify({"status": "preflight ok"}), 200
    
    
    @auth_bp.route("/register", methods=["POST"])
    def register():
        try:
            data = request.get_json() or {}
            logger.info(f"Registration attempt: {data}")

            # Validate required fields
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if not data.get(field):
                    logger.warning(f"Missing field: {field}")
                    return jsonify({"error": f"Missing field: {field}"}), 400
            
            # Check if email already exists
            existing_user_email = User.query.filter_by(email=data['email']).first()
            if existing_user_email:
                logger.warning(f"Email already registered: {data['email']}")
                return jsonify({"error": "Email address already registered"}), 400
            
            # Check if username already exists
            existing_user_username = User.query.filter_by(username=data['username']).first()
            if existing_user_username:
                logger.warning(f"Username already taken: {data['username']}")
                return jsonify({"error": "Username already taken"}), 400
            
            # Validate email format
            if '@' not in data['email'] or '.' not in data['email']:
                return jsonify({"error": "Please enter a valid email address"}), 400
            
            # Validate password strength
            if len(data['password']) < 6:
                return jsonify({"error": "Password must be at least 6 characters long"}), 400
            
            logger.info("Creating new user...")
            user = User(
                username=data['username'],
                email=data['email'],
                role='user'
            )

            logger.info("Setting password...")
            user.set_password(data['password'])

            logger.info("Saving to database...")
            db.session.add(user)
            db.session.commit()
            logger.info("User saved successfully")
            
            # Create access token
            access_token = create_access_token(identity=str(user.id))
            logger.info("Access token created")
            
            return jsonify({
                "access_token": access_token,
                "user": user.to_dict(),
                "message": "Registration successful"
            }), 201
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"REGISTRATION ERROR: {str(e)}")
            logger.error(f"ERROR TYPE: {type(e).__name__}")
            
            # Handle specific database errors
            if "already exists" in str(e):
                if "username" in str(e):
                    return jsonify({"error": "Username already taken"}), 400
                elif "email" in str(e):
                    return jsonify({"error": "Email address already registered"}), 400
            
            return jsonify({"error": "Registration failed. Please try again."}), 500

    @auth_bp.route("/login", methods=["POST"])
    def login():
        try:
            data = request.get_json() or {}
            logger.info(f"Login attempt for: {data.get('email')}")
            
            if not data.get('email') or not data.get('password'):
                return jsonify({"error": "Missing email or password"}), 400
            
            user = User.query.filter_by(email=data['email']).first()
            if not user or not user.check_password(data['password']):
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Create access token
            access_token = create_access_token(identity=str(user.id))
            
            return jsonify({
                "access_token": access_token,
                "user": user.to_dict(),
                "message": "Login successful"
            }), 200
            
        except Exception as e:
            logger.error(f"LOGIN ERROR: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    
    @auth_bp.route("/me", methods=["GET"])
    def me():
        return jsonify({
            "id": 1,
            "username": "testuser",
            "email": "test@example.com",
            "role": "user"
        }), 200

    @auth_bp.route('/users/<int:user_id>', methods=['PUT'])
    @jwt_required()
    def update_user(user_id):
        try:
            current_user_id = get_jwt_identity()
            
            # Users can only update their own profile
            if int(current_user_id) != user_id:
                return jsonify({"message": "Unauthorized"}), 403
            
            data = request.get_json()
            user = User.query.get_or_404(user_id)
            
            # Update allowed fields
            if 'username' in data:
                # Check if username is already taken by another user
                existing_user = User.query.filter_by(username=data['username']).first()
                if existing_user and existing_user.id != user_id:
                    return jsonify({"message": "Username already taken"}), 400
                user.username = data['username']
                
            if 'email' in data:
                # Check if email is already taken by another user
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user and existing_user.id != user_id:
                    return jsonify({"message": "Email already taken"}), 400
                user.email = data['email']
            
            db.session.commit()
            
            return jsonify(user.to_dict()), 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating user: {str(e)}")
            return jsonify({"message": "Failed to update user"}), 500

    
    @auth_bp.route("/users/<int:user_id>", methods=["OPTIONS"])
    def handle_user_options(user_id=None):
        return jsonify({"status": "preflight ok"}), 200

    # Register the auth blueprint
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    # CREATE REPORTS BLUEPRINT
    reports_bp = Blueprint("reports", __name__)

    @reports_bp.route("/reports", methods=["GET", "OPTIONS"])
    def get_reports():
        if request.method == 'OPTIONS':
            return jsonify({"status": "preflight ok"}), 200
        
        try:
            page = request.args.get('page', 1, type=int)
            per_page = 10
            
            # Get paginated reports
            reports = Report.query.order_by(Report.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return jsonify({
                "items": [report.to_dict() for report in reports.items],
                "totalPages": reports.pages,
                "totalItems": reports.total,
                "page": page
            }), 200
        except Exception as e:
            logger.error(f"Error fetching reports: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @reports_bp.route('/reports', methods=['POST'])
    @jwt_required()
    def create_report():
        try:
            content_type = request.content_type or ""
            is_multipart = "multipart/form-data" in content_type

            data = request.form if is_multipart else (request.get_json() or {})

            if not data:
                return jsonify({'message': 'Request must include report data'}), 400

            title = (data.get('title') or '').strip()
            description = (data.get('description') or '').strip()

            if not title or not description:
                return jsonify({'message': 'Title and description are required'}), 400

            report = Report(
                type=data.get('type', 'corruption'),
                title=title,
                description=description,
                location=data.get('location', 'Unknown location'),
                created_by=get_jwt_identity()
            )

            db.session.add(report)
            db.session.flush()

            saved_files = []

            if is_multipart:
                upload_folder = current_app.config['UPLOAD_FOLDER']
                os.makedirs(upload_folder, exist_ok=True)
                files = request.files.getlist('media')

                for uploaded_file in files:
                    if not uploaded_file or not uploaded_file.filename:
                        continue

                    original_name = uploaded_file.filename
                    if not allowed_file(original_name):
                        raise ValueError(f"File type not allowed: {original_name}")

                    extension = original_name.rsplit('.', 1)[1].lower()
                    generated_name = f"{uuid4().hex}.{extension}"
                    secured_name = secure_filename(generated_name)
                    absolute_path = os.path.join(upload_folder, secured_name)

                    uploaded_file.save(absolute_path)
                    saved_files.append(absolute_path)

                    if absolute_path.startswith(current_app.instance_path):
                        storage_path = os.path.relpath(absolute_path, current_app.instance_path)
                    else:
                        storage_path = absolute_path

                    media_record = ReportMedia(
                        report=report,
                        filename=secured_name,
                        original_filename=original_name,
                        file_path=storage_path,
                        file_size=os.path.getsize(absolute_path)
                    )
                    db.session.add(media_record)

            db.session.commit()

            return jsonify(report.to_dict()), 201

        except ValueError as ve:
            db.session.rollback()
            current_app.logger.warning(f"Validation error creating report: {str(ve)}")
            for path in locals().get('saved_files', []):
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except OSError:
                    current_app.logger.exception("Failed to cleanup uploaded file after validation error")
            return jsonify({'message': str(ve)}), 400
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating report: {str(e)}")

            upload_folder = current_app.config.get('UPLOAD_FOLDER')
            for path in locals().get('saved_files', []):
                try:
                    if upload_folder and path.startswith(upload_folder) and os.path.exists(path):
                        os.remove(path)
                except OSError:
                    current_app.logger.exception("Failed to cleanup uploaded file")

            return jsonify({'message': 'Failed to create report'}), 500

    @reports_bp.route('/reports/<int:report_id>', methods=['PUT'])
    @jwt_required()
    def update_report(report_id):
        try:
            data = request.get_json()
            report = Report.query.get_or_404(report_id)
            
            # Update fields
            if 'title' in data:
                report.title = data['title']
            if 'description' in data:
                report.description = data['description']
            if 'location' in data:
                report.location = data['location']
            if 'type' in data:
                report.type = data['type']
            if 'status' in data:
                report.status = data['status']
                
            db.session.commit()
            
            return jsonify(report.to_dict()), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Failed to update report'}), 500

    @reports_bp.route('/reports/<int:report_id>', methods=['DELETE'])
    @jwt_required()
    def delete_report(report_id):
        try:
            report = Report.query.get_or_404(report_id)

            for media in list(report.media_files):
                media_path = media.file_path
                if not os.path.isabs(media_path):
                    media_path = os.path.join(current_app.instance_path, media_path)
                try:
                    if os.path.exists(media_path):
                        os.remove(media_path)
                except OSError:
                    current_app.logger.warning(f"Failed to remove media file {media_path}")

            db.session.delete(report)
            db.session.commit()
            
            return jsonify({'message': 'Report deleted successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Failed to delete report'}), 500

    @reports_bp.route('/media/<path:filename>', methods=['GET'])
    def get_report_media(filename):
        upload_folder = current_app.config['UPLOAD_FOLDER']
        return send_from_directory(upload_folder, filename)

    # Register the reports blueprint
    app.register_blueprint(reports_bp, url_prefix="/api/v1")
       
    @app.route("/")
    def home():
            return jsonify({"status": "running", "message": "Jiseti Backend API"}), 200

    @app.route("/ping")
    def ping(): 
            return {"msg": "pong"}, 200

        # Global OPTIONS handler
    @app.route('/', methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path=None):
            return jsonify({"status": "preflight ok"}), 200

    return app  

# Create app instance
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
