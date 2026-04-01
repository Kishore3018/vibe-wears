"""Quick admin setup script - Run once to create admin user"""
import sys
sys.path.insert(0, '.')

from database.connection import SessionLocal
from models.models import User
from utils.auth import get_password_hash

def setup_admin():
    db = SessionLocal()
    
    email = "Vibewears@admin.com"
    password = "admin123"  # Change this password after first login!
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        if user.is_admin:
            print(f"User '{email}' is already an admin!")
        else:
            user.is_admin = True
            db.commit()
            print(f"User '{email}' promoted to admin!")
    else:
        # Create new admin user
        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            first_name="Admin",
            last_name="User",
            is_admin=True,
            is_active=True,
            is_verified=True
        )
        db.add(new_user)
        db.commit()
        print(f"Admin user created!")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  (Please change password after login)")
    
    db.close()

if __name__ == "__main__":
    setup_admin()
