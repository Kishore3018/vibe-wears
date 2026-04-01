"""
Script to create or promote a user to admin role.
Usage: python create_admin.py
"""
from database.connection import SessionLocal
from models.models import User
from utils.auth import get_password_hash

def create_or_promote_admin():
    db = SessionLocal()
    
    print("\n=== Admin User Setup ===\n")
    email = input("Enter email address: ").strip()
    
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        if user.is_admin:
            print(f"\n✓ User '{email}' is already an admin!")
        else:
            user.is_admin = True
            db.commit()
            print(f"\n✓ User '{email}' has been promoted to admin!")
    else:
        print(f"\nNo user found with email '{email}'.")
        create_new = input("Create new admin user? (y/n): ").strip().lower()
        
        if create_new == 'y':
            password = input("Enter password: ").strip()
            first_name = input("Enter first name: ").strip()
            last_name = input("Enter last name: ").strip()
            
            new_user = User(
                email=email,
                hashed_password=get_password_hash(password),
                first_name=first_name or None,
                last_name=last_name or None,
                is_admin=True,
                is_active=True,
                is_verified=True
            )
            db.add(new_user)
            db.commit()
            print(f"\n✓ Admin user '{email}' created successfully!")
        else:
            print("Cancelled.")
    
    db.close()

if __name__ == "__main__":
    create_or_promote_admin()
