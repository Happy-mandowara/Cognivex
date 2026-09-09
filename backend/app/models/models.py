import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(16), nullable=False)
    phone = Column(String(20), nullable=True)
    dob = Column(String(32), nullable=True)
    abha_id = Column(String(64), nullable=True, index=True)
    abha_address = Column(String(64), nullable=True)
    abha_status = Column(String(32), default="NOT_VERIFIED") # NOT_VERIFIED, OTP_SENT, VERIFIED, FAILED
    abha_otp = Column(String(16), nullable=True)
    has_consented = Column(Boolean, default=True)
    language = Column(String(8), default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("DocumentRecord", back_populates="patient", cascade="all, delete-orphan")
    consents = relationship("AbhaConsent", back_populates="patient", cascade="all, delete-orphan")

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    chief_complaint = Column(Text, nullable=False)
    status = Column(String(32), default="WAITING_DOCTOR") # TRIAGED, WAITING_DOCTOR, IN_CONSULTATION, COMPLETED
    triage_priority = Column(String(16), default="NORMAL") # EMERGENCY, HIGH, NORMAL
    red_flags = Column(JSON, default=list)
    vitals = Column(JSON, default=dict)
    socrates = Column(JSON, default=dict)
    general_history = Column(JSON, default=dict)
    diagnosis = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="encounters")
    ayush_assessment = relationship("AyushAssessment", back_populates="encounter", uselist=False, cascade="all, delete-orphan")
    clinical_summary = relationship("ClinicalSummary", back_populates="encounter", uselist=False, cascade="all, delete-orphan")
    prescription = relationship("Prescription", back_populates="encounter", uselist=False, cascade="all, delete-orphan")
    fhir_bundles = relationship("FhirBundleRecord", back_populates="encounter", cascade="all, delete-orphan")

class AyushAssessment(Base):
    __tablename__ = "ayush_assessments"

    id = Column(String(64), primary_key=True, index=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(64), nullable=False)
    vata_score = Column(Float, default=0.0)
    pitta_score = Column(Float, default=0.0)
    kapha_score = Column(Float, default=0.0)
    dominant_prakriti = Column(String(32), default="Pitta")
    vikriti_state = Column(String(64), default="Pitta-Vata Vriddhi")
    ashtavidha_pariksha = Column(JSON, default=dict)
    dashavidha_pariksha = Column(JSON, default=dict)
    homeopathy_rubrics = Column(JSON, default=list)
    namaste_icd_codes = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    encounter = relationship("Encounter", back_populates="ayush_assessment")

class ClinicalSummary(Base):
    __tablename__ = "clinical_summaries"

    id = Column(String(64), primary_key=True, index=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(64), nullable=False)
    soap_subjective = Column(Text, default="")
    soap_objective = Column(Text, default="")
    soap_assessment = Column(Text, default="")
    soap_plan = Column(Text, default="")
    extracted_entities = Column(JSON, default=dict)
    doctor_notes = Column(Text, default="")
    is_verified = Column(Boolean, default=False)
    physician_name = Column(String(128), default="Dr. V. K. Sharma (MD, Reg #AYUSH-8823)")
    disclaimer = Column(String(256), default="AI-generated draft — physician verification required")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    encounter = relationship("Encounter", back_populates="clinical_summary")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(64), primary_key=True, index=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(64), nullable=False)
    medications = Column(JSON, default=list)
    dietary_advice = Column(Text, default="")
    follow_up_date = Column(String(32), default="After 7 days")
    physician_signed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    encounter = relationship("Encounter", back_populates="prescription")

class DocumentRecord(Base):
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    document_name = Column(String(128), nullable=False)
    doc_type = Column(String(64), default="Prescription")
    document_date = Column(String(32), default="")
    file_path = Column(String(256), nullable=True)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(64), default="application/pdf")
    status = Column(String(32), default="UPLOADED") # UPLOADED, PROCESSED, FAILED
    raw_text = Column(Text, default="")
    extracted_medicines = Column(JSON, default=list)
    extracted_diagnoses = Column(JSON, default=list)
    extracted_lab_values = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")

class AbhaConsent(Base):
    __tablename__ = "abha_consents"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    consent_artefact_id = Column(String(128), nullable=False)
    purpose = Column(String(128), default="Care Context Consultation & Historical Records Access")
    status = Column(String(32), default="GRANTED")
    granted_at = Column(DateTime, default=datetime.datetime.utcnow)
    expiry_at = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=30))

    patient = relationship("Patient", back_populates="consents")

class FhirBundleRecord(Base):
    __tablename__ = "fhir_bundles"

    id = Column(String(64), primary_key=True, index=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(64), nullable=False)
    bundle_id = Column(String(64), nullable=False)
    bundle_type = Column(String(32), default="collection")
    resource_count = Column(Integer, default=0)
    payload = Column(JSON, default=dict)
    abdm_status = Column(String(32), default="DISPATCHED_TO_HIS")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    encounter = relationship("Encounter", back_populates="fhir_bundles")

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default="PATIENT") # ADMIN, DOCTOR, PATIENT
    full_name = Column(String(128), nullable=False)
    patient_id = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(64), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(256), default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    user_email = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False)
    action = Column(String(128), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    details = Column(Text, default="")
    ip_address = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
