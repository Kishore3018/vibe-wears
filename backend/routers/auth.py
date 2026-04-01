from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import random
import string
import httpx
import os
from pydantic import BaseModel
from typing import Optional

from database.connection import get_db
from models.models import User
from schemas.schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token, SendOTP, VerifyOTP, OTPResponse
from utils.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from utils.email import send_google_login_success_email, send_signup_success_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory OTP storage (use Redis in production for scalability)
otp_storage: dict = {}
OTP_EXPIRY_SECONDS = 300  # 5 minutes

# Google OAuth Configuration
# Get credentials from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# 2Factor.in Configuration (FREE SMS provider for India)
# Get your FREE API key from: https://2factor.in/
# Sign up -> Get API Key from Dashboard (free credits included)
TWOFACTOR_API_KEY = os.getenv("TWOFACTOR_API_KEY", "")

# Fast2SMS as fallback
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")


# Google Auth Schema
class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class GoogleTokenAuthRequest(BaseModel):
    access_token: str
    email: str
    name: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    picture: Optional[str] = None
    sub: str  # Google user ID


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))


async def send_sms_otp(phone: str, otp: str) -> dict:
    """Send OTP via 2Factor.in API (FREE) or fallback to demo mode"""
    
    # Try 2Factor.in first (FREE SMS provider)
    if TWOFACTOR_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                # 2Factor.in OTP API
                url = f"https://2factor.in/API/V1/{TWOFACTOR_API_KEY}/SMS/{phone}/{otp}/AUTOGEN"
                response = await client.get(url, timeout=30.0)
                result = response.json()
                print(f"[2FACTOR RESPONSE] {result}")
                
                if result.get("Status") == "Success":
                    print(f"[SMS SENT via 2Factor] OTP sent to {phone}")
                    return {"success": True, "provider": "2factor"}
                else:
                    print(f"[2FACTOR FAILED] {result.get('Details', 'Unknown error')}")
        except Exception as e:
            print(f"[2FACTOR ERROR] {str(e)}")
    
    # Try Fast2SMS as fallback
    if FAST2SMS_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://www.fast2sms.com/dev/bulkV2",
                    headers={
                        "authorization": FAST2SMS_API_KEY,
                        "Content-Type": "application/json"
                    },
                    json={
                        "route": "q",
                        "message": f"Your Vibe Wears OTP is {otp}. Valid for 5 mins.",
                        "language": "english",
                        "flash": 0,
                        "numbers": phone
                    },
                    timeout=30.0
                )
                result = response.json()
                print(f"[FAST2SMS RESPONSE] {result}")
                
                if result.get("return"):
                    print(f"[SMS SENT via Fast2SMS] OTP sent to {phone}")
                    return {"success": True, "provider": "fast2sms"}
        except Exception as e:
            print(f"[FAST2SMS ERROR] {str(e)}")
    
    # Fallback to Demo Mode - OTP still works, just shown in console
    print(f"\n{'='*50}")
    print(f"[DEMO MODE] Your OTP for {phone} is: {otp}")
    print(f"{'='*50}\n")
    return {"success": True, "demo_mode": True, "demo_otp": otp}


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send welcome email asynchronously (if SMTP is configured).
    background_tasks.add_task(
        send_signup_success_email,
        new_user.email,
        new_user.first_name
    )
    
    # Create access token (use str for sub claim per JWT standard)
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login/json", response_model=Token)
async def login_json(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with JSON body (alternative to form data)"""
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ============== OTP Authentication ==============
@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(data: SendOTP, db: Session = Depends(get_db)):
    """Send OTP to phone number for login/registration"""
    phone = data.phone.strip()
    
    # Normalize phone number (remove +91, spaces, etc.)
    if phone.startswith('+91'):
        phone = phone[3:]
    elif phone.startswith('91') and len(phone) > 10:
        phone = phone[2:]
    phone = phone.replace(' ', '').replace('-', '')
    
    if len(phone) != 10 or not phone.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 10-digit mobile number"
        )
    
    # Check if phone is valid Indian mobile (starts with 6-9)
    if phone[0] not in '6789':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid Indian mobile number"
        )
    
    # Rate limiting - prevent OTP spam (1 OTP per minute per phone)
    if phone in otp_storage:
        last_sent = otp_storage[phone].get('created_at')
        if last_sent:
            elapsed = (datetime.utcnow() - last_sent).total_seconds()
            if elapsed < 60:
                wait_time = int(60 - elapsed)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {wait_time} seconds before requesting new OTP"
                )
    
    # Generate OTP
    otp = generate_otp(6)
    
    # Send SMS (tries 2Factor, then Fast2SMS, then demo mode)
    sms_result = await send_sms_otp(phone, otp)
    
    # Store OTP with expiry (always store - demo mode still works)
    otp_storage[phone] = {
        'otp': otp,
        'created_at': datetime.utcnow(),
        'attempts': 0,
        'demo_mode': sms_result.get("demo_mode", False),
        'demo_otp': sms_result.get("demo_otp", None)
    }
    
    # Build response message
    if sms_result.get("demo_mode"):
        message = f"OTP: {otp} (Demo Mode - SMS provider requires recharge)"
    else:
        message = f"OTP sent to ******{phone[-4:]}"
    
    return OTPResponse(
        success=True,
        message=message,
        expires_in=OTP_EXPIRY_SECONDS
    )


@router.post("/verify-otp", response_model=Token)
async def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    """Verify OTP and login/register user"""
    phone = data.phone.strip()
    
    # Normalize phone number
    if phone.startswith('+91'):
        phone = phone[3:]
    elif phone.startswith('91') and len(phone) > 10:
        phone = phone[2:]
    phone = phone.replace(' ', '').replace('-', '')
    
    # Check OTP exists
    if phone not in otp_storage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or not sent. Please request a new OTP."
        )
    
    stored_data = otp_storage[phone]
    
    # Check attempts
    if stored_data['attempts'] >= 3:
        del otp_storage[phone]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new OTP."
        )
    
    # Check expiry
    elapsed = (datetime.utcnow() - stored_data['created_at']).total_seconds()
    if elapsed > OTP_EXPIRY_SECONDS:
        del otp_storage[phone]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new OTP."
        )
    
    # Verify OTP
    if data.otp != stored_data['otp']:
        stored_data['attempts'] += 1
        remaining = 3 - stored_data['attempts']
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempts remaining."
        )
    
    # OTP verified - remove from storage
    del otp_storage[phone]
    
    # Find or create user by phone
    user = db.query(User).filter(User.phone == phone).first()
    
    if not user:
        # Create new user with phone
        user = User(
            email=f"{phone}@mobile.vibewears.com",  # Placeholder email
            hashed_password=get_password_hash(generate_otp(12)),  # Random password
            phone=phone,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/otp-demo/{phone}")
async def get_demo_otp(phone: str):
    """Demo endpoint to get OTP (for testing only - remove in production)"""
    phone = phone.strip()
    if phone.startswith('+91'):
        phone = phone[3:]
    elif phone.startswith('91') and len(phone) > 10:
        phone = phone[2:]
    phone = phone.replace(' ', '').replace('-', '')
    
    if phone in otp_storage:
        return {"otp": otp_storage[phone]['otp'], "phone": phone}
    return {"error": "No OTP found for this phone number"}


# ============== Google OAuth ==============
@router.post("/google", response_model=Token)
async def google_auth(
    data: GoogleAuthRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Authenticate with Google ID token"""
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID in environment."
        )
    
    try:
        # Verify Google token with Google's API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={data.credential}",
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            
            google_data = response.json()
            
            # Verify the token is for our app
            if google_data.get("aud") != GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token not issued for this application"
                )
            
            email = google_data.get("email")
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )
            
            # Check if user exists
            user = db.query(User).filter(User.email == email).first()
            
            if not user:
                # Create new user from Google data
                user = User(
                    email=email,
                    hashed_password=get_password_hash(generate_otp(16)),  # Random password
                    first_name=google_data.get("given_name", ""),
                    last_name=google_data.get("family_name", ""),
                    avatar_url=google_data.get("picture", ""),
                    is_verified=True  # Google accounts are pre-verified
                )
                db.add(user)
                db.commit()
                db.refresh(user)

                background_tasks.add_task(
                    send_signup_success_email,
                    user.email,
                    user.first_name
                )
            else:
                # Update avatar if not set
                if not user.avatar_url and google_data.get("picture"):
                    user.avatar_url = google_data.get("picture")
                    db.commit()
                    db.refresh(user)
            
            # Create access token
            access_token = create_access_token(
                data={"sub": str(user.id)},
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )

            # Send Google login success email on every successful Google login.
            background_tasks.add_task(
                send_google_login_success_email,
                user.email,
                user.first_name
            )
            
            return Token(
                access_token=access_token,
                user=UserResponse.model_validate(user)
            )
            
    except httpx.RequestError as e:
        print(f"[GOOGLE AUTH ERROR] {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify Google token. Please try again."
        )


