from app import create_app
from models import db, User

def seed_admin():
    app = create_app()
    
    with app.app_context():
        db.create_all()
        
        admin = User.query.filter_by(email='admin@jiseti.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@jiseti.com',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created:")
            print("   Email: admin@jiseti.com")
            print("   Password: admin123")
            print("   Role: admin")
        else:
            print("✅ Admin user already exists")
        
        user_count = User.query.count()
        print(f"Total users in database: {user_count}")

if __name__ == '__main__':
    seed_admin()