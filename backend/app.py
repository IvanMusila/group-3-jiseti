from flask import Flask, jsonify, request, Blueprint
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, Report
import os
import logging
import traceback

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
    app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', '/opt/render/uploads')
    app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))  # 50MB
    
    # Allowed file extensions
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mkv'}

    # ✅ CORS applied globally for all API routes
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}},
        supports_credentials=True
    )

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)

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
    
    # Auth routes
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
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                logger.warning(f"Email already registered: {data['email']}")
                return jsonify({"error": "Email already registered"}), 400
            
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
            logger.error("FULL TRACEBACK:")
            logger.error(traceback.format_exc())
            return jsonify({"error": "Internal server error", "debug": str(e)}), 500
    
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

    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mkv'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def ensure_upload_folder():
    """Ensure the upload folder exists"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    return upload_folder

    @app.route('/api/reports', methods=['POST'])
    @jwt_required()
    def create_report():
        try:
            # Check if request is multipart/form-data
            if request.content_type.startswith('multipart/form-data'):
                payload_str = request.form.get('payload')
                if not payload_str:
                    return jsonify({'message': 'Missing payload data'}), 400
                
                data = json.loads(payload_str)
                files = request.files.getlist('attachments')
            else:
                data = request.get_json()
                files = []

            # Validate required fields
            if not data.get('title') or not data.get('description'):
                return jsonify({'message': 'Title and description are required'}), 400

            # Create report
            report = Report(
                type=data.get('type', 'corruption'),
                title=data['title'],
                description=data['description'],
                location=data.get('location', 'Unknown location'),
                created_by=get_jwt_identity()
            )

            db.session.add(report)
            db.session.flush()

            # Ensure upload folder exists
            upload_folder = ensure_upload_folder()
            
            # Handle file uploads
            saved_files = []
            for file in files:
                if file and allowed_file(file.filename):
                    # Check file size
                    file.seek(0, 2)  # Seek to end to get size
                    file_size = file.tell()
                    file.seek(0)  # Reset to beginning
                    
                    if file_size > current_app.config['MAX_CONTENT_LENGTH']:
                        continue
                    
                    # Secure the filename and create unique name
                    filename = secure_filename(file.filename)
                    unique_filename = f"{report.id}_{int(datetime.now(timezone.utc).timestamp())}_{filename}"
                    
                    # Save to Render Disk
                    file_path = os.path.join(upload_folder, unique_filename)
                    file.save(file_path)
                    
                    # Create file record in database
                    media_file = ReportMedia(
                        report_id=report.id,
                        filename=unique_filename,
                        original_filename=filename,
                        file_path=file_path,
                        file_size=file_size
                    )
                    db.session.add(media_file)
                    saved_files.append(media_file.to_dict())

            db.session.commit()

            report_data = report.to_dict()
            report_data['attachments'] = saved_files

            return jsonify(report_data), 201

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating report: {str(e)}")
            return jsonify({'message': 'Failed to create report'}), 500

    # Register the reports blueprint
    app.register_blueprint(reports_bp, url_prefix="/api/v1")

    @app.route('/api/media/<filename>')
    def get_media(filename):
        try:
            upload_folder = current_app.config['UPLOAD_FOLDER']
            return send_from_directory(upload_folder, filename)
        except FileNotFoundError:
            return jsonify({'message': 'File not found'}), 404

    # Health check routes
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

    return app  # ✅ Correct indentation - same level as def create_app()

# Create app instance
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)