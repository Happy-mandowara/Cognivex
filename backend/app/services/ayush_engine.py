from typing import Dict, List, Any

# Kent & Boericke Homeopathic Rubric Knowledge Base
HOMEOPATHIC_RUBRICS = {
    "headache_sunlight": {
        "rubric_name": "HEAD - PAIN - sun; from exposure to the",
        "chapter": "Head",
        "remedies": {
            "Glonoinum": 3,
            "Belladonna": 3,
            "Natrum Muriaticum": 3,
            "Gelsemium Sempervirens": 2,
            "Bryonia Alba": 2,
            "Lachesis": 1
        }
    },
    "headache_throbbing": {
        "rubric_name": "HEAD - PAIN - throbbing, pulsating",
        "chapter": "Head",
        "remedies": {
            "Belladonna": 3,
            "Glonoinum": 3,
            "Melilotus Alba": 2,
            "Natrum Muriaticum": 2,
            "Iris Versicolor": 2,
            "Spigelia": 1
        }
    },
    "headache_nausea": {
        "rubric_name": "HEAD - PAIN - accompanied by - Nausea and Vomiting",
        "chapter": "Head",
        "remedies": {
            "Iris Versicolor": 3,
            "Sanguinaria Canadensis": 3,
            "Nux Vomica": 3,
            "Belladonna": 2,
            "Natrum Muriaticum": 2,
            "Ipecacuanha": 2
        }
    },
    "headache_photophobia": {
        "rubric_name": "EYES - PHOTOPHOBIA - with headache",
        "chapter": "Eyes",
        "remedies": {
            "Belladonna": 3,
            "Glonoinum": 2,
            "Natrum Muriaticum": 2,
            "Gelsemium Sempervirens": 2,
            "Bryonia Alba": 1
        }
    },
    "headache_motion_worse": {
        "rubric_name": "HEAD - PAIN - motion; worse from least",
        "chapter": "Head",
        "remedies": {
            "Bryonia Alba": 3,
            "Belladonna": 2,
            "Gelsemium Sempervirens": 2,
            "Natrum Muriaticum": 1
        }
    }
}

REMEDY_KEYNOTES = {
    "Glonoinum": "Severe throbbing congestive headache from sun exposure, blood rushes to head, sensation of expansion, cannot bear heat or head covered.",
    "Belladonna": "Acute throbbing violent headache with flushed red face, dilated pupils, sensitivity to light/noise, worse from motion and sunlight.",
    "Natrum Muriaticum": "Anemic or burst-like throbbing headache appearing from sunrise to sunset, preceded by visual zigzag auras, worse from heat and intellectual work.",
    "Iris Versicolor": "Periodic sick headache preceded by blurriness, severe bilious nausea, vomiting of intensely sour or bitter fluid, burning throughout digestive tract.",
    "Bryonia Alba": "Splitting bursting headache starting over forehead/right temple, worse from the slightest movement or opening eyes, better by firm pressure and absolute rest.",
    "Gelsemium Sempervirens": "Dull heavy headache starting in occiput, sensation of band around forehead, eyelids heavy/drooping, worse in hot damp weather.",
    "Sanguinaria Canadensis": "Right-sided headache starting at occiput spreading over right eye, begins in morning, peaks at noon, accompanied by gastric burning.",
    "Nux Vomica": "Tension headache with sour gastric regurgitation, worse from morning mental work, sedentary lifestyle, irritability."
}

# NAMASTE Portal to ICD-11 & ICD-10 Mapping Knowledge Base
NAMASTE_ICD_CROSSWALK = [
    {
        "namaste_code": "AYU-SHS-004",
        "namaste_term": "Pittaja Shirashoola (पित्तज शिरःशूल)",
        "ayush_system": "Ayurveda",
        "clinical_features": "Burning throbbing headache, aggravated by sunlight and heat, relieved by cool application",
        "icd11_code": "8A80.0",
        "icd11_title": "Migraine without aura",
        "icd10_code": "G43.0",
        "icd10_title": "Migraine without aura"
    },
    {
        "namaste_code": "AYU-SHS-001",
        "namaste_term": "Vataja Shirashoola (वातज शिरःशूल)",
        "ayush_system": "Ayurveda",
        "clinical_features": "Piercing, variable headache, worse at evening, relieved by warm bandaging and oil application",
        "icd11_code": "8A81.0",
        "icd11_title": "Tension-type headache, episodic",
        "icd10_code": "G44.2",
        "icd10_title": "Tension-type headache"
    },
    {
        "namaste_code": "AYU-DIG-012",
        "namaste_term": "Amlapitta (अम्लपित्त)",
        "ayush_system": "Ayurveda",
        "clinical_features": "Acid regurgitation, retrosternal burning, nausea, headache after skipped meals",
        "icd11_code": "MD90.0",
        "icd11_title": "Functional dyspepsia",
        "icd10_code": "K30",
        "icd10_title": "Dyspepsia"
    },
    {
        "namaste_code": "AYU-MSK-021",
        "namaste_term": "Sandhigata Vata (संधिगत वात)",
        "ayush_system": "Ayurveda",
        "clinical_features": "Pain, crepitus and stiffness in weight-bearing joints aggravated by cold and physical exertion",
        "icd11_code": "FA00.Z",
        "icd11_title": "Osteoarthritis of unspecified joint",
        "icd10_code": "M19.9",
        "icd10_title": "Osteoarthritis, unspecified site"
    },
    {
        "namaste_code": "AYU-RES-008",
        "namaste_term": "Tamaka Shwasa (तमक श्वास)",
        "ayush_system": "Ayurveda",
        "clinical_features": "Paroxysmal dyspnea, wheezing, cough aggravated in rainy season and cloudy weather",
        "icd11_code": "CA23.0",
        "icd11_title": "Asthma, predominantly allergic",
        "icd10_code": "J45.0",
        "icd10_title": "Predominantly allergic asthma"
    }
]

