import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..core.auth import get_current_user, require_role, log_audit
from ..models.models import Patient, User, Encounter, DocumentRecord
from ..schemas.schemas import PatientCreate, PatientUpdate, PatientResponse, AbhaVerificationRequest
from ..services.abdm_mock import mock_abdm_gateway

router = APIRouter(prefix="/patients", tags=["Patients & ABHA"])

@router.get("", response_model=List[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Only doctors and admins can list all registered patients."""
    return db.query(Patient).order_by(Patient.created_at.desc()).all()

@router.get("/me", response_model=PatientResponse)
def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves current authenticated patient's profile."""
    if current_user.patient_id:
        patient = db.query(Patient).filter(Patient.id == current_user.patient_id).first()
        if patient:
            return patient

    # Fallback: check by email or name
    patient = db.query(Patient).filter(Patient.name == current_user.full_name).first()
    if patient:
        current_user.patient_id = patient.id
        db.commit()
        return patient

    # If user has role PATIENT, auto-provision their patient profile
    if current_user.role == "PATIENT":
        new_patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
        patient = Patient(
            id=new_patient_id,
            name=current_user.full_name or "Patient",
            gender="Other",
            age=30,
            phone="",
            abha_id="",
            abha_status="NOT_VERIFIED"
        )
        db.add(patient)
        current_user.patient_id = new_patient_id
        db.commit()
        db.refresh(patient)
        return patient

    raise HTTPException(status_code=404, detail="No patient profile found for current user")

@router.get("/my-encounters")
def get_my_encounters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all clinical encounters for the authenticated patient."""
    patient_id = current_user.patient_id
    if not patient_id:
        patient = db.query(Patient).filter(Patient.name == current_user.full_name).first()
        if patient:
            patient_id = patient.id

    if not patient_id:
        return []

    encounters = db.query(Encounter).filter(Encounter.patient_id == patient_id).order_by(Encounter.created_at.desc()).all()
    results = []
    for enc in encounters:
        results.append({
            "id": enc.id,
            "patient_id": enc.patient_id,
            "chief_complaint": enc.chief_complaint,
            "status": enc.status,
            "triage_priority": enc.triage_priority,
            "vitals": enc.vitals or {},
            "created_at": enc.created_at.isoformat(),
            "has_prescription": enc.prescription is not None,
            "has_summary": enc.clinical_summary is not None
        })
    return results

@router.post("", response_model=PatientResponse)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db)
):
    """Registers a new patient record."""
    patient_id = f"P-{str(uuid.uuid4())[:8].upper()}"
    new_patient = Patient(
        id=patient_id,
        name=payload.name.strip(),
        age=payload.age,
        gender=payload.gender,
        phone=payload.phone,
        abha_id=payload.abha_id,
        abha_address=payload.abha_address or (f"{payload.name.lower().replace(' ', '.')}@abdm" if payload.name else None),
        has_consented=payload.has_consented,
        language=payload.language
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates a patient's demographic record."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient = Patient(
            id=patient_id,
            name=payload.name or "Patient",
            gender=payload.gender or "Other",
            age=payload.age or 30,
            dob=payload.dob,
            phone=payload.phone or "",
            abha_id=payload.abha_id or "",
            abha_status=payload.abha_status or "VERIFIED",
            has_consented=payload.has_consented if payload.has_consented is not None else True,
            language=payload.language or "en"
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    # Link kiosk patient to user session if needed
    if current_user.role == "PATIENT" and not current_user.patient_id:
        current_user.patient_id = patient.id

    if payload.name is not None:
        patient.name = payload.name.strip()
    if payload.age is not None:
        patient.age = payload.age
    if payload.gender is not None:
        patient.gender = payload.gender
    if payload.dob is not None:
        patient.dob = payload.dob
    if payload.phone is not None:
        patient.phone = payload.phone
    if payload.abha_id is not None:
        patient.abha_id = payload.abha_id
    if payload.abha_address is not None:
        patient.abha_address = payload.abha_address
    if payload.has_consented is not None:
        patient.has_consented = payload.has_consented
    if payload.language is not None:
        patient.language = payload.language
    if payload.abha_status is not None:
        patient.abha_status = payload.abha_status

    db.commit()
    db.refresh(patient)

    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="UPDATE_PATIENT_PROFILE",
        resource_type="PATIENT",
        resource_id=patient.id,
        details=f"Patient {patient.name} profile updated by {current_user.email}"
    )

    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves patient details. Patients can only access their own details."""
    if current_user.role == "PATIENT" and current_user.patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied. Patients can only view their own record.")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/verify-abha")
def verify_abha(payload: AbhaVerificationRequest):
    """Verify ABHA ID via Mock ABDM gateway."""
    res = mock_abdm_gateway.verify_abha(payload.abha_id, payload.otp or "123456")
    return res
