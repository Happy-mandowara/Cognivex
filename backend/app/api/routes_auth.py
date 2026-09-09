from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid

from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.auth import get_current_user, log_audit
from ..models.models import User, Patient

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "PATIENT"

class UserProfile(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    patient_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name, "uid": user.id}
    )

    log_audit(
        db=db,
        user_email=user.email,
        role=user.role,
        action="USER_LOGIN",
        resource_type="AUTH",
        resource_id=user.id,
        details=f"Successful authentication for {user.email} as {user.role}"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfile(
            id=user.id,
            email=user.email,
            role=user.role,
            full_name=user.full_name,
            patient_id=user.patient_id
        )
    )

@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    clean_role = payload.role.strip().upper()
    
    # Task 2 Requirement: Role selection: PATIENT / DOCTOR. ADMIN must NEVER be selectable during public signup.
    if clean_role not in ["PATIENT", "DOCTOR"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is only available for PATIENT or DOCTOR roles. Administrator roles cannot be registered publicly."
        )

    # Validate name
    clean_name = payload.name.strip()
    if not clean_name or len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid full name (minimum 2 characters)."
        )

    # Validate email
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email or "." not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    # Check for duplicate email
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please login instead."
        )

    # Validate password strength (minimum 6 characters)
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too weak. It must be at least 6 characters long."
        )

    # Create new user
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    hashed_pwd = get_password_hash(payload.password)
    
    pat_id = None
    if clean_role == "PATIENT":
        pat_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
        patient_record = Patient(
            id=pat_id,
            name=clean_name,
            gender="Other",
            age=30,
            phone="",
            abha_id=""
        )
        db.add(patient_record)

    new_user = User(
        id=user_id,
        email=clean_email,
        hashed_password=hashed_pwd,
        role=clean_role,
        full_name=clean_name,
        patient_id=pat_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db=db,
        user_email=new_user.email,
        role=new_user.role,
        action="USER_SIGNUP",
        resource_type="AUTH",
        resource_id=new_user.id,
        details=f"New account created: {new_user.email} as {new_user.role}"
    )

    access_token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role, "name": new_user.full_name, "uid": new_user.id}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfile(
            id=new_user.id,
            email=new_user.email,
            role=new_user.role,
            full_name=new_user.full_name,
            patient_id=new_user.patient_id
        )
    )

@router.get("/me", response_model=UserProfile)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name,
        patient_id=current_user.patient_id
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="USER_LOGOUT",
        resource_type="AUTH",
        resource_id=current_user.id,
        details=f"User {current_user.email} signed out"
    )
    return {"status": "SUCCESS", "message": "Successfully logged out"}
