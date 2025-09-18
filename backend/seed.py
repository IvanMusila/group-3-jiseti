from backend.app import create_app, db
from backend.models import User

app = create_app()

with app.app_context():
    # Clear existing users
    db.session.query(User).delete()

    # Add test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    print("Test user added")
