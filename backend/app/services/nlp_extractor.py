import re
from typing import Dict, List, Any

# Knowledge base for clinical entity extraction
SYMPTOM_MAP = {
    # English & Hindi/Hinglish terms mapped to standard clinical terms
    "headache": "Headache (Cephalea)",
    "head ache": "Headache (Cephalea)",
    "sir dard": "Headache (Cephalea)",
    "sar dard": "Headache (Cephalea)",
    "throbbing headache": "Throbbing Temporal Headache",
    "migraine": "Migraine-type Headache",
    "nausea": "Nausea",
    "jee michlana": "Nausea",
    "vomiting": "Vomiting",
    "ulti": "Vomiting",
    "fever": "Pyrexia / Fever",
    "bukhar": "Pyrexia / Fever",
    "dizziness": "Vertigo / Dizziness",
    "chakkar": "Vertigo / Dizziness",
    "photophobia": "Photophobia (Light sensitivity)",
    "light sensitivity": "Photophobia (Light sensitivity)",
    "phonophobia": "Phonophobia (Sound sensitivity)",
    "chest pain": "Precordial Chest Pain",
    "chaati me dard": "Precordial Chest Pain",
    "shortness of breath": "Dyspnea (Shortness of breath)",
    "saans phoolna": "Dyspnea (Shortness of breath)",
    "abdominal pain": "Abdominal Pain",
    "pet dard": "Abdominal Pain",
    "acidity": "Hyperacidity / Amlapitta",
    "heartburn": "Pyrosis / Heartburn",
    "joint pain": "Arthralgia / Joint Pain",
    "jodon me dard": "Arthralgia / Joint Pain",
    "fatigue": "Generalized Malaise / Fatigue",
    "kamzori": "Generalized Malaise / Fatigue",
    "burning sensation": "Daha (Burning Sensation)",
    "jalan": "Daha (Burning Sensation)",
    "neck stiffness": "Nuchal Rigidity / Neck Stiffness",
    "gardan me akdan": "Nuchal Rigidity / Neck Stiffness"
}

AGGRAVATING_TRIGGERS = [
    ("sunlight", "Exposure to Sunlight / Radiant Heat"),
    ("sun", "Exposure to Sunlight / Heat"),
    ("dhoop", "Exposure to Sunlight (Atapa Sevana)"),
    ("heat", "High Ambient Temperature"),
    ("garmi", "High Ambient Temperature"),
    ("motion", "Movement / Physical Exertion"),
    ("hilne se", "Movement / Physical Exertion"),
    ("noise", "Loud Sounds / Acoustic Stress"),
    ("shor", "Loud Sounds / Acoustic Stress"),
    ("stress", "Mental Exertion & Stress"),
    ("spicy food", "Spicy / Pungent Food (Katu/Vidahi Ahara)"),
    ("masaledar khana", "Spicy / Pungent Food"),
    ("empty stomach", "Fasting / Delayed Meals (Langhana)")
]

RELIEVING_TRIGGERS = [
    ("dark room", "Resting in a Quiet Dark Room"),
    ("andhere kamre", "Resting in a Dark Room"),
    ("rest", "Physical & Mental Rest"),
    ("aaram", "Physical & Mental Rest"),
    ("cold compress", "Cold Application / Shita Upachara"),
    ("thanda kapda", "Cold Application"),
    ("sleep", "Sleep / Nidra"),
    ("sona", "Sleep / Nidra"),
    ("pressure", "External Firm Pressure on Head")
]

ANATOMY_PATTERNS = [
    ("right temporal", "Right Temporal Region"),
    ("left temporal", "Left Temporal Region"),
    ("temporal", "Temporal Region"),
    ("forehead", "Frontal / Forehead"),
    ("matha", "Frontal / Forehead"),
    ("occipital", "Occipital / Back of Head"),
    ("vertex", "Vertex / Crown of Head"),
    ("right sided", "Hemicrania (Right sided)"),
    ("left sided", "Hemicrania (Left sided)"),
    ("chest", "Substernal / Chest"),
    ("epigastric", "Epigastrium"),
    ("right knee", "Right Knee Joint"),
    ("lumbar", "Lumbosacral Spine")
]

RED_FLAG_PATTERNS = [
    ("sudden thunderclap", "Thunderclap headache - rule out Subarachnoid Hemorrhage (SAH)"),
    ("worst headache of life", "First/worst severe headache - urgent neurological evaluation"),
    ("neck stiffness", "Meningismus / Neck rigidity - rule out Meningitis/Encephalitis"),
    ("gardan me akdan", "Meningismus / Neck rigidity - rule out Meningitis"),
    ("fever with rash", "Petechial rash with pyrexia - urgent infection triage"),
    ("chest pain radiating", "Anginal chest pain radiating to left arm/jaw - rule out Acute Coronary Syndrome (ACS)"),
    ("loss of consciousness", "Syncope / Altered mental sensorium - immediate critical care alert"),
    ("behoshi", "Syncope / Loss of consciousness - immediate critical care alert"),
    ("hemoptysis", "Hemoptysis (Coughing blood) - respiratory emergency"),
    ("weakness in arm", "Acute focal neurological deficit - rule out Acute Ischemic Stroke")
]

