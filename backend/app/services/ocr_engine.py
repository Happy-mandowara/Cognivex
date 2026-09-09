import re
from typing import Dict, List, Any

DEMO_DOCUMENT_TEMPLATES = {
    "ananya_lab_report": {
        "document_name": "Thyrocare_CBC_Ferritin_Panel_Ananya.pdf",
        "doc_type": "Lab Report",
        "document_date": "2026-08-28",
        "extracted_diagnoses": ["Mild Microcytic Hypochromic Anemia", "Serum Ferritin Deficiency"],
        "extracted_medicines": [],
        "extracted_lab_values": [
            {
                "test_name": "Hemoglobin (Hb)",
                "result_value": "11.2",
                "unit": "g/dL",
                "reference_range": "12.0 - 15.5",
                "status": "LOW"
            },
            {
                "test_name": "Total Leucocyte Count (TLC)",
                "result_value": "7,400",
                "unit": "/uL",
                "reference_range": "4,000 - 11,000",
                "status": "NORMAL"
            },
            {
                "test_name": "Platelet Count",
                "result_value": "245,000",
                "unit": "/uL",
                "reference_range": "150,000 - 450,000",
                "status": "NORMAL"
            },
            {
                "test_name": "Erythrocyte Sedimentation Rate (ESR)",
                "result_value": "18",
                "unit": "mm/1st hr",
                "reference_range": "0 - 20",
                "status": "NORMAL"
            },
            {
                "test_name": "Serum Ferritin",
                "result_value": "14",
                "unit": "ng/mL",
                "reference_range": "15 - 150",
                "status": "LOW"
            },
            {
                "test_name": "Random Blood Sugar (RBS)",
                "result_value": "96",
                "unit": "mg/dL",
                "reference_range": "70 - 140",
                "status": "NORMAL"
            }
        ],
        "raw_text": (
            "THYROCARE DIAGNOSTICS - CENTRAL LAB REPORT\n"
            "Patient: Ananya Sharma | Age: 34 Y | Sex: Female | Ref: Dr. A. K. Verma\n"
            "Date: 28-Aug-2026 | Sample: Whole Blood EDTA & Serum\n"
            "===========================================================\n"
            "TEST NAME                  RESULT       UNIT      REF RANGE\n"
            "Hemoglobin (Hb)            11.2 (L)     g/dL      12.0 - 15.5\n"
            "Total Leucocyte Count      7,400        /uL       4000 - 11000\n"
            "Platelet Count             245,000      /uL       150000 - 450000\n"
            "ESR (Westergren)           18           mm/hr     0 - 20\n"
            "Serum Ferritin             14 (L)       ng/mL     15 - 150\n"
            "Random Blood Sugar (RBS)   96           mg/dL     70 - 140\n"
            "Impression: Mild hypochromic microcytic picture, low ferritin storage. Baseline normal inflammatory markers."
        )
    },
    "prior_prescription": {
        "document_name": "Apollo_Clinic_OPD_Rx_Ananya.pdf",
        "doc_type": "Prescription",
        "document_date": "2026-08-10",
        "extracted_diagnoses": ["Acute Cephalea", "Mild Dyspepsia"],
        "extracted_medicines": [
            {
                "name": "Tab Paracetamol (Dolo 650)",
                "dosage": "650 mg",
                "frequency": "SOS (as needed for pain, max 3 times daily)",
                "duration": "3 days",
                "instructions": "Take after meals with water"
            },
            {
                "name": "Cap Pantoprazole (Pantocid 40)",
                "dosage": "40 mg",
                "frequency": "OD (Once daily)",
                "duration": "7 days",
                "instructions": "Take 30 mins before breakfast"
            }
        ],
        "extracted_lab_values": [],
        "raw_text": (
            "APOLLO CLINIC - OUTPATIENT DEPARTMENT\n"
            "Date: 10-Aug-2026 | Dr. R. K. Iyer, MBBS, MD\n"
            "Patient: Ananya Sharma | 34 / F\n"
            "Diagnosis: Episodic Cephalea with Mild Dyspepsia\n"
            "Rx:\n"
            "1. Tab Paracetamol 650mg - 1 tab SOS (Max TDS) x 3 days\n"
            "2. Cap Pantoprazole 40mg - 1 cap OD (before breakfast) x 7 days\n"
            "Advice: Drink plenty of water, avoid direct sunlight between 11 AM - 3 PM."
        )
    }
}

