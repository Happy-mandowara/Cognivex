from fastapi import APIRouter
from typing import List, Dict, Any, Optional

from ..schemas.schemas import (
    PrakritiQuestionnaireInput,
    PrakritiResponse,
    HomeopathyRepertoryRequest,
    HomeopathyRepertoryResponse
)
from ..services.ayush_engine import ayush_clinical_engine

router = APIRouter(prefix="/ayush", tags=["Ayush Clinical Decision Support"])

@router.post("/prakriti", response_model=PrakritiResponse)
def calculate_prakriti_score(payload: PrakritiQuestionnaireInput):
    """Calculates Vata, Pitta, Kapha Tridosha score and generates Pathya/Apathya lifestyle advice."""
    res = ayush_clinical_engine.calculate_prakriti(payload.dict())
    return PrakritiResponse(**res)

@router.post("/repertorize", response_model=HomeopathyRepertoryResponse)
def repertorize_homeopathy(payload: HomeopathyRepertoryRequest):
    """Homeopathic repertorization based on Kent & Boericke rubrics."""
    res = ayush_clinical_engine.repertorize_homeopathy(payload.symptoms, payload.modalities)
    return HomeopathyRepertoryResponse(**res)

@router.get("/namaste-mappings")
def get_namaste_mappings(query: Optional[str] = ""):
    """Returns official Ayush Morbidity Codes (NAMASTE Portal) mapped to WHO ICD-11 and ICD-10."""
    return ayush_clinical_engine.get_namaste_mappings(query)