ALLERGY_PATTERNS = [
    ("penicillin", "Penicillin / Beta-lactams"),
    ("sulfa", "Sulfonamides"),
    ("nsaids", "NSAIDs / Aspirin"),
    ("paracetamol", "Paracetamol"),
    ("peanuts", "Peanuts"),
    ("egg", "Egg protein"),
    ("dust", "Dust / Environmental pollen")
]

MEDICATION_PATTERNS = [
    ("paracetamol", "Paracetamol 650mg"),
    ("dolo", "Dolo 650 (Paracetamol)"),
    ("crocin", "Crocin (Paracetamol)"),
    ("pantoprazole", "Pantoprazole 40mg"),
    ("pantocid", "Pantoprazole"),
    ("omeprazole", "Omeprazole 20mg"),
    ("cetirizine", "Cetirizine 10mg"),
    ("metformin", "Metformin 500mg"),
    ("amlodipine", "Amlodipine 5mg"),
    ("telmisartan", "Telmisartan 40mg")
]

class ClinicalNLPExtractor:
    """Intelligent rule-based Clinical NLP entity extractor with bilingual support (English & Hindi/Hinglish)."""
    
    def extract_entities(self, text: str, language: str = "en") -> Dict[str, Any]:
        normalized_text = text.lower()
        extracted_symptoms: List[str] = []
        entities_list: List[Dict[str, Any]] = []

        # 1. Extract Symptoms
        for phrase, canonical in SYMPTOM_MAP.items():
            if re.search(r'\b' + re.escape(phrase) + r'\b', normalized_text):
                if canonical not in extracted_symptoms:
                    extracted_symptoms.append(canonical)
                    entities_list.append({
                        "category": "Symptom",
                        "value": canonical,
                        "confidence": 0.95
                    })

        # 2. Extract Duration
        duration = None
        duration_match = re.search(r'(\d+)\s*(days?|din|weeks?|hafte|months?|mahine|hours?|ghante)', normalized_text)
        if duration_match:
            qty, unit = duration_match.groups()
            duration = f"{qty} {unit}"
            entities_list.append({
                "category": "Duration",
                "value": duration,
                "confidence": 0.98
            })

        # 3. Extract Anatomical Site
        site = None
        for kw, canonical in ANATOMY_PATTERNS:
            if re.search(r'\b' + re.escape(kw) + r'\b', normalized_text):
                site = canonical
                entities_list.append({
                    "category": "Anatomy",
                    "value": canonical,
                    "confidence": 0.92
                })
                break

        # 4. Extract Aggravating Factors
        aggravating: List[str] = []
        for kw, canonical in AGGRAVATING_TRIGGERS:
            if kw in normalized_text:
                if canonical not in aggravating:
                    aggravating.append(canonical)
                    entities_list.append({
                        "category": "Aggravating",
                        "value": canonical,
                        "confidence": 0.90
                    })

        # 5. Extract Relieving Factors
        relieving: List[str] = []
        for kw, canonical in RELIEVING_TRIGGERS:
            if kw in normalized_text:
                if canonical not in relieving:
                    relieving.append(canonical)
                    entities_list.append({
                        "category": "Relieving",
                        "value": canonical,
                        "confidence": 0.90
                    })

        # 6. Extract Severity Score
        severity = 6 # default moderate
        sev_match = re.search(r'(severity|scale|score|rate|dard)\s*(?:is|of|hai)?\s*(\d{1,2})', normalized_text)
        if sev_match:
            val = int(sev_match.group(2))
            if 1 <= val <= 10:
                severity = val
        elif "severe" in normalized_text or "bohot tez" in normalized_text or "unbearable" in normalized_text:
            severity = 8
        elif "moderate" in normalized_text or "theek theek" in normalized_text:
            severity = 5
        elif "mild" in normalized_text or "halka" in normalized_text:
            severity = 3
        
        entities_list.append({
            "category": "Severity",
            "value": f"{severity}/10",
            "confidence": 0.94
        })

        # 7. Check Red Flags
        red_flags: List[str] = []
        for kw, warning in RED_FLAG_PATTERNS:
            if kw in normalized_text:
                red_flags.append(warning)
                entities_list.append({
                    "category": "RedFlag",
                    "value": warning,
                    "confidence": 0.99
                })

        # 8. Check Allergies
        allergies: List[str] = []
        for kw, allergy_name in ALLERGY_PATTERNS:
            if f"allergy to {kw}" in normalized_text or f"allergic to {kw}" in normalized_text or f"{kw} allergy" in normalized_text:
                allergies.append(allergy_name)
                entities_list.append({
                    "category": "Allergy",
                    "value": allergy_name,
                    "confidence": 0.96
                })

        # 9. Check Prior Medications
        medications: List[str] = []
        for kw, med_name in MEDICATION_PATTERNS:
            if kw in normalized_text:
                if med_name not in medications:
                    medications.append(med_name)
                    entities_list.append({
                        "category": "Medication",
                        "value": med_name,
                        "confidence": 0.92
                    })

        return {
            "symptoms": extracted_symptoms if extracted_symptoms else ["Generalized discomfort"],
            "duration": duration if duration else "3 days",
            "anatomical_site": site if site else "Head / Cranial",
            "severity_score": severity,
            "aggravating_factors": aggravating,
            "relieving_factors": relieving,
            "allergies": allergies,
            "medications": medications,
            "red_flags": red_flags,
            "entities": entities_list
        }

clinical_nlp_extractor = ClinicalNLPExtractor()
