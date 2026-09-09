import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ..core.database import get_db
from ..core.security import get_password_hash
from ..core.auth import require_role, log_audit
from ..models.models import User, AuditLog, Patient, Encounter, FhirBundleRecord, SystemSetting
from ..schemas.schemas import UserStatusUpdate, SystemSettingsUpdate

router = APIRouter(prefix="/admin", tags=["Admin Portal & System Governance"])

class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: str # ADMIN, DOCTOR, PATIENT
    full_name: str
    patient_id: Optional[str] = None

@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    total_patients = db.query(Patient).count()
    total_encounters = db.query(Encounter).count()
    waiting_encounters = db.query(Encounter).filter(Encounter.status == "WAITING_DOCTOR").count()
    completed_encounters = db.query(Encounter).filter(Encounter.status == "COMPLETED").count()
    emergency_encounters = db.query(Encounter).filter(Encounter.triage_priority == "EMERGENCY").count()
    total_fhir_bundles = db.query(FhirBundleRecord).count()
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    return {
        "total_patients": total_patients,
        "total_encounters": total_encounters,
        "waiting_encounters": waiting_encounters,
        "completed_encounters": completed_encounters,
        "emergency_encounters": emergency_encounters,
        "total_fhir_bundles": total_fhir_bundles,
        "total_users": total_users,
        "active_users": active_users,
        "opd_throughput_rate": "98.4%",
        "average_wait_time_minutes": 14
    }

@router.get("/users")
def get_users_list(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "full_name": u.full_name,
            "patient_id": u.patient_id,
            "is_active": getattr(u, "is_active", True),
            "created_at": u.created_at.isoformat()
        } for u in users
    ]

@router.post("/users")
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        id=f"USR-{str(uuid.uuid4())[:8].upper()}",
        email=payload.email.strip().lower(),
        hashed_password=get_password_hash(payload.password),
        role=payload.role.upper(),
        full_name=payload.full_name.strip(),
        patient_id=payload.patient_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()

    log_audit(
        db=db,
        user_email=admin_user.email,
        role=admin_user.role,
        action="CREATE_USER",
        resource_type="USER",
        resource_id=new_user.id,
        details=f"Admin {admin_user.email} created {new_user.role} user: {new_user.email}"
    )

    return {"status": "SUCCESS", "user_id": new_user.id, "message": f"User {new_user.email} created successfully"}

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Administrator cannot deactivate their own account")

    user.is_active = payload.is_active
    db.commit()

    action_label = "ACTIVATE_USER" if payload.is_active else "DEACTIVATE_USER"
    log_audit(
        db=db,
        user_email=admin_user.email,
        role=admin_user.role,
        action=action_label,
        resource_type="USER",
        resource_id=user.id,
        details=f"Admin {admin_user.email} set active status to {payload.is_active} for {user.email}"
    )

    return {"status": "SUCCESS", "is_active": user.is_active, "message": f"User {user.email} is now {'active' if user.is_active else 'deactivated'}"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Administrator cannot delete their own account")

    email = user.email
    db.delete(user)
    db.commit()

    log_audit(
        db=db,
        user_email=admin_user.email,
        role=admin_user.role,
        action="DELETE_USER",
        resource_type="USER",
        resource_id=user_id,
        details=f"Admin {admin_user.email} deleted user account {email}"
    )

    return {"status": "SUCCESS", "message": f"User {email} has been removed"}

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(150).all()
    return [
        {
            "id": l.id,
            "user_email": l.user_email,
            "role": l.role,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.isoformat()
        } for l in logs
    ]

DEFAULT_SYSTEM_SETTINGS = {
    "app_name": "MediKiosk Clinical EHR",
    "facility_name": "MediKiosk Integrated Outpatient Healthcare Facility",
    "opd_prefix": "MED",
    "version": "1.0.0",
    "security_standard": "JWT + Bcrypt + Role-Based Access Control",
    "abdm_environment": "ABDM Sandbox Gateway (NRCES FHIR R4)",
    "fhir_profile": "NRCES FHIR R4 India Core Release 1.0",
    "ai_engine_status": "Local Clinical NLP & Rule-Based Decision Support",
    "ayush_clinical_engine": "Tridosha Assessment + Kent Repertory + NAMASTE-ICD Mappings",
    "disclaimer_enforced": "True",
    "session_timeout_minutes": "60"
}

@router.get("/system-settings")
def get_system_settings(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    # Retrieve persisted settings from DB
    db_settings = db.query(SystemSetting).all()
    result = dict(DEFAULT_SYSTEM_SETTINGS)
    for s in db_settings:
        result[s.key] = s.value
    return result

@router.put("/system-settings")
def update_system_settings(
    payload: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    for key, value in payload.settings.items():
        val_str = str(value)
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = val_str
            existing.updated_at = datetime.datetime.utcnow()
        else:
            new_setting = SystemSetting(
                key=key,
                value=val_str,
                description=f"System setting for {key}",
                updated_at=datetime.datetime.utcnow()
            )
            db.add(new_setting)

    db.commit()

    log_audit(
        db=db,
        user_email=admin_user.email,
        role=admin_user.role,
        action="UPDATE_SYSTEM_SETTINGS",
        resource_type="CONFIG",
        resource_id="SYSTEM",
        details=f"Admin {admin_user.email} updated system settings: {', '.join(payload.settings.keys())}"
    )

    return {"status": "SUCCESS", "message": "System settings updated successfully"}
