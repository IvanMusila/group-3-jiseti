
from app import create_app
from models import db, User, Report
from datetime import datetime, timedelta

def seed_user_data():
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Seed Admin User
        admin = User.query.filter_by(email='admin@jiseti.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@jiseti.com',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            print("✅ Admin user created:")
            print("   Email: admin@jiseti.com")
            print("   Password: admin123")
            print("   Role: admin")
        else:
            print("✅ Admin user already exists")
        
        # Seed Regular User
        user = User.query.filter_by(email='user@jiseti.com').first()
        if not user:
            user = User(
                username='testuser',
                email='user@jiseti.com',
                role='user'
            )
            user.set_password('user123')
            db.session.add(user)
            print("✅ Test user created:")
            print("   Email: user@jiseti.com")
            print("   Password: user123")
            print("   Role: user")
        else:
            print("✅ Test user already exists")
        
        # Commit users first to get their IDs
        db.session.commit()
        
        # Seed Sample Reports
        sample_reports = [
            {
                'type': 'infrastructure',
                'title': 'Pothole on Main Street',
                'description': 'Large pothole near the intersection of Main Street and 1st Avenue, causing traffic issues and potential vehicle damage.',
                'location': 'Main Street, Downtown',
                'status': 'pending',
                'created_by': user.id
            },
            {
                'type': 'sanitation',
                'title': 'Overflowing garbage bins',
                'description': 'Public garbage bins have been overflowing for 3 days, creating unsanitary conditions and attracting pests.',
                'location': 'Central Park area',
                'status': 'in_progress',
                'created_by': user.id
            },
            {
                'type': 'safety',
                'title': 'Broken street light',
                'description': 'Street light pole #45 is broken and not functioning, making the area dark and unsafe at night.',
                'location': 'Residential Zone B',
                'status': 'resolved',
                'created_by': user.id
            },
            {
                'type': 'corruption',
                'title': 'Suspicious contract award',
                'description': 'Concerns about transparency in the recent road construction contract award process.',
                'location': 'City Hall',
                'status': 'under_review',
                'created_by': admin.id
            },
            {
                'type': 'infrastructure',
                'title': 'Damaged sidewalk',
                'description': 'Uneven and cracked sidewalk poses risk to pedestrians, especially elderly and disabled individuals.',
                'location': 'Oak Street',
                'status': 'pending',
                'created_by': user.id
            }
        ]
        
        reports_created = 0
        for report_data in sample_reports:
            # Check if report already exists
            existing_report = Report.query.filter_by(
                title=report_data['title'],
                created_by=report_data['created_by']
            ).first()
            
            if not existing_report:
                # Create report with specific timestamps for variety
                days_ago = reports_created * 2  # Stagger creation dates
                created_at = datetime.now() - timedelta(days=days_ago)
                
                report = Report(
                    type=report_data['type'],
                    title=report_data['title'],
                    description=report_data['description'],
                    location=report_data['location'],
                    status=report_data['status'],
                    created_by=report_data['created_by'],
                    created_at=created_at,
                    updated_at=created_at
                )
                db.session.add(report)
                reports_created += 1
                print(f"✅ Created report: {report_data['title']}")
        
        db.session.commit()
        
        # Print summary
        user_count = User.query.count()
        report_count = Report.query.count()
        
        print(f"\n📊 Seeding Summary:")
        print(f"   Total users: {user_count}")
        print(f"   Total reports: {report_count}")
        print(f"   New reports created: {reports_created}")
        
        # Print report status breakdown
        status_counts = db.session.query(Report.status, db.func.count(Report.id)).group_by(Report.status).all()
        print(f"   Report status breakdown:")
        for status, count in status_counts:
            print(f"     - {status}: {count}")

if __name__ == '__main__':
    seed_user_data()