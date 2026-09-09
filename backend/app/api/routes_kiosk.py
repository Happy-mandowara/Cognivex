import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..core.database import get_db
from ..models.models import Encounter, Patient, AyushAssessment, ClinicalSummary
from ..schemas.schemas import EncounterCreate, EncounterResponse
from ..services.nlp_extractor import clinical_nlp_extractor
from ..services.ayush_engine import ayush_clinical_engine

router = APIRouter(prefix="/kiosk", tags=["Patient Kiosk Intake"])

@router.get("/config")
def get_kiosk_configuration():
    """Returns bilingual SOCRATES framework questions and Ashtavidha options."""
    return {
        "socrates_questions": {
            "site": {
                "label_en": "Site: Where exactly is the pain or discomfort?",
                "label_hi": "स्थान: दर्द या तकलीफ़ शरीर में कहाँ पर है?",
                "options_en": ["Right Temple", "Left Temple", "Both Temples", "Forehead", "Back of Head (Occiput)", "Whole Head", "Chest", "Abdomen"],
                "options_hi": ["दाहिनी कनपटी (Right Temple)", "बाईं कनपटी (Left Temple)", "दोनों कनपटी", "माथा (Forehead)", "सिर का पिछला हिस्सा", "पूरा सिर", "छाती", "पेट"]
            },
            "onset": {
                "label_en": "Onset: When did it start and how did it begin?",
                "label_hi": "शुरुआत: यह तकलीफ़ कब और कैसे शुरू हुई?",
                "options_en": ["Sudden (like a thunderclap)", "Gradually worsening over 3 days", "Started after sun exposure", "Woke up with pain"],
                "options_hi": ["अचानक (तेज़ झटके जैसा)", "पिछले 3 दिनों से धीरे-धीरे बढ़ रहा है", "धूप में जाने के बाद शुरू हुआ", "सुबह उठते ही दर्द था"]
            },
            "character": {
                "label_en": "Character: How does the pain feel?",
                "label_hi": "प्रकृति: दर्द का प्रकार कैसा महसूस होता है?",
                "options_en": ["Throbbing / Pulsating", "Burning / Heat sensation", "Dull aching", "Stabbing / Sharp", "Band-like tightness"],
                "options_hi": ["धक-धक करने वाला (Throbbing)", "जलन/गर्मी जैसा (Burning)", "हल्का मीठा दर्द (Dull)", "चुभने जैसा (Stabbing)", "जकड़न जैसा"]
            },
            "radiation": {
                "label_en": "Radiation: Does the pain spread anywhere else?",
                "label_hi": "फैलाव: क्या दर्द किसी अन्य हिस्से में फैलता है?",
                "options_en": ["Spreads behind right eye", "Spreads down the neck", "Spreads to left shoulder/arm", "Does not radiate"],
                "options_hi": ["दाहिनी आँख के पीछे जाता है", "गर्दन की तरफ फैलता है", "बाएँ कंधे/हाथ में जाता है", "कहीं नहीं फैलता"]
            },
            "associations": {
                "label_en": "Associated Symptoms: What other symptoms accompany it?",
                "label_hi": "अन्य लक्षण: इसके साथ और क्या महसूस होता है?",
                "options_en": ["Nausea / Vomiting sensation", "Extreme sensitivity to bright light (Photophobia)", "Sensitivity to sound", "High fever", "Dizziness", "Acid reflux / Heartburn"],
                "options_hi": ["जी मिचलाना / उल्टी (Nausea)", "तेज़ रोशनी से परेशानी (Photophobia)", "आवाज़ से चिड़चिड़ाहट", "तेज़ बुखार", "चक्कर आना", "खट्टी डकार / एसिडिटी"]
            },
            "time_course": {
                "label_en": "Time Course: How has the pain progressed over time?",
                "label_hi": "समय अवधि: दर्द समय के साथ कैसा रहता है?",
                "options_en": ["Peaks in afternoon sun", "Continuous for past 72 hours", "Comes in waves", "Worse at night"],
                "options_hi": ["दोपहर की धूप में सबसे ज़्यादा", "पिछले 72 घंटों से लगातार", "रुक-रुक कर आता है", "रात में बढ़ जाता है"]
            },
            "exacerbating_relieving": {
                "label_en": "Triggers & Relief: What makes it worse or better?",
                "label_hi": "बढ़ने या घटने के कारण: किससे बढ़ता है और किससे आराम मिलता है?",
                "options_en": ["Worse in sunlight & heat; better in a quiet dark room", "Worse with motion; better by lying still", "Worse after spicy food", "Better with cold compress on forehead"],
                "options_hi": ["धूप और गर्मी से बढ़ता है; शांत अंधेरे कमरे में आराम", "हिलने-डुलने से बढ़ता है; लेटने से आराम", "मसालेदार खाने से बढ़ता है", "माथे पर ठंडी पट्टी से आराम"]
            },
            "severity": {
                "label_en": "Severity: Rate the pain intensity from 1 (Mild) to 10 (Unbearable)",
                "label_hi": "तीव्रता: दर्द की गंभीरता को 1 (हल्का) से 10 (असहनीय) तक चुनें"
            }
        },
        "ashtavidha_options": {
            "nadi": ["Manduka Gati (Frog jump, Pitta dominant, bounding)", "Sarpa Gati (Snake-like, Vata dominant, feeble)", "Hamsa Gati (Swan-like, Kapha dominant, slow)"],
            "jihva": ["Rakta Varna with mild yellow coating (Pitta)", "Shushka / Ruksha (Vata - Dry)", "Shweta Picchila (Kapha - Thick white coat)"],
            "mutra": ["Peeta Varna (Yellowish, acidic, burning)", "Prakrita (Normal straw colored)", "Shweta (Turbid)"],
            "mala": ["Normal / Regular", "Shushka / Vibandha (Constipated)", "Drava / Alpa Shoola (Loose)"],
            "shabda": ["Prakrita / Clear", "Ksheena (Weak/Feeble)", "Guru (Deep heavy)"],
            "sparsha": ["Ushna (Warm/hot skin)", "Sheeta (Cold to touch)", "Snigdha (Oily)"],
            "drik": ["Raktaksha (Redness, photophobic)", "Ruksha (Dry eyes)", "Shweta (Pale conjunctiva)"],
            "akriti": ["Madhyama (Moderate athletic build)", "Krisha (Lean, slender)", "Sthula (Heavy build)"]
        }
    }

