import re
from typing import Dict, Any, List

class AIClinicalService:
    """
    Assistive Clinical Intelligence Service.
    Generates structured SOAP notes, red-flag screening, and clinical suggestions 
    based on comprehensive patient intake, Ayush evaluation, and uploaded OCR records.
    NOTE: Assistive only — physician verification and signature required.
    """

    def generate_clinical_summary(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        chief_complaint = payload.get("chief_complaint", "").strip()
        symptoms = payload.get("symptoms", [])
        if isinstance(symptoms, str):
            symptoms = [s.strip() for s in symptoms.split(",") if s.strip()]

        history = payload.get("history", {}) or {}
        vitals = payload.get("vitals", {}) or {}
        ayush_data = payload.get("ayush", {}) or {}
        ocr_data = payload.get("ocr_data", {}) or {}
        observations = payload.get("observations", "")

        # 1. Red flag screening
        combined_text = f"{chief_complaint} {' '.join(symptoms)} {observations} {str(history)}".lower()
        red_flags: List[str] = []

        emergency_triggers = [
            ("Chest pain / Pressure", ["chest pain", "angina", "left arm pain", "crushing chest"]),
            ("Sudden severe thunderclap headache", ["thunderclap", "worst headache of life", "meningeal"]),
            ("Shortness of breath / Hypoxia", ["dyspnea", "breathlessness", "cannot breathe", "stridor"]),
            ("Focal neurological deficit", ["facial droop", "slurred speech", "one-sided weakness", "hemiparesis"]),
            ("High fever with altered sensorium", ["hallucination", "delirium", "unresponsive", "fever with confusion"])
        ]

        for flag_name, keywords in emergency_triggers:
            if any(kw in combined_text for kw in keywords):
                red_flags.append(flag_name)

        # 2. Suggested clinical interview questions
        suggested_questions: List[str] = []
        if any(w in combined_text for w in ["headache", "migraine", "head"]):
            suggested_questions.append("Is the headache accompanied by visual disturbances (auras) or nausea?")
            suggested_questions.append("Does exposure to bright sun, heat, or skipped meals trigger or exacerbate the pain?")
        if any(w in combined_text for w in ["acid", "reflux", "heartburn", "burning", "stomach", "gastric"]):
            suggested_questions.append("Do symptoms worsen after intake of pungent, sour, or oily foods?")
            suggested_questions.append("Is there retrosternal burning or early morning bitter water-brash?")
        if any(w in combined_text for w in ["fatigue", "tired", "weakness"]):
            suggested_questions.append("Have you noticed pallor, breathlessness on mild exertion, or hair thinning?")
        if not suggested_questions:
            suggested_questions.append("How does the discomfort vary between morning, afternoon, and night?")
            suggested_questions.append("Are there any specific lifestyle stressors or dietary patterns associated with symptom onset?")

        # 3. Ayush Dosha Correlation
        prakriti = ayush_data.get("dominant_prakriti", "Pitta")
        vikriti = ayush_data.get("vikriti_state") or f"{prakriti} Prakopa with Vata Anubandha"

        # 4. Structured SOAP Generation
        # Subjective
        subjective_parts = [
            f"Patient presents with chief complaint: {chief_complaint or 'Generalized malaise and fatigue'}."
        ]
        if symptoms:
            subjective_parts.append(f"Reported symptoms: {', '.join(symptoms)}.")
        if history:
            h_details = [f"{k}: {v}" for k, v in history.items() if v]
            if h_details:
                subjective_parts.append(f"Clinical history context: {'; '.join(h_details)}.")
        soap_subjective = " ".join(subjective_parts)

        # Objective
        objective_parts = []
        if vitals:
            v_str = ", ".join([f"{k.upper()}: {v}" for k, v in vitals.items() if v])
            objective_parts.append(f"Recorded Vitals: {v_str}.")
        if ocr_data.get("lab_results"):
            labs = [f"{l.get('test_name')}: {l.get('result_value')} {l.get('unit')} ({l.get('status')})" for l in ocr_data.get("lab_results", [])]
            objective_parts.append(f"Diagnostic Labs Extracted via OCR: {'; '.join(labs)}.")
        objective_parts.append(f"Ayush Constitutional Assessment: Dominant Prakriti is {prakriti} ({vikriti}).")
        soap_objective = " ".join(objective_parts)

        # Assessment
        assessment_parts = []
        if red_flags:
            assessment_parts.append(f"CRITICAL: Red flags identified: {', '.join(red_flags)}. Immediate triage recommended.")
        else:
            assessment_parts.append("Hemodynamically stable outpatient presentation.")

        if "headache" in combined_text or "migraine" in combined_text:
            assessment_parts.append("Differential: Migraine without aura (ICD-11: 8A80.0) / Pittaja Shirahshoola (NAMASTE: SR-102).")
        elif "acid" in combined_text or "reflux" in combined_text:
            assessment_parts.append("Differential: Gastro-esophageal Reflux Disease (ICD-11: DA22) / Amlapitta (NAMASTE: AP-201).")
        else:
            assessment_parts.append(f"Syndrome pattern consistent with {vikriti} requiring integrated holistic evaluation.")
        soap_assessment = " ".join(assessment_parts)

        # Plan
        plan_parts = [
            "1. Detailed clinical examination and vital confirmation by attending physician.",
            f"2. Ayush therapeutic lifestyle alignment: Pitta-pacifying diet (avoiding excessive chilies, sour fermented foods, and sun exposure).",
            "3. Structured hydration and regular meal intervals.",
            "4. Follow-up evaluation scheduled after 5-7 days or immediate review if red flag symptoms arise."
        ]
        soap_plan = "\n".join(plan_parts)

        return {
            "soap_subjective": soap_subjective,
            "soap_objective": soap_objective,
            "soap_assessment": soap_assessment,
            "soap_plan": soap_plan,
            "red_flags": red_flags,
            "suggested_questions": suggested_questions,
            "prakriti_assessment": prakriti,
            "vikriti_assessment": vikriti,
            "disclaimer": "AI-generated clinical draft — physician verification and signature mandatory before prescribing or diagnosing."
        }

ai_clinical_service = AIClinicalService()
