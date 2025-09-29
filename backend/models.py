from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='user')

    def set_password(self, password):
        self.password_hash = generate_password_hash(
            password, 
            method='pbkdf2:sha256', 
            salt_length=8
        )
        return True

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role
        }

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref='reports')

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# class ReportMedia(db.Model):
#     __tablename__ = 'report_media'
#     id = db.Column(db.Integer, primary_key=True)
#     report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=False)
#     filename = db.Column(db.String(255), nullable=False)
#     original_filename = db.Column(db.String(255), nullable=False)
#     file_path = db.Column(db.String(500), nullable=False)
#     file_size = db.Column(db.Integer, nullable=False)
#     uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

#     report = db.relationship('Report', backref=db.backref('media_files', lazy=True, cascade='all, delete-orphan'))

#     def to_dict(self):
#         return {
#             'id': self.id,
#             'filename': self.filename,
#             'original_filename': self.original_filename,
#             'file_path': self.file_path,
#             'file_size': self.file_size,
#             'uploaded_at': self.uploaded_at.isoformat(),
#             'url': f'/api/media/{self.filename}'  # This will serve from Render Disk
#         }