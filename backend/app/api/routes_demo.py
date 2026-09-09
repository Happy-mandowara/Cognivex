import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.models import (
    Patient,
    Encounter,
    AyushAssessment,
    ClinicalSummary,
    Prescription,
    DocumentRecord,
    AbhaConsent,
    FhirBundleRecord
)
from ..services.nlp_extractor import clinical_nlp_extractor
from ..services.ayush_engine import ayush_clinical_engine
from ..services.ocr_engine import document_ocr_engine
from ..services.fhir_builder import fhir_builder
from ..services.abdm_mock import mock_abdm_gateway
from ..schemas.schemas import DemoRunResponse

router = APIRouter(prefix="/demo", tags=["SIH 2026 PS-26047 One-Click Demo"])

@router.post("/run", response_model=DemoRunResponse)
def run_sih_demo(db: Session = Depends(get_db)):
    """
    Executes the complete one-click SIH PS-26047 demo:
    Patient (Ananya Sharma) -> Kiosk Case Taking (SOCRATES) -> AI Extraction ->
    Ayush Assessment (Tridosha & Kent Rubrics) -> Document OCR -> Doctor Summary (SOAP) ->
    Prescription (Ayush + Allopathic) -> FHIR R4 Bundle -> Mock ABDM Exchange.
    """
    # 1. Clear previous demo records for clean state
    demo_patient_id = "P-ANANYA-DEMO"
    existing_patient = db.query(Patient).filter(Patient.id == demo_patient_id).first()
    if existing_patient:
        db.delete(existing_patient)
        db.commit()

    # 2. Register Ananya Sharma with verified ABHA ID
    patient = Patient(
        id=demo_patient_id,
        name="Ananya Sharma",
        age=34,
        gender="Female",
        phone="+91 98765 43210",
        abha_id="91-8742-9901-2341",
        abha_address="ananya.sharma@abdm",
        has_consented=True,
        language="en"
    )
    db.add(patient)
    db.flush()

    # 3. Kiosk Case-Taking with SOCRATES
    encounter_id = "ENC-ANANYA-DEMO"
    chief_complaint = "Severe throbbing headache for 3 days, aggravated by sunlight and heat, with nausea and photophobia"
    
    socrates_data = {
        "site": "Right Temple & Forehead",
        "onset": "Gradually worsening over past 3 days after afternoon sun exposure",
        "character": "Throbbing / Pulsating burning headache",
        "radiation": "Spreads behind right eye and temporal ridge",
        "associations": ["Nausea", "Extreme photophobia (sensitivity to sunlight)", "Mild dizziness"],
        "time_course": "Peaks in afternoon sun; continuous dull ache between episodes",
        "exacerbating_relieving": "Worse in bright sunlight and heat; better in a cool dark room with cold compress",
        "severity": 8
    }

    vitals_data = {
        "bp": "118/76 mmHg",
        "pulse": "84 bpm",
        "temperature": "98.6 °F",
        "spo2": "99%",
        "respiratory_rate": "16 /min"
    }

    general_history_data = {
        "hpi": "34-year-old female software professional reports recurring right temporal headache episodes for 4 months, now acutely intensified since 3 days after continuous outdoor sun exposure during travel.",
        "past_history": ["Mild hyperacidity (Amlapitta) on irregular meals", "Iron deficiency anemia treated in 2025"],
        "current_medications": ["Tab Paracetamol 650mg SOS", "Cap Pantoprazole 40mg PRN"],
        "allergies": ["NSAIDs (Mild gastric distress / gastritis)", "No known drug allergies to Penicillin"],
        "family_history": ["Mother has history of migraine headaches"],
        "personal_habits": {
            "diet": "Vegetarian, preference for spicy and pungent foods (Vidahi Ahara)",
            "sleep": "6 hours, disturbed when stressed",
            "stress_level": "Moderate to high"
        }
    }

    # Clinical NLP Extraction
    nlp_text = f"{chief_complaint}. Site: {socrates_data['site']}. Triggers: {socrates_data['exacerbating_relieving']}."
    nlp_result = clinical_nlp_extractor.extract_entities(nlp_text)

    encounter = Encounter(
        id=encounter_id,
        patient_id=patient.id,
        chief_complaint=chief_complaint,
        status="WAITING_DOCTOR",
        triage_priority="HIGH", # High due to severity 8/10
        red_flags=[], # Screened, no thunderclap/meningismus detected
        vitals=vitals_data,
        socrates=socrates_data,
        general_history=general_history_data
    )
    db.add(encounter)
    db.flush()

    # 4. Ayush Clinical Engine Assessment
    prakriti_scores = ayush_clinical_engine.calculate_prakriti({
        "body_frame": "moderate",
        "skin_texture": "warm_sensitive",
        "digestion": "strong_acidic",
        "weather_preference": "cool",
        "sleep_pattern": "moderate",
        "mind_nature": "sharp_irritable"
    })

    homeo_scores = ayush_clinical_engine.repertorize_homeopathy(
        symptoms=["Severe throbbing headache", "Nausea", "Photophobia"],
        modalities=["Exposure to sunlight", "Warm weather"]
    )

    ashtavidha_data = {
        "nadi": "Manduka Gati (Frog-leap, Pitta dominant, fast bounding)",
        "jihva": "Rakta Varna with mild yellow coating (Pitta indicative)",
        "mutra": "Peeta Varna (Yellowish, mildly acidic)",
        "mala": "Normal with mild Vibandha (dry stool tendency)",
        "shabda": "Prakrita / Clear articulation",
        "sparsha": "Ushna (Warm skin surface temperature)",
        "drik": "Raktaksha (Mild scleral redness, photophobic)",
        "akriti": "Madhyama (Medium athletic build)"
    }

    ayush_assessment = AyushAssessment(
        id="AYU-ANANYA-DEMO",
        encounter_id=encounter.id,
        patient_id=patient.id,
        vata_score=28.0,
        pitta_score=58.0,
        kapha_score=14.0,
        dominant_prakriti="Pitta",
        vikriti_state="Pitta Prakopa (Excessive Pitta vitiation with Vata Anubandha)",
        ashtavidha_pariksha=ashtavidha_data,
        dashavidha_pariksha={"satva": "Pravara", "satmya": "Mishra", "ahara_shakti": "Madhyama", "vyayama_shakti": "Madhyama"},
        homeopathy_rubrics=homeo_scores["top_remedies"],
        namaste_icd_codes=ayush_clinical_engine.get_namaste_mappings("Shirashoola")
    )
    db.add(ayush_assessment)

    # 5. Document OCR
    ocr_data = document_ocr_engine.parse_document(document_type="Lab Report", sample_key="ananya_lab_report")
    doc_record = DocumentRecord(
        id="DOC-ANANYA-DEMO",
        patient_id=patient.id,
        document_name=ocr_data["document_name"],
        doc_type=ocr_data["doc_type"],
        document_date=ocr_data["document_date"],
        raw_text=ocr_data["raw_text"],
        extracted_medicines=ocr_data["extracted_medicines"],
        extracted_diagnoses=ocr_data["extracted_diagnoses"],
        extracted_lab_values=ocr_data["extracted_lab_values"]
    )
    db.add(doc_record)

    # 6. Doctor Clinical Summary (SOAP Format)
    soap_subjective = (
        "34-year-old female presents with acute severe throbbing headache (8/10) localized to right temple and forehead for 3 days. "
        "Triggered and acutely worsened by direct sun exposure. Accompanied by nausea, photophobia, and ocular discomfort. "
        "Relieved by resting in dark quiet room. Past history of mild hyperacidity."
    )
    soap_objective = (
        "BP: 118/76 mmHg | Pulse: 84 bpm | Temp: 98.6 °F | SpO2: 99%. "
        "No meningeal signs, no focal neurological deficits. Normal pupillary reflex. "
        "Ayush Pariksha: Manduka Gati pulse (Pitta), Ushna sparsha, Rakta Jihva with mild Pitta coating. "
        "Recent Lab (28-Aug-2026): Hb 11.2 g/dL (Mild microcytic anemia), Serum Ferritin 14 ng/mL, ESR 18 mm/hr."
    )
    soap_assessment = (
        "1. Pittaja Shirashoola (Ayurveda) / Migraine without aura (ICD-11: 8A80.0, ICD-10: G43.0). "
        "2. Homeopathic Differential: Glonoinum (sun stroke/congestive headache), Belladonna (vascular throbbing). "
        "3. Mild Iron Deficiency Anemia (contributing to headache threshold lowering)."
    )
    soap_plan = (
        "1. Immediate avoidance of direct sunlight/noon heat (Atapa Sevana Varjana).\n"
        "2. Ayush Pharmacotherapy: Sutshekhar Ras (Gold/Swarna yukta) 125mg BD with ghee; Kamdudha Ras (Moti yukta) 250mg BD.\n"
        "3. Pratimarsha Nasya with pure Cow Ghee (2 drops each nostril morning).\n"
        "4. Sheetali & Sheetkari Pranayama 10 mins daily.\n"
        "5. Review with attending physician in 7 days."
    )

    clinical_summary = ClinicalSummary(
        id="CS-ANANYA-DEMO",
        encounter_id=encounter.id,
        patient_id=patient.id,
        soap_subjective=soap_subjective,
        soap_objective=soap_objective,
        soap_assessment=soap_assessment,
        soap_plan=soap_plan,
        extracted_entities=nlp_result,
        doctor_notes="Patient educated on dietary triggers (sour/fermented foods). Safe non-opioid, non-NSAID protocol established.",
        is_verified=True,
        physician_name="Dr. V. K. Sharma (MD, Reg #AYUSH-8823)"
    )
    db.add(clinical_summary)

    # 7. Prescription Generation
    meds = [
        {
            "name": "Sutshekhar Ras (Swarna Yukta)",
            "dosage": "125 mg",
            "frequency": "BD (Twice daily)",
            "duration": "14 days",
            "system": "Ayurveda",
            "instructions": "Take after meals with warm water or cow ghee. Balances Pitta and relieves vascular headache."
        },
        {
            "name": "Kamdudha Ras (Mouktika Yukta)",
            "dosage": "250 mg",
            "frequency": "BD (Twice daily)",
            "duration": "14 days",
            "system": "Ayurveda",
            "instructions": "Take 30 mins before meals. Neutralizes Pitta acidity and burning sensation."
        },
        {
            "name": "Tab Paracetamol (Dolo 650)",
            "dosage": "650 mg",
            "frequency": "SOS (Only if severe pain)",
            "duration": "3 days",
            "system": "Allopathy",
            "instructions": "Take after meals; maximum 3 tablets in 24 hours."
        }
    ]

    prescription = Prescription(
        id="RX-ANANYA-DEMO",
        encounter_id=encounter.id,
        patient_id=patient.id,
        medications=meds,
        dietary_advice="Pathya: Coconut water, pomegranates, sweet ripe fruits, coriander water. Apathya: Strictly avoid noon sun, excessive chili, vinegar, tea/coffee on empty stomach.",
        follow_up_date="After 7 days",
        physician_signed=True
    )
    db.add(prescription)

    # 8. ABDM Milestone 2 Consent
    consent_dict = mock_abdm_gateway.generate_consent_artefact(
        patient_id=patient.id,
        abha_address=patient.abha_address,
        hiu_id="MEDIKIOSK_OPD_01"
    )
    consent = AbhaConsent(
        id="CONS-ANANYA-DEMO",
        patient_id=patient.id,
        consent_artefact_id=consent_dict["consent_id"],
        purpose=consent_dict["purpose"]["text"],
        status="GRANTED"
    )
    db.add(consent)

    # 9. HL7 FHIR R4 Bundle Generation
    bundle_json = fhir_builder.build_bundle(
        patient_data={
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "abha_id": patient.abha_id,
            "abha_address": patient.abha_address
        },
        encounter_data={
            "id": encounter.id,
            "chief_complaint": encounter.chief_complaint,
            "status": encounter.status
        },
        ayush_data={
            "dominant_dosha": "Pitta",
            "vata_percentage": 28.0,
            "pitta_percentage": 58.0,
            "kapha_percentage": 14.0
        },
        prescription_data={"medications": meds}
    )

    fhir_record = FhirBundleRecord(
        id="BND-ANANYA-DEMO",
        encounter_id=encounter.id,
        patient_id=patient.id,
        bundle_id=bundle_json["id"],
        bundle_type="collection",
        resource_count=bundle_json["total"],
        payload=bundle_json,
        abdm_status="DISPATCHED_TO_HIS"
    )
    db.add(fhir_record)

    # 10. ABDM Milestone 3 Simulated Data Exchange
    exchange_res = mock_abdm_gateway.simulate_data_exchange(
        consent_id=consent_dict["consent_id"],
        fhir_bundle=bundle_json
    )

    db.commit()

    return DemoRunResponse(
        status="SUCCESS",
        patient={
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "abha_id": patient.abha_id,
            "abha_address": patient.abha_address
        },
        encounter={
            "id": encounter.id,
            "chief_complaint": encounter.chief_complaint,
            "triage_priority": encounter.triage_priority,
            "severity": 8,
            "vitals": vitals_data,
            "socrates": socrates_data
        },
        ayush={
            "dominant_dosha": "Pitta",
            "vata_percentage": 28.0,
            "pitta_percentage": 58.0,
            "kapha_percentage": 14.0,
            "vikriti": ayush_assessment.vikriti_state,
            "homeopathy_top_remedy": homeo_scores["top_remedies"][0] if homeo_scores["top_remedies"] else {}
        },
        ocr_document={
            "document_name": doc_record.document_name,
            "extracted_lab_values": doc_record.extracted_lab_values
        },
        clinical_summary={
            "id": clinical_summary.id,
            "soap_subjective": soap_subjective,
            "soap_assessment": soap_assessment,
            "physician_name": clinical_summary.physician_name,
            "is_verified": True
        },
        prescription={
            "id": prescription.id,
            "medications": meds,
            "dietary_advice": prescription.dietary_advice
        },
        fhir_bundle={
            "bundle_id": bundle_json["id"],
            "total_resources": bundle_json["total"],
            "resource_types": ["Patient", "Encounter", "Condition", "Observation", "MedicationRequest"]
        },
        abdm_status={
            "M1_ABHA": "VERIFIED (91-8742-9901-2341)",
            "M2_CONSENT": f"GRANTED ({consent_dict['consent_id']})",
            "M3_EXCHANGE": f"DISPATCHED_TO_HIS ({exchange_res['transaction_id'][:12]}...)"
        },
        message="SIH 2026 PS-26047 Complete Demo Workflow initialized for Ananya Sharma (34/F)."
    )