@router.get("/google/client-id")
async def get_google_client_id():
    """Get Google Client ID for frontend"""
    if not GOOGLE_CLIENT_ID:
        return {"client_id": None, "configured": False}
    return {"client_id": GOOGLE_CLIENT_ID, "configured": True}


@router.post("/google/token", response_model=Token)
async def google_token_auth(
    data: GoogleTokenAuthRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Authenticate with Google OAuth access token and user info"""
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Sign-In is not configured."
        )
    
    try:
        # Verify the access token by checking user info
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {data.access_token}"},
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google access token"
                )
            
            google_user = response.json()
            
            # Verify the email matches
            if google_user.get("email") != data.email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email mismatch"
                )
        
        email = data.email
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user from Google data
            first_name = data.given_name or data.name.split()[0] if data.name else "User"
            last_name = data.family_name or (data.name.split()[-1] if data.name and len(data.name.split()) > 1 else "")
            
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                hashed_password=get_password_hash(f"google_{data.sub}_{random.randint(100000, 999999)}"),
                is_verified=True,
                google_id=data.sub
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            background_tasks.add_task(
                send_signup_success_email,
                user.email,
                user.first_name
            )
        else:
            # Update Google ID if not set
            if not user.google_id:
                user.google_id = data.sub
                db.commit()
                db.refresh(user)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Send Google login success email on every successful Google login.
        background_tasks.add_task(
            send_google_login_success_email,
            user.email,
            user.first_name
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "is_admin": user.is_admin,
                "is_verified": user.is_verified,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }
        
    except httpx.RequestError as e:
        print(f"[GOOGLE TOKEN AUTH ERROR] {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify Google token. Please try again."
        )

