# MediKiosk - Patient Case-Taking Software
### Smart India Hackathon (SIH 2026) | Problem Statement: PS-26047

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![HL7 FHIR](https://img.shields.io/badge/HL7_FHIR-R4_NRCES_India-E36209.svg)](https://nrces.in)
[![Ayushman Bharat](https://img.shields.io/badge/ABDM-Milestones_M1_M2_M3-0052CC.svg)](https://abdm.gov.in)
[![AYUSH](https://img.shields.io/badge/Ministry_of_Ayush-NAMASTE_&_Tridosha_CDS-8B5CF6.svg)](https://ayush.gov.in)

**MediKiosk** is a complete, runnable, production-grade Minimum Viable Product (MVP) engineered for **SIH 2026 PS-26047**. It bridges bilingual citizen-facing OPD intake, integrated Ayush clinical decision support, local AI entity extraction, prescription/lab OCR, physician workflow enhancement, and national digital health compliance (**Ayushman Bharat Digital Mission (ABDM) / HL7 FHIR R4**).

---

## 🏛️ System Architecture

```
                                  +---------------------------------------+
                                  |         PATIENT KIOSK (Bilingual)     |
                                  | - Voice + Touch Intake                |
                                  | - Adaptive SOCRATES Framework         |
                                  | - ABHA Demo Login & Consent           |
                                  | - Ashtavidha & Dashavidha Pariksha    |
                                  | - Red-Flag Emergency Triage           |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |      FASTAPI CORE CLINICAL BACKEND    |
                                  |  (No paid APIs; 100% offline fallback)|
+-----------------------------+   |                                       |   +-----------------------------+
|    AI & DOCUMENT PIPELINE   |   | * Local Clinical NLP Entity Extractor |   |      AYUSH DECISION ENGINE  |
| - Bhashini-compatible ASR   |-->| * Rule-based Red Flag Detector        |<--| - Rule-based Prakriti Radar |
| - Prescription & Lab OCR    |   | * Document Timeline Ingestion         |   | - Kent/Boericke Repertory   |
| - Parameter Range Evaluator |   | * HL7 FHIR R4 Bundle Builder          |   | - NAMASTE to ICD-11/10 Map  |
+-----------------------------+   +-------------------+-------------------+   +-----------------------------+
                                                      |
                                                      v
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
        +---------------------------------+                       +---------------------------------+
        |        DOCTOR DASHBOARD         |                       |        ABDM / FHIR R4 HUB       |
        | - Real-time OPD Triage Queue    |                       | - Valid HL7 FHIR R4 Bundle      |
        | - AI Clinical Summary (SOAP)    |                       | - Milestone 1: ABHA Check       |
        | - Integrated Ayush Radar        |                       | - Milestone 2: Consent Artefact |
        | - Dual Rx Builder (Ayush + All) |                       | - Milestone 3: Encrypted HIS    |
        | - Physician Verification Signoff|                       | - Live Syntax JSON Viewer       |
        +---------------------------------+                       +---------------------------------+
```

---

## ✨ Implemented Core Modules

### 1. Patient / Kiosk Mode
- **Bilingual Interface**: Seamless instant toggle between English and Hindi (`हिंदी`).
- **ABDM Digital Consent**: Clear consent explanation with digital confirmation before case-taking.
- **Demo ABHA Login**: One-click demo login for patient `Ananya Sharma` (`91-8742-9901-2341@abdm`).
- **Voice + Touch Intake**: Animated microphone waveform with simulated Bhashini ULCA speech-to-text.
- **Adaptive SOCRATES Framework**: Site, Onset, Character, Radiation, Associations, Time course, Exacerbating/relieving, Severity (1-10 visual pain slider with facial expressions).
- **General Medical History**: HPI, past illnesses, current medicines, drug allergies, family history, and lifestyle habits.
- **Ayurvedic Ashtavidha Pariksha**: Nadi (pulse), Jihva (tongue), Mutra (urine), Mala (stool), Shabda (voice), Sparsha (skin), Drik (eyes), Akriti (physique).
- **Red-Flag Emergency Triage**: Instant banner alert and high-priority OPD queue dispatch for dangerous red flags.

### 2. AI & Document Intelligence
- **Mock/Local ASR**: Bhashini ULCA API-compatible interface with English and Hindi speech processing.
- **Clinical Entity Extraction**: Local rule-based NLP pipeline extracting symptoms, durations, anatomical sites, severity, triggers, vitals, and allergies without requiring external paid APIs.
- **Prescription & Diagnostic Lab OCR**: Ingests reports, comparing findings against standard physiological reference ranges (e.g. Hemoglobin 11.2 g/dL [Low], Ferritin 14 ng/mL [Low], ESR 18 mm/hr [Normal]).
- **Patient Medical Timeline**: Chronological interactive EHR history graph.

### 3. AYUSH Clinical Engine
- **Tridosha Prakriti & Vikriti Scoring**: Multi-parameter questionnaire calculating Vata, Pitta, and Kapha percentages.
- **Recharts Tridosha Radar Chart**: Interactive graphical visualization of doshic balance.
- **Homeopathic Repertorization**: Kent and Boericke rubric matcher ranking remedies (Glonoinum, Belladonna, Natrum Muriaticum, Iris Versicolor, Bryonia) with graded points.
- **NAMASTE to ICD-11 & ICD-10 Cross-walk**: National Ayush Morbidity codes mapped to WHO ICD-11/10 standards.
- **Statutory Ayush Ethics**: Explicit practitioner disclaimer stating that the CDS engine *never autonomously diagnoses or prescribes*.

### 4. Doctor Clinical Dashboard
- **Live OPD Queue**: Triage priority badges (Emergency Red-Flag, High, Normal) and real-time patient queue.
- **Patient Case Sheet**: Demographics, verified ABHA ID badge, vitals ribbon.
- **AI Clinical Summary in SOAP Format**: Subjective, Objective, Assessment, Treatment Plan.
- **Dual Prescription Builder (Rx)**: Adds Ayush formulations (Sutshekhar Ras, Kamdudha Ras) alongside Allopathic medicines, frequency, duration, and dietary guidelines (*Pathya/Apathya*).
- **Physician Verification**: Prominent mandatory warning badge *"AI-generated draft — physician verification required"*.

### 5. ABDM & HL7 FHIR R4 Standard
- **Valid HL7 FHIR R4 Bundle**: Generates compliant bundles containing `Patient`, `Encounter`, `Condition`, `Observation` (Tridosha scores), and `MedicationRequest`.
- **ABDM Milestone 1 (M1)**: ABHA number verification and KYC linking.
- **ABDM Milestone 2 (M2)**: Electronic consent artefact creation with SHA-256 digital signature and validity constraints.
- **ABDM Milestone 3 (M3)**: Simulated encrypted health information exchange (ECDH-AES-GCM) to connected Hospital Information Systems.
- **Live FHIR Explorer**: Interactive JSON viewer with copy and download capabilities.

### 6. One-Click SIH Demo Mode
- Prominent **"⚡ Run SIH Demo (Ananya)"** button on top navbar.
- Executes the full fictional patient workflow with a single click:
  $$\text{Patient} \rightarrow \text{Case Taking} \rightarrow \text{NLP Extraction} \rightarrow \text{Ayush Assessment} \rightarrow \text{Lab OCR} \rightarrow \text{Doctor SOAP} \rightarrow \text{Rx Builder} \rightarrow \text{FHIR R4} \rightarrow \text{Mock ABDM}$$
- Features fictional patient **Ananya Sharma (34/F)**: 3-day severe throbbing headache, sunlight trigger, nausea, photophobia, Pitta-dominant profile (Pitta 58%, Vata 28%, Kapha 14%).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | FastAPI (Python 3.12+), Pydantic v2, SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 (in Docker) with automatic local SQLite fallback |
| **Cache** | Redis 7 (in Docker) with in-memory fallback |
| **Interoperability** | HL7 FHIR R4 (NRCES India Core Profile), ABDM SandBox M1-M3 specs |
| **Orchestration** | Docker Compose, Pytest |

---

## 🚀 Quick Start Guide

### Option 1: Run via Docker Compose (Recommended for Full Stack)

```bash
# Clone or navigate to the directory
cd thisIsArchitecture

# Build and start all 4 services (db, redis, backend, frontend)
docker compose up --build
```

- **Frontend Application**: `http://localhost:3000` (or `http://localhost:5173`)
- **FastAPI Backend & Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL**: Port `5432`
- **Redis**: Port `6379`

---

### Option 2: Run Locally (Without Docker)

#### 1. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies (already completed)
pip install -r backend/requirements.txt

# Run FastAPI with live reload (uses automatic local SQLite fallback)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

A comprehensive pytest test suite verifies API integrity, NLP extraction, Ayush engines, FHIR R4 validity, and demo flow:

```bash
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend/tests/test_api.py -v
```

**Test Coverage:**
- `test_health_check`: Backend health and connectivity.
- `test_verify_abha`: ABDM Milestone 1 ABHA verification.
- `test_kiosk_configuration`: SOCRATES and Ashtavidha options.
- `test_clinical_nlp_extraction`: Symptom, duration, anatomy, and red-flag NLP parsing.
- `test_ayush_prakriti_scoring`: Tridosha balance calculation and disclaimer check.
- `test_homeopathy_repertorization`: Kent & Boericke rubric scoring.
- `test_one_click_sih_demo`: Full end-to-end Ananya Sharma workflow execution.
- `test_abdm_integration_status`: NRCES FHIR R4 and ABDM gateway readiness.

---

## 👥 Hackathon Team & Project Metadata

- **Problem Statement ID**: PS-26047
- **Problem Statement Title**: Patient Case-Taking Software
- **Project Name**: MediKiosk
- **Target Users**: Patients at rural/urban OPD Kiosks, Ayush & Allopathic General Practitioners, District Hospitals, and ABDM Networked Facilities.
- **License**: MIT License
