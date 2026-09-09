from fastapi import APIRouter
from typing import Dict, Any

from ..schemas.schemas import (
    AsrRequest,
    AsrResponse,
    EntityExtractionRequest,
    EntityExtractionResponse,
    OcrRequest,
    OcrResponse
)
from ..services.nlp_extractor import clinical_nlp_extractor
from ..services.ocr_engine import document_ocr_engine

router = APIRouter(prefix="/ai", tags=["AI & Document Intelligence"])

@router.post("/asr", response_model=AsrResponse)
def bhashini_asr_endpoint(payload: AsrRequest):
    """Mock/Local ASR with Bhashini-compatible schema supporting English and Hindi speech intake."""
    lang = payload.language or "en"
    
    # Intelligent preset fallback based on triggers or language
    if payload.sample_text_trigger:
        transcript = payload.sample_text_trigger
    elif lang == "hi":
        transcript = "मुझे पिछले 3 दिनों से बहुत तेज़ सिर दर्द है, धूप में जाने से दर्द बहुत ज़्यादा बढ़ जाता है और जी मिचलाता है।"
    else:
        transcript = "I have had a severe throbbing headache for the past 3 days. It gets much worse in sunlight and hot weather, accompanied by nausea and light sensitivity."

    return AsrResponse(
        transcript=transcript,
        detected_language=lang,
        confidence=0.985,
        service="Bhashini Automated Speech Recognition (ULCA API Compatible Local Engine)"
    )

@router.post("/extract", response_model=EntityExtractionResponse)
def clinical_entity_extraction(payload: EntityExtractionRequest):
    """Clinical entity extraction returning structured JSON (symptoms, durations, anatomy, triggers, allergies, red flags)."""
    res = clinical_nlp_extractor.extract_entities(payload.text, payload.language)
    return EntityExtractionResponse(**res)

@router.post("/ocr", response_model=OcrResponse)
def parse_clinical_document(payload: OcrRequest):
    """OCR engine for parsing uploaded prescriptions and diagnostic lab reports."""
    doc_res = document_ocr_engine.parse_document(
        document_type=payload.document_type,
        sample_key=payload.sample_key or "ananya_lab_report",
        custom_text=payload.text_override
    )
    return OcrResponse(**doc_res)

@router.post("/clinical-summary")
def generate_ai_clinical_summary(payload: Dict[str, Any]):
    """Assistive AI Clinical Summary generation synthesizing complaints, symptoms, Ayush dosha, and lab data into SOAP format."""
    from ..services.ai_clinical import ai_clinical_service
    return ai_clinical_service.generate_clinical_summary(payload)
