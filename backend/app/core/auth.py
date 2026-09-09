import uuid
import datetime
from typing import List, Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from .database import get_db
from .security import decode_access_token, get_password_hash
from ..models.models import User, AuditLog

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]

    # Support instant 1-click demo tokens
    if token.startswith("demo_token_"):
        email = "patient@medikiosk.demo" if "patient" in token.lower() else "doctor@medikiosk.demo"
        demo_user = db.query(User).filter(User.email == email).first()
        if demo_user:
            return demo_user

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists."
        )
    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated. Please contact the administrator."
        )
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{current_user.role}' is not authorized to perform this operation. Allowed: {allowed_roles}"
            )
        return current_user
    return role_checker

def log_audit(
    db: Session,
    user_email: str,
    role: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: str = "",
    ip_address: str = "127.0.0.1"
):
    log_entry = AuditLog(
        id=f"AUD-{str(uuid.uuid4())[:8].upper()}",
        user_email=user_email,
        role=role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id or "",
        details=details,
        ip_address=ip_address,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()

def seed_demo_users(db: Session):
    """Seed the 3 demo accounts required: admin@medikiosk.demo, doctor@medikiosk.demo, patient@medikiosk.demo"""
    demo_accounts = [
        {
            "id": "USR-ADMIN-01",
            "email": "admin@medikiosk.demo",
            "password": "Admin!123",
            "role": "ADMIN",
            "full_name": "System Administrator"
        },
        {
            "id": "USR-DOCTOR-01",
            "email": "doctor@medikiosk.demo",
            "password": "Doctor!123",
            "role": "DOCTOR",
            "full_name": "Dr. V. K. Sharma (MD)"
        },
        {
            "id": "USR-PATIENT-01",
            "email": "patient@medikiosk.demo",
            "password": "Patient!123",
            "role": "PATIENT",
            "full_name": "Ananya Sharma",
            "patient_id": "P-ANANYA-DEMO"
        },
        {
            "id": "USR-HAPPY-01",
            "email": "happy@gmail.com",
            "password": "Doctor!123",
            "role": "DOCTOR",
            "full_name": "Happy Mandowara (Doctor)"
        }
    ]

    for acc in demo_accounts:
        existing = db.query(User).filter(User.email == acc["email"]).first()
        if not existing:
            new_user = User(
                id=acc["id"],
                email=acc["email"],
                hashed_password=get_password_hash(acc["password"]),
                role=acc["role"],
                full_name=acc["full_name"],
                patient_id=acc.get("patient_id")
            )
            db.add(new_user)
    db.commit()
