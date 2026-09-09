export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  abha_id?: string;
  abha_address?: string;
  has_consented: boolean;
  language: string;
  created_at?: string;
}

export interface SocratesData {
  site?: string;
  onset?: string;
  character?: string;
  radiation?: string;
  associations?: string[];
  time_course?: string;
  exacerbating_relieving?: string;
  severity?: number;
}

export interface GeneralHistoryData {
  hpi?: string;
  past_history?: string[];
  current_medications?: string[];
  allergies?: string[];
  family_history?: string[];
  personal_habits?: Record<string, any>;
}

export interface AshtavidhaParikshaData {
  nadi?: string;
  jihva?: string;
  mutra?: string;
  mala?: string;
  shabda?: string;
  sparsha?: string;
  drik?: string;
  akriti?: string;
}

export interface Encounter {
  id: string;
  patient_id: string;
  chief_complaint: string;
  status: string;
  triage_priority: 'EMERGENCY' | 'HIGH' | 'NORMAL';
  red_flags: string[];
  vitals: {
    bp?: string;
    pulse?: string;
    temperature?: string;
    spo2?: string;
    respiratory_rate?: string;
  };
  socrates: SocratesData;
  general_history: GeneralHistoryData;
  created_at: string;
}

export interface AyushAssessmentData {
  id?: string;
  vata_score: number;
  pitta_score: number;
  kapha_score: number;
  dominant_prakriti: string;
  vikriti_state: string;
  ashtavidha_pariksha: AshtavidhaParikshaData;
  homeopathy_rubrics: Array<{
    remedy_name: string;
    score: number;
    keynote_indication: string;
    grade: string;
    rubrics_matched: string[];
  }>;
  namaste_icd_codes: Array<{
    namaste_code: string;
    namaste_term: string;
    ayush_system: string;
    clinical_features: string;
    icd11_code: string;
    icd11_title: string;
    icd10_code: string;
    icd10_title: string;
  }>;
}

export interface ClinicalSummaryData {
  id?: string;
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
  extracted_entities: Record<string, any>;
  doctor_notes: string;
  is_verified: boolean;
  physician_name: string;
  disclaimer: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  system: string;
  instructions?: string;
}

export interface PrescriptionData {
  id?: string;
  medications: PrescriptionItem[];
  dietary_advice: string;
  follow_up_date: string;
  physician_signed: boolean;
}

export interface LabValue {
  test_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
}

export interface DocumentRecord {
  id: string;
  document_name: string;
  doc_type: string;
  document_date: string;
  extracted_medicines?: any[];
  extracted_diagnoses?: string[];
  extracted_lab_values?: LabValue[];
  raw_text?: string;
}

export interface OpdQueueItem {
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
  abha_id?: string;
  chief_complaint: string;
  status: string;
  triage_priority: 'EMERGENCY' | 'HIGH' | 'NORMAL';
  red_flags: string[];
  vitals: Record<string, string>;
  created_at: string;
}
