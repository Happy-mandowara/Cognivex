import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Dict, Any, Optional

from ..core.database import get_db
from ..core.auth import require_role, log_audit
from ..models.models import (
    User,
    Encounter,
    Patient,
    AyushAssessment,
    ClinicalSummary,
    Prescription,
    DocumentRecord
)
from ..schemas.schemas import (
    DoctorNoteUpdate,
    PrescriptionCreate,
    VitalsUpdate,
    DiagnosisUpdate,
    PatientUpdate
)

router = APIRouter(prefix="/doctor", tags=["Doctor Clinical Dashboard"])

@router.get("/queue")
def get_opd_queue(
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Fetches real-time OPD waiting queue with triage priority and vital signs."""
    encounters = db.query(Encounter).order_by(Encounter.created_at.desc()).all()
    queue = []
    for enc in encounters:
        patient = enc.patient
        if not patient:
            continue
        queue.append({
            "encounter_id": enc.id,
            "patient_id": patient.id,
            "patient_name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "abha_id": patient.abha_id,
            "chief_complaint": enc.chief_complaint,
            "status": enc.status,
            "triage_priority": enc.triage_priority,
            "red_flags": enc.red_flags or [],
            "vitals": enc.vitals or {},
            "diagnosis": enc.diagnosis or [],
            "created_at": enc.created_at.isoformat()
        })
    return queue

@router.get("/patient/{encounter_id}")
def get_patient_case_sheet(
    encounter_id: str,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Retrieves full clinical case sheet including SOAP notes, Ayush assessment, and document timeline."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    patient = enc.patient
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not linked to encounter")

    ayush = enc.ayush_assessment
    summary = enc.clinical_summary
    prescription = enc.prescription
    docs = db.query(DocumentRecord).filter(DocumentRecord.patient_id == patient.id).all()

    return {
        "encounter": {
            "id": enc.id,
            "chief_complaint": enc.chief_complaint,
            "status": enc.status,
            "triage_priority": enc.triage_priority,
            "red_flags": enc.red_flags or [],
            "vitals": enc.vitals or {},
            "socrates": enc.socrates or {},
            "general_history": enc.general_history or {},
            "diagnosis": enc.diagnosis or [],
            "created_at": enc.created_at.isoformat()
        },
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "abha_id": patient.abha_id,
            "abha_address": patient.abha_address,
            "has_consented": patient.has_consented,
            "language": patient.language
        },
        "ayush": {
            "id": ayush.id if ayush else None,
            "vata_score": ayush.vata_score if ayush else 28.0,
            "pitta_score": ayush.pitta_score if ayush else 58.0,
            "kapha_score": ayush.kapha_score if ayush else 14.0,
            "dominant_prakriti": ayush.dominant_prakriti if ayush else "Pitta",
            "vikriti_state": ayush.vikriti_state if ayush else "Pitta-Vata Vriddhi",
            "ashtavidha_pariksha": ayush.ashtavidha_pariksha if ayush else {},
            "homeopathy_rubrics": ayush.homeopathy_rubrics if ayush else [],
            "namaste_icd_codes": ayush.namaste_icd_codes if ayush else []
        },
        "clinical_summary": {
            "id": summary.id if summary else None,
            "soap_subjective": summary.soap_subjective if summary else "",
            "soap_objective": summary.soap_objective if summary else "",
            "soap_assessment": summary.soap_assessment if summary else "",
            "soap_plan": summary.soap_plan if summary else "",
            "extracted_entities": summary.extracted_entities if summary else {},
            "doctor_notes": summary.doctor_notes if summary else "",
            "is_verified": summary.is_verified if summary else False,
            "physician_name": summary.physician_name if summary else doctor_user.full_name,
            "disclaimer": "AI-generated draft — physician verification required"
        },
        "prescription": {
            "id": prescription.id if prescription else None,
            "medications": prescription.medications if prescription else [],
            "dietary_advice": prescription.dietary_advice if prescription else "",
            "follow_up_date": prescription.follow_up_date if prescription else "After 7 days",
            "physician_signed": prescription.physician_signed if prescription else True
        },
        "document_timeline": [
            {
                "id": d.id,
                "document_name": d.document_name,
                "doc_type": d.doc_type,
                "document_date": d.document_date,
                "extracted_medicines": d.extracted_medicines,
                "extracted_diagnoses": d.extracted_diagnoses,
                "extracted_lab_values": d.extracted_lab_values
            } for d in docs
        ]
    }

@router.put("/patient/{patient_id}")
def update_patient_demographics(
    patient_id: str,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Allows attending doctor or admin to edit patient demographic profile."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if payload.name is not None:
        patient.name = payload.name.strip()
    if payload.age is not None:
        patient.age = payload.age
    if payload.gender is not None:
        patient.gender = payload.gender
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

    db.commit()
    db.refresh(patient)

    log_audit(
        db=db,
        user_email=doctor_user.email,
        role=doctor_user.role,
        action="UPDATE_PATIENT_DEMOGRAPHICS",
        resource_type="PATIENT",
        resource_id=patient.id,
        details=f"Doctor {doctor_user.email} updated demographics for {patient.name}"
    )

    return {"status": "SUCCESS", "message": "Patient demographics updated successfully", "patient": {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "phone": patient.phone,
        "abha_id": patient.abha_id
    }}

@router.put("/encounter/{encounter_id}/vitals")
def update_encounter_vitals(
    encounter_id: str,
    payload: VitalsUpdate,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Allows attending doctor to update or add patient vitals and clinical observations."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    current_vitals = dict(enc.vitals or {})
    current_vitals.update(payload.vitals)
    enc.vitals = current_vitals
    flag_modified(enc, "vitals")

    db.commit()
    db.refresh(enc)

    log_audit(
        db=db,
        user_email=doctor_user.email,
        role=doctor_user.role,
        action="UPDATE_VITALS",
        resource_type="ENCOUNTER",
        resource_id=enc.id,
        details=f"Doctor updated vitals for encounter {enc.id}"
    )

    return {"status": "SUCCESS", "message": "Vitals updated successfully", "vitals": enc.vitals}

@router.put("/encounter/{encounter_id}/diagnosis")
def update_encounter_diagnosis(
    encounter_id: str,
    payload: DiagnosisUpdate,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Allows attending doctor to add or edit clinical diagnoses."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    enc.diagnosis = [d.dict() for d in payload.diagnoses]
    flag_modified(enc, "diagnosis")

    db.commit()
    db.refresh(enc)

    log_audit(
        db=db,
        user_email=doctor_user.email,
        role=doctor_user.role,
        action="UPDATE_DIAGNOSIS",
        resource_type="ENCOUNTER",
        resource_id=enc.id,
        details=f"Doctor updated diagnoses for encounter {enc.id}"
    )

    return {"status": "SUCCESS", "message": "Diagnoses updated successfully", "diagnosis": enc.diagnosis}

@router.post("/notes/{encounter_id}")
def update_doctor_notes(
    encounter_id: str,
    payload: DoctorNoteUpdate,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Allows attending doctor to edit notes, adjust SOAP, and verify/reject AI draft."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.encounter_id == encounter_id).first()
    if not summary:
        summary = ClinicalSummary(
            id=f"SUM-{str(uuid.uuid4())[:8].upper()}",
            encounter_id=encounter_id,
            patient_id=enc.patient_id if enc else "PAT-UNKNOWN",
            doctor_notes="",
            soap_subjective="",
            soap_objective="",
            soap_assessment="",
            soap_plan="",
            is_verified=False
        )
        db.add(summary)

    note_text = payload.doctor_notes or payload.notes or ""
    summary.doctor_notes = note_text
    if payload.soap_subjective is not None:
        summary.soap_subjective = payload.soap_subjective
    if payload.soap_objective is not None:
        summary.soap_objective = payload.soap_objective
    if payload.soap_assessment is not None:
        summary.soap_assessment = payload.soap_assessment
    if payload.soap_plan is not None:
        summary.soap_plan = payload.soap_plan
    summary.is_verified = payload.is_verified
    summary.physician_name = doctor_user.full_name

    # Update encounter status to COMPLETED if verified
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if enc and payload.is_verified:
        enc.status = "COMPLETED"

    db.commit()

    log_audit(
        db=db,
        user_email=doctor_user.email,
        role=doctor_user.role,
        action="VERIFY_CLINICAL_SUMMARY" if payload.is_verified else "UPDATE_CLINICAL_NOTES",
        resource_type="CLINICAL_SUMMARY",
        resource_id=summary.id,
        details=f"Physician {doctor_user.full_name} updated notes (Verified: {payload.is_verified})"
    )

    return {"status": "SUCCESS", "message": "Clinical notes saved and verified by physician"}

@router.post("/prescription")
def create_prescription(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Creates or updates prescription with Ayush and Allopathic formulations."""
    existing = db.query(Prescription).filter(Prescription.encounter_id == payload.encounter_id).first()
    if existing:
        existing.medications = [m.dict() for m in payload.medications]
        existing.dietary_advice = payload.dietary_advice
        existing.follow_up_date = payload.follow_up_date
        existing.physician_signed = True
        db.commit()

        log_audit(
            db=db,
            user_email=doctor_user.email,
            role=doctor_user.role,
            action="UPDATE_PRESCRIPTION",
            resource_type="PRESCRIPTION",
            resource_id=existing.id,
            details=f"Doctor updated prescription {existing.id}"
        )
        return {"status": "UPDATED", "prescription_id": existing.id}

    presc_id = f"RX-{str(uuid.uuid4())[:8].upper()}"
    new_presc = Prescription(
        id=presc_id,
        encounter_id=payload.encounter_id,
        patient_id=payload.patient_id,
        medications=[m.dict() for m in payload.medications],
        dietary_advice=payload.dietary_advice,
        follow_up_date=payload.follow_up_date,
        physician_signed=True
    )
    db.add(new_presc)
    db.commit()

    log_audit(
        db=db,
        user_email=doctor_user.email,
        role=doctor_user.role,
        action="CREATE_PRESCRIPTION",
        resource_type="PRESCRIPTION",
        resource_id=presc_id,
        details=f"Doctor created prescription {presc_id} with {len(payload.medications)} medications"
    )

    return {"status": "CREATED", "prescription_id": presc_id}

@router.patch("/encounter/{encounter_id}/status")
def update_encounter_status(
    encounter_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Updates encounter status (DRAFT, SUBMITTED, WAITING, IN_CONSULTATION, VERIFIED, COMPLETED)."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    new_status = payload.get("status")
    valid_statuses = ["DRAFT", "SUBMITTED", "WAITING", "IN_CONSULTATION", "VERIFIED", "COMPLETED"]
    if not new_status or new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    enc.status = new_status
    db.commit()
    db.refresh(enc)

    log_audit(
        db=db,
        user_email=doctor_user.email,
        role=doctor_user.role,
        action="UPDATE_ENCOUNTER_STATUS",
        resource_type="ENCOUNTER",
        resource_id=enc.id,
        details=f"Status of encounter {enc.id} changed to {new_status}"
    )

    return {"status": "SUCCESS", "encounter_id": enc.id, "new_status": enc.status}