class AyushClinicalEngine:
    """Core engine for Ayush Tridosha Scoring, Homeopathic Repertorization, and NAMASTE/ICD cross-walk."""

    def calculate_prakriti(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates Vata, Pitta, Kapha scores based on multi-parameter intake questionnaire."""
        vata = 0.0
        pitta = 0.0
        kapha = 0.0

        # Body frame
        bf = answers.get("body_frame", "moderate")
        if bf == "thin": vata += 3.0
        elif bf == "moderate": pitta += 3.0
        elif bf == "large": kapha += 3.0

        # Skin texture
        st = answers.get("skin_texture", "warm_sensitive")
        if st == "dry_rough": vata += 3.0
        elif st in ["warm_sensitive", "reddish"]: pitta += 3.5
        elif st == "oily_smooth": kapha += 3.0

        # Digestion / Agni
        dg = answers.get("digestion", "strong_acidic")
        if dg == "irregular": vata += 3.0 # Vishamagni
        elif dg == "strong_acidic": pitta += 4.0 # Tikshnagni
        elif dg == "slow_steady": kapha += 3.0 # Mandagni

        # Weather intolerance
        wp = answers.get("weather_preference", "cool")
        if wp == "warm": vata += 2.5 # Intolerant to cold/wind
        elif wp == "cool": pitta += 3.5 # Intolerant to sun/heat
        elif wp == "warm_dry": kapha += 2.5 # Intolerant to cold/damp

        # Sleep pattern
        sp = answers.get("sleep_pattern", "moderate")
        if sp == "light_broken": vata += 3.0
        elif sp == "moderate": pitta += 2.5
        elif sp == "deep_long": kapha += 3.0

        # Mental temperament
        mn = answers.get("mind_nature", "sharp_irritable")
        if mn == "quick_anxious": vata += 3.0
        elif mn == "sharp_irritable": pitta += 3.5
        elif mn == "calm_steady": kapha += 3.0

        total = vata + pitta + kapha
        if total == 0:
            total = 1.0

        vata_pct = round((vata / total) * 100.0, 1)
        pitta_pct = round((pitta / total) * 100.0, 1)
        kapha_pct = round((kapha / total) * 100.0, 1)

        # Normalize to ensure sum is exactly 100%
        diff = 100.0 - (vata_pct + pitta_pct + kapha_pct)
        pitta_pct = round(pitta_pct + diff, 1)

        # Determine dominant Dosha
        scores = [("Pitta", pitta_pct), ("Vata", vata_pct), ("Kapha", kapha_pct)]
        scores.sort(key=lambda x: x[1], reverse=True)
        dominant = scores[0][0]
        secondary = scores[1][0]
        sub_type = f"{dominant}-{secondary} Dwandvaja"

        # Pathya (wholesome) and Apathya (unwholesome) dietary guidance
        dietary_guidelines = [
            "Pathya (Wholesome): Cool, sweet, bitter, and astringent tastes (Sheeta, Madhura, Tikta, Kashaya Rasa).",
            "Pathya: Coconut water, amla (Indian gooseberry), ghee, pomegranate, cucumber, coriander infusion.",
            "Pathya: Frequent hydration; avoid prolonged gap between meals to prevent Pitta accumulation in Amashaya.",
            "Apathya (To Avoid): Excessively spicy (Katu), sour (Amla), salty (Lavana), and deep-fried foods.",
            "Apathya: Direct exposure to noon sunlight (Atapa Sevana), late-night wakefulness, fermented foods."
        ]

        lifestyle_guidelines = [
            "Pranayama: Sheetali and Sheetkari Pranayama twice daily (5-10 minutes) to dispel systemic heat.",
            "Nasya: Pratimarsha Nasya with 2 drops of Ksheerabala Taila or pure Cow's Ghee in each nostril at dawn.",
            "Head Protection: Use umbrella/wide-brimmed cap when outdoors; avoid skipping breakfast before stepping into sun."
        ]

        return {
            "vata_percentage": vata_pct,
            "pitta_percentage": pitta_pct,
            "kapha_percentage": kapha_pct,
            "dominant_dosha": dominant,
            "sub_type": sub_type,
            "vikriti_assessment": f"Pitta Prakopa (Exacerbation of Pitta) with mild Vata Anubandha leading to Pittaja Shirashoola.",
            "dietary_recommendations": dietary_guidelines,
            "lifestyle_recommendations": lifestyle_guidelines,
            "disclaimer": "Ayush Clinical Decision Support Tool — Never Autonomously Diagnoses or Prescribes"
        }

    def repertorize_homeopathy(self, symptoms: List[str], modalities: List[str] = None) -> Dict[str, Any]:
        """Calculates homeopathic rubric scores using Kent/Boericke data."""
        combined_queries = [s.lower() for s in symptoms]
        if modalities:
            combined_queries.extend([m.lower() for m in modalities])

        evaluated_rubric_names: List[str] = []
        remedy_totals: Dict[str, int] = {}
        remedy_matched_rubrics: Dict[str, List[str]] = {}

        # Scan our rubric knowledge base
        for rubric_id, rdata in HOMEOPATHIC_RUBRICS.items():
            rubric_title = rdata["rubric_name"]
            matched = False
            
            # Check keywords against symptoms/modalities
            if rubric_id == "headache_sunlight" and any(k in " ".join(combined_queries) for k in ["sun", "dhoop", "heat", "sunlight"]):
                matched = True
            elif rubric_id == "headache_throbbing" and any(k in " ".join(combined_queries) for k in ["throbbing", "pulsat", "bursting", "severe"]):
                matched = True
            elif rubric_id == "headache_nausea" and any(k in " ".join(combined_queries) for k in ["nausea", "vomiting", "ulti", "sick"]):
                matched = True
            elif rubric_id == "headache_photophobia" and any(k in " ".join(combined_queries) for k in ["light", "photophobia", "eye", "bright"]):
                matched = True
            elif rubric_id == "headache_motion_worse" and any(k in " ".join(combined_queries) for k in ["motion", "movement", "walking"]):
                matched = True

            if matched:
                evaluated_rubric_names.append(rubric_title)
                for rem, points in rdata["remedies"].items():
                    remedy_totals[rem] = remedy_totals.get(rem, 0) + points
                    if rem not in remedy_matched_rubrics:
                        remedy_matched_rubrics[rem] = []
                    remedy_matched_rubrics[rem].append(rubric_title)

        # If no rubrics matched directly, default to primary vascular headache rubrics
        if not evaluated_rubric_names:
            default_rubrics = ["headache_sunlight", "headache_throbbing", "headache_nausea"]
            for rubric_id in default_rubrics:
                rdata = HOMEOPATHIC_RUBRICS[rubric_id]
                evaluated_rubric_names.append(rdata["rubric_name"])
                for rem, points in rdata["remedies"].items():
                    remedy_totals[rem] = remedy_totals.get(rem, 0) + points
                    if rem not in remedy_matched_rubrics:
                        remedy_matched_rubrics[rem] = []
                    remedy_matched_rubrics[rem].append(rdata["rubric_name"])

        # Sort remedies by total score descending
        sorted_remedies = sorted(remedy_totals.items(), key=lambda x: x[1], reverse=True)
        top_remedies = []
        for rem_name, score in sorted_remedies[:5]:
            grade = "Grade 3 (Bold)" if score >= 6 else ("Grade 2 (Italics)" if score >= 4 else "Grade 1 (Plain)")
            top_remedies.append({
                "remedy_name": rem_name,
                "score": score,
                "keynote_indication": REMEDY_KEYNOTES.get(rem_name, "Clinically indicated based on modality and rubric convergence."),
                "grade": grade,
                "rubrics_matched": remedy_matched_rubrics.get(rem_name, [])
            })

        return {
            "rubrics_evaluated": evaluated_rubric_names,
            "top_remedies": top_remedies,
            "disclaimer": "Homeopathic Repertorization Demo based on Kent/Boericke data. For licensed practitioner evaluation only."
        }

    def get_namaste_mappings(self, condition_query: str = "") -> List[Dict[str, Any]]:
        """Returns NAMASTE and ICD-11/10 standardized terminology cross-walk entries."""
        if not condition_query:
            return NAMASTE_ICD_CROSSWALK
        
        q = condition_query.lower()
        results = [
            item for item in NAMASTE_ICD_CROSSWALK
            if q in item["namaste_term"].lower() or q in item["icd11_title"].lower() or q in item["clinical_features"].lower()
        ]
        return results if results else NAMASTE_ICD_CROSSWALK

ayush_clinical_engine = AyushClinicalEngine()