class DocumentOCREngine:
    """Intelligent rule-based OCR engine for extracting medicines, lab values, and diagnoses."""

    def parse_document(self, document_type: str = "Lab Report", sample_key: str = "ananya_lab_report", custom_text: str = None) -> Dict[str, Any]:
        if custom_text and len(custom_text.strip()) > 10:
            return self._extract_from_custom_text(custom_text, document_type)
        
        # Use verified template if available
        if sample_key in DEMO_DOCUMENT_TEMPLATES:
            return DEMO_DOCUMENT_TEMPLATES[sample_key]
        elif document_type == "Prescription":
            return DEMO_DOCUMENT_TEMPLATES["prior_prescription"]
        else:
            return DEMO_DOCUMENT_TEMPLATES["ananya_lab_report"]

    def _extract_from_custom_text(self, text: str, doc_type: str) -> Dict[str, Any]:
        medicines = []
        lab_values = []
        diagnoses = []
        date = "2026-09-01"

        # Regex for dates (e.g., 28-Aug-2026 or 2026-08-28 or 28/08/2026)
        date_match = re.search(r'(\d{1,2}[-/][A-Za-z0-9]{3,}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})', text)
        if date_match:
            date = date_match.group(1)

        # Regex for common medicines
        med_matches = re.findall(r'(?:Tab|Cap|Syp|Inj)?\.?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(\d+\s*(?:mg|gm|ml))\s*[-–]?\s*([A-Za-z0-9\s]+)?', text, re.IGNORECASE)
        for name, dose, freq in med_matches:
            medicines.append({
                "name": name.strip(),
                "dosage": dose.strip(),
                "frequency": freq.strip() if freq else "As directed",
                "duration": "5 days",
                "instructions": "Oral"
            })

        # Regex for common lab tests
        lab_patterns = [
            (r'Hemoglobin\s*(?:[\(]Hb[\)])?\s*[:=]?\s*([\d\.]+)\s*(g/dL)?', "Hemoglobin (Hb)", "g/dL", "12.0 - 15.5", 12.0, 15.5),
            (r'TLC\s*[:=]?\s*([\d,\.]+)\s*(/uL)?', "Total Leucocyte Count (TLC)", "/uL", "4,000 - 11,000", 4000, 11000),
            (r'Platelets?\s*[:=]?\s*([\d,\.]+)\s*(/uL)?', "Platelet Count", "/uL", "150,000 - 450,000", 150000, 450000),
            (r'Ferritin\s*[:=]?\s*([\d\.]+)\s*(ng/mL)?', "Serum Ferritin", "ng/mL", "15 - 150", 15, 150),
            (r'ESR\s*[:=]?\s*([\d\.]+)\s*(mm/hr)?', "ESR", "mm/hr", "0 - 20", 0, 20),
            (r'Sugar\s*[:=]?\s*([\d\.]+)\s*(mg/dL)?', "Blood Sugar (RBS)", "mg/dL", "70 - 140", 70, 140)
        ]

        for pat, test_name, unit, ref_range, low_lim, high_lim in lab_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val_str = m.group(1).replace(",", "")
                try:
                    val_num = float(val_str)
                    status = "NORMAL"
                    if val_num < low_lim:
                        status = "LOW"
                    elif val_num > high_lim:
                        status = "HIGH"
                except ValueError:
                    status = "NORMAL"

                lab_values.append({
                    "test_name": test_name,
                    "result_value": m.group(1),
                    "unit": unit,
                    "reference_range": ref_range,
                    "status": status
                })

        return {
            "document_name": f"Uploaded_{doc_type.replace(' ', '_')}_{date}.pdf",
            "doc_type": doc_type,
            "document_date": date,
            "extracted_medicines": medicines,
            "extracted_diagnoses": ["Clinical observation extracted via OCR"],
            "extracted_lab_values": lab_values,
            "raw_text": text
        }

document_ocr_engine = DocumentOCREngine()
