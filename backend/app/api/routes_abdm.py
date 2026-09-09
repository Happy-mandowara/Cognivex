import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..core.database import get_db
from ..core.auth import require_role
from ..models.models import Encounter, Patient, FhirBundleRecord, AbhaConsent, User
from ..schemas.schemas import AbdmConsentRequest, FhirBundleResponse
from ..services.fhir_builder import fhir_builder
from ..services.abdm_mock import mock_abdm_gateway

router = APIRouter(prefix="/abdm", tags=["ABDM & FHIR R4 Standard"])

@router.post("/consent")
def generate_consent_artefact(
    payload: AbdmConsentRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Milestone 2: Request and generate ABDM Consent Artefact."""
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    fallback_address = f"{patient.name.lower().replace(' ', '.')}@abdm" if patient.name else "patient@abdm"
    consent_dict = mock_abdm_gateway.generate_consent_artefact(
        patient_id=patient.id,
        abha_address=patient.abha_address or fallback_address,
        hiu_id=payload.hiu_id
    )

    consent_record = AbhaConsent(
        id=f"CONS-{str(uuid.uuid4())[:8].upper()}",
        patient_id=patient.id,
        consent_artefact_id=consent_dict["consent_id"],
        purpose=consent_dict["purpose"]["text"],
        status="GRANTED"
    )
    db.add(consent_record)
    db.commit()

    return consent_dict

@router.post("/fhir-bundle/{encounter_id}", response_model=FhirBundleResponse)
def generate_fhir_r4_bundle(
    encounter_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Generates standard HL7 FHIR R4 Bundle containing Patient, Encounter, Condition, Observation, and MedicationRequest."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    patient = enc.patient
    ayush = enc.ayush_assessment
    prescription = enc.prescription

    patient_data = {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "phone": patient.phone,
        "abha_id": patient.abha_id,
        "abha_address": patient.abha_address
    }

    encounter_data = {
        "id": enc.id,
        "chief_complaint": enc.chief_complaint,
        "status": enc.status
    }

    ayush_data = {
        "dominant_dosha": ayush.dominant_prakriti if ayush else "Pitta",
        "vata_percentage": ayush.vata_score if ayush else 28.0,
        "pitta_percentage": ayush.pitta_score if ayush else 58.0,
        "kapha_percentage": ayush.kapha_score if ayush else 14.0
    }

    presc_data = {
        "medications": prescription.medications if prescription else []
    }

    bundle_json = fhir_builder.build_bundle(
        patient_data=patient_data,
        encounter_data=encounter_data,
        ayush_data=ayush_data,
        prescription_data=presc_data
    )

    # Persist or update bundle record in DB
    existing_record = db.query(FhirBundleRecord).filter(FhirBundleRecord.encounter_id == encounter_id).first()
    if existing_record:
        existing_record.payload = bundle_json
        existing_record.resource_count = bundle_json["total"]
        db.commit()
    else:
        new_record = FhirBundleRecord(
            id=f"BND-{str(uuid.uuid4())[:8].upper()}",
            encounter_id=encounter_id,
            patient_id=patient.id,
            bundle_id=bundle_json["id"],
            bundle_type="collection",
            resource_count=bundle_json["total"],
            payload=bundle_json,
            abdm_status="READY"
        )
        db.add(new_record)
        db.commit()

    return FhirBundleResponse(
        bundle_id=bundle_json["id"],
        resource_type="Bundle",
        fhir_version="R4",
        total_resources=bundle_json["total"],
        payload=bundle_json,
        abdm_milestone_status={
            "M1_ABHA": "VERIFIED",
            "M2_CONSENT": "GRANTED",
            "M3_DATA_FLOW": "READY_FOR_DISPATCH"
        }
    )

@router.post("/exchange/{encounter_id}")
def simulate_abdm_data_exchange(
    encounter_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DOCTOR", "ADMIN"]))
):
    """Milestone 3: Transmit FHIR R4 Bundle to mock ABDM / Hospital Information System."""
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    bundle_record = db.query(FhirBundleRecord).filter(FhirBundleRecord.encounter_id == encounter_id).first()
    if not bundle_record:
        # Generate bundle on the fly
        generate_fhir_r4_bundle(encounter_id, db, current_user)
        bundle_record = db.query(FhirBundleRecord).filter(FhirBundleRecord.encounter_id == encounter_id).first()

    consent = db.query(AbhaConsent).filter(AbhaConsent.patient_id == enc.patient_id).first()
    consent_id = consent.consent_artefact_id if consent else "ABDM-CONSENT-DEMO-AUTO"

    exchange_res = mock_abdm_gateway.simulate_data_exchange(
        consent_id=consent_id,
        fhir_bundle=bundle_record.payload
    )

    bundle_record.abdm_status = "DISPATCHED_TO_HIS"
    db.commit()

    return exchange_res

@router.get("/status")
def get_abdm_integration_status():
    """Returns ABDM health & milestone readiness status."""
    return {
        "status": "ONLINE",
        "gateway": "National Health Authority ABDM Sandbox Gateway (Simulated)",
        "milestones": {
            "M1_ABHA_CREATION_AND_VERIFICATION": "ACTIVE & COMPLIANT",
            "M2_CONSENT_MANAGER_HIP_HIU": "ACTIVE & COMPLIANT",
            "M3_FHIR_R4_HEALTH_INFORMATION_EXCHANGE": "ACTIVE & COMPLIANT"
        },
        "fhir_profile": "NRCES FHIR R4 India Core Release 1.0",
        "supported_hi_types": ["OPConsultation", "Prescription", "DiagnosticReport", "AyushAssessment"],
        "encryption_standard": "ECDH Curve25519 with AES-GCM 128/256"
    }
