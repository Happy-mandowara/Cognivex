from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import datetime

class AbhaVerificationRequest(BaseModel):
    abha_id: str
    auth_method: str = "DEMO_OTP" # DEMO_OTP, DEMO_BIOMETRIC, DEMO_PASSWORD
    otp: Optional[str] = "123456"

class AbhaSendOtpRequest(BaseModel):
    abha_id: str

class AbhaVerifyOtpRequest(BaseModel):
    abha_id: str
    otp: str

class AbhaStatusResponse(BaseModel):
    abha_status: str # NOT_VERIFIED, OTP_SENT, VERIFIED, FAILED
    abha_id: Optional[str] = None
    is_verified: bool
    message: Optional[str] = None

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    dob: Optional[str] = None
    abha_id: Optional[str] = None
    abha_address: Optional[str] = None
    abha_status: Optional[str] = "NOT_VERIFIED"
    has_consented: bool = True
    language: str = "en"

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    abha_id: Optional[str] = None
    abha_address: Optional[str] = None
    abha_status: Optional[str] = None
    has_consented: Optional[bool] = None
    language: Optional[str] = None

class PatientResponse(PatientBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SocratesInput(BaseModel):
    site: Optional[str] = ""
    onset: Optional[str] = ""
    character: Optional[str] = ""
    radiation: Optional[str] = ""
    associations: Optional[List[str]] = []
    time_course: Optional[str] = ""
    exacerbating_relieving: Optional[str] = ""
    severity: Optional[int] = 5 # 1 to 10

class GeneralHistoryInput(BaseModel):
    hpi: Optional[str] = ""
    past_history: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    family_history: Optional[List[str]] = []
    personal_habits: Optional[Dict[str, Any]] = {}

class AshtavidhaParikshaInput(BaseModel):
    nadi: Optional[str] = "Manduka Gati (Frog jump, Pitta dominant, bounding pulse)"
    mutra: Optional[str] = "Peeta Varna (Yellowish, slightly acidic)"
    mala: Optional[str] = "Shushka or Normal"
    jihva: Optional[str] = "Rakta Varna with mild yellowish coating (Pitta indication)"
    shabda: Optional[str] = "Prakrita / Clear"
    sparsha: Optional[str] = "Ushna (Warm/hot skin)"
    drik: Optional[str] = "Raktaksha (Redness, sensitive to bright light)"
    akriti: Optional[str] = "Madhyama (Moderate, athletic frame)"

class EncounterCreate(BaseModel):
    patient_id: str
    chief_complaint: str
    vitals: Optional[Dict[str, Any]] = {}
    socrates: Optional[SocratesInput] = None
    general_history: Optional[GeneralHistoryInput] = None
    ayush_pariksha: Optional[AshtavidhaParikshaInput] = None

class EncounterResponse(BaseModel):
    id: str
    patient_id: str
    chief_complaint: str
    status: str
    triage_priority: str
    red_flags: List[str]
    vitals: Dict[str, Any]
    socrates: Dict[str, Any]
    general_history: Dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# AI & NLP schemas
class AsrRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: str = "en" # "en" or "hi"
    sample_text_trigger: Optional[str] = None

class AsrResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: float
    service: str = "Mock-Bhashini ASR Pipeline"

class EntityExtractionRequest(BaseModel):
    text: str
    language: str = "en"

class ExtractedEntityItem(BaseModel):
    category: str # Symptom, Duration, Anatomy, Severity, Aggravating, Relieving, RedFlag, Vital, Medication, Allergy
    value: str
    confidence: float

class EntityExtractionResponse(BaseModel):
    symptoms: List[str]
    duration: Optional[str]
    anatomical_site: Optional[str]
    severity_score: Optional[int]
    aggravating_factors: List[str]
    relieving_factors: List[str]
    allergies: List[str]
    medications: List[str]
    red_flags: List[str]
    entities: List[ExtractedEntityItem]

# Ayush Schemas
class PrakritiQuestionnaireInput(BaseModel):
    body_frame: Optional[str] = "moderate" # thin, moderate, large
    skin_texture: Optional[str] = "warm_sensitive" # dry_rough, warm_sensitive, oily_smooth
    digestion: Optional[str] = "strong_acidic" # irregular, strong_acidic, slow_steady
    weather_preference: Optional[str] = "cool" # warm, cool, warm_dry
    sleep_pattern: Optional[str] = "moderate" # light_broken, sound_medium, deep_long
    mind_nature: Optional[str] = "sharp_irritable" # quick_anxious, sharp_irritable, calm_steady

class PrakritiResponse(BaseModel):
    vata_percentage: float
    pitta_percentage: float
    kapha_percentage: float
    dominant_dosha: str
    sub_type: str
    vikriti_assessment: str
    dietary_recommendations: List[str]
    lifestyle_recommendations: List[str]
    disclaimer: str = "Ayush Clinical Decision Support Tool — Never Autonomously Diagnoses or Prescribes"

class HomeopathyRepertoryRequest(BaseModel):
    symptoms: List[str]
    modalities: Optional[List[str]] = []

class RemedyScore(BaseModel):
    remedy_name: str
    score: int
    keynote_indication: str
    grade: str # Grade 3 (Bold), Grade 2 (Italics), Grade 1 (Plain)
    rubrics_matched: List[str]

class HomeopathyRepertoryResponse(BaseModel):
    rubrics_evaluated: List[str]
    top_remedies: List[RemedyScore]
    disclaimer: str = "Homeopathic Repertorization Demo based on Kent/Boericke data. For licensed practitioner evaluation only."

# Doctor schemas
class DoctorNoteUpdate(BaseModel):
    doctor_notes: Optional[str] = ""
    notes: Optional[str] = ""
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    is_verified: bool = True

class PrescriptionItem(BaseModel):
    name: str
    dosage: str
    frequency: str # OD, BD, TDS, SOS
    duration: str # e.g. 5 days
    system: str # Allopathy, Ayurveda, Homeopathy
    instructions: Optional[str] = ""

class PrescriptionCreate(BaseModel):
    encounter_id: str
    patient_id: str
    medications: List[PrescriptionItem]
    dietary_advice: Optional[str] = ""
    follow_up_date: Optional[str] = "After 5 days"

# OCR schemas
class OcrRequest(BaseModel):
    document_type: str = "Prescription" # Prescription or Lab Report
    sample_key: Optional[str] = "ananya_lab_report" # ananya_lab_report, prior_prescription, custom
    text_override: Optional[str] = None

class LabValueItem(BaseModel):
    test_name: str
    result_value: str
    unit: str
    reference_range: str
    status: str # NORMAL, HIGH, LOW

class OcrResponse(BaseModel):
    document_name: str
    doc_type: str
    document_date: str
    extracted_medicines: List[Dict[str, Any]]
    extracted_diagnoses: List[str]
    extracted_lab_values: List[LabValueItem]
    raw_text: str

# ABDM & FHIR
class AbdmConsentRequest(BaseModel):
    patient_id: str
    purpose: str = "Outpatient Consultation & Integrated Health Record Creation"
    hiu_id: str = "MEDIKIOSK_OPD_01"

class FhirBundleResponse(BaseModel):
    bundle_id: str
    resource_type: str = "Bundle"
    fhir_version: str = "R4"
    total_resources: int
    payload: Dict[str, Any]
    abdm_milestone_status: Dict[str, str]

# Demo Mode
class DemoRunResponse(BaseModel):
    status: str
    patient: Dict[str, Any]
    encounter: Dict[str, Any]
    ayush: Dict[str, Any]
    ocr_document: Dict[str, Any]
    clinical_summary: Dict[str, Any]
    prescription: Dict[str, Any]
    fhir_bundle: Dict[str, Any]
    abdm_status: Dict[str, str]
    message: str

class VitalsUpdate(BaseModel):
    vitals: Dict[str, Any]

class DiagnosisItem(BaseModel):
    code: Optional[str] = ""
    description: Optional[str] = ""
    name: Optional[str] = ""
    system: str = "ICD-11" # ICD-11, NAMASTE, Clinical
    type: str = "CONFIRMED" # DIFFERENTIAL, PROVISIONAL, CONFIRMED

class DiagnosisUpdate(BaseModel):
    diagnoses: List[DiagnosisItem]

class UserStatusUpdate(BaseModel):
    is_active: bool

class SystemSettingsUpdate(BaseModel):
    settings: Dict[str, Any]
