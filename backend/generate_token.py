from flask_jwt_extended import create_access_token
from app import create_app, db
from models import User

app = create_app()
with app.app_context():
    db.create_all()
    user = User(username='test', email='test@example.com', password_hash='hash')
    db.session.add(user)
    db.session.commit()
    print(create_access_token(identity=str(user.id)))