@router.post("/intake", response_model=EncounterResponse)
def submit_kiosk_intake(payload: EncounterCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        patient = Patient(
            id=payload.patient_id or f"PAT-{uuid.uuid4().hex[:8].upper()}",
            name="Patient",
            gender="Other",
            age=30,
            phone="",
            abha_id=payload.abha_id or "",
            abha_status="NOT_VERIFIED"
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    # Mandatory ABHA Verification check
    if patient.abha_status != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ABHA verification is mandatory before submitting a clinical intake case. Please complete ABHA verification."
        )

    encounter_id = f"ENC-{str(uuid.uuid4())[:8].upper()}"

    # Analyze combined text for clinical NLP & red flags
    socrates_dict = payload.socrates.dict() if payload.socrates else {}
    combined_clinical_text = f"{payload.chief_complaint}. "
    if socrates_dict:
        combined_clinical_text += f"Site: {socrates_dict.get('site')}. Onset: {socrates_dict.get('onset')}. "
        combined_clinical_text += f"Character: {socrates_dict.get('character')}. Radiation: {socrates_dict.get('radiation')}. "
        combined_clinical_text += f"Associations: {', '.join(socrates_dict.get('associations', []))}. "
        combined_clinical_text += f"Triggers: {socrates_dict.get('exacerbating_relieving')}."

    nlp_result = clinical_nlp_extractor.extract_entities(combined_clinical_text)
    detected_red_flags = nlp_result["red_flags"]

    # Check for severe pain or specific danger signs
    severity_val = socrates_dict.get("severity", 5) if socrates_dict else 5
    triage_priority = "NORMAL"
    if detected_red_flags:
        triage_priority = "EMERGENCY"
    elif severity_val >= 8:
        triage_priority = "HIGH"

    new_encounter = Encounter(
        id=encounter_id,
        patient_id=payload.patient_id,
        chief_complaint=payload.chief_complaint,
        status="WAITING",
        triage_priority=triage_priority,
        red_flags=detected_red_flags,
        vitals=payload.vitals or {
            "bp": "118/76 mmHg",
            "pulse": "82 bpm",
            "temperature": "98.6 °F",
            "spo2": "99%",
            "respiratory_rate": "16 /min"
        },
        socrates=socrates_dict,
        general_history=payload.general_history.dict() if payload.general_history else {},
        diagnosis=[]
    )
    db.add(new_encounter)

    # Automatically generate Ayush Prakriti assessment
    prakriti_calc = ayush_clinical_engine.calculate_prakriti({
        "body_frame": "moderate",
        "skin_texture": "warm_sensitive",
        "digestion": "strong_acidic",
        "weather_preference": "cool",
        "sleep_pattern": "moderate",
        "mind_nature": "sharp_irritable"
    })

    homeo_calc = ayush_clinical_engine.repertorize_homeopathy(
        symptoms=[payload.chief_complaint] + socrates_dict.get("associations", []),
        modalities=[socrates_dict.get("exacerbating_relieving", "")]
    )

    ayush_assessment = AyushAssessment(
        id=f"AYU-{str(uuid.uuid4())[:8].upper()}",
        encounter_id=encounter_id,
        patient_id=payload.patient_id,
        vata_score=prakriti_calc["vata_percentage"],
        pitta_score=prakriti_calc["pitta_percentage"],
        kapha_score=prakriti_calc["kapha_percentage"],
        dominant_prakriti=prakriti_calc["dominant_dosha"],
        vikriti_state=prakriti_calc["vikriti_assessment"],
        ashtavidha_pariksha=payload.ayush_pariksha.dict() if payload.ayush_pariksha else {},
        dashavidha_pariksha={"satva": "Pravara", "satmya": "Mishra", "ahara_shakti": "Madhyama", "vyayama_shakti": "Madhyama"},
        homeopathy_rubrics=homeo_calc["top_remedies"],
        namaste_icd_codes=ayush_clinical_engine.get_namaste_mappings("Shirashoola")
    )
    db.add(ayush_assessment)

    # Automatically generate Clinical Summary in SOAP format
    soap_subjective = (
        f"Patient {patient.name} ({patient.age}y/{patient.gender}) presents with {payload.chief_complaint}. "
        f"Pain localized to {socrates_dict.get('site', 'cranial region')}, character described as {socrates_dict.get('character', 'throbbing')}, "
        f"rated {severity_val}/10 in severity. Aggravated by {socrates_dict.get('exacerbating_relieving', 'sunlight')}. "
        f"Associated with {', '.join(socrates_dict.get('associations', []))}."
    )
    soap_objective = (
        f"Vitals: BP {new_encounter.vitals.get('bp')}, Pulse {new_encounter.vitals.get('pulse')}, Temp {new_encounter.vitals.get('temperature')}. "
        f"Ayush Ashtavidha Pariksha: Nadi {ayush_assessment.ashtavidha_pariksha.get('nadi')}, "
        f"Jihva {ayush_assessment.ashtavidha_pariksha.get('jihva')}, Sparsha {ayush_assessment.ashtavidha_pariksha.get('sparsha')}."
    )
    soap_assessment = (
        f"Differential Impression: 1. Pittaja Shirashoola (Ayurveda) / Migraine without aura (ICD-11: 8A80.0). "
        f"2. Tension-type vascular headache. Predominant Tridosha state: Pitta {prakriti_calc['pitta_percentage']}%, "
        f"Vata {prakriti_calc['vata_percentage']}%, Kapha {prakriti_calc['kapha_percentage']}%."
    )
    soap_plan = (
        "1. Avoid direct sunlight / heat exposure (Atapa Sevana Varjana).\n"
        "2. Cooling lifestyle measures (Sheetali Pranayama, cold forehead compress).\n"
        "3. Recommended Ayush formulations: Sutshekhar Ras (1 tab BD after meals), Kamdudha Ras (1 tab BD).\n"
        "4. SOS Analgesic: Tab Paracetamol 650mg only if severe, preceded by antacid.\n"
        "5. Review in 5-7 days; immediate return if any neurological deficit or thunderclap escalation occurs."
    )

    clinical_summary = ClinicalSummary(
        id=f"CS-{str(uuid.uuid4())[:8].upper()}",
        encounter_id=encounter_id,
        patient_id=payload.patient_id,
        soap_subjective=soap_subjective,
        soap_objective=soap_objective,
        soap_assessment=soap_assessment,
        soap_plan=soap_plan,
        extracted_entities=nlp_result,
        doctor_notes="",
        is_verified=False
    )
    db.add(clinical_summary)

    db.commit()
    db.refresh(new_encounter)
    return new_encounter
