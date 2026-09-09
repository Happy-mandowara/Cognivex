const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:8000/api';

  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('medikiosk_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {}
    throw new Error(errorDetail);
  }
  return await res.json();
}

export const api = {
  // Health
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse<any>(res);
    } catch {
      return { status: "OFFLINE", project: "MediKiosk Clinical SaaS" };
    }
  },

  // Auth & RBAC
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse<any>(res);
  },

  async signup(data: { name: string; email: string; password: string; role: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse<any>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async logout() {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  // Admin Portal
  async getAdminStats() {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any[]>(res);
  },

  async createAdminUser(payload: { email: string; password: string; role: string; full_name: string; patient_id?: string }) {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse<any>(res);
  },

  async updateUserStatus(userId: string, isActive: boolean) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive })
    });
    return await handleResponse<any>(res);
  },

  async deleteUser(userId: string) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any[]>(res);
  },

  async getSystemSettings() {
    const res = await fetch(`${API_BASE_URL}/admin/system-settings`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<Record<string, any>>(res);
  },

  async updateSystemSettings(settings: Record<string, any>) {
    const res = await fetch(`${API_BASE_URL}/admin/system-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings })
    });
    return await handleResponse<any>(res);
  },

  // Patients & ABHA
  async getPatients() {
    const res = await fetch(`${API_BASE_URL}/patients`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any[]>(res);
  },

  async getPatient(patientId: string) {
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async getMyPatientProfile() {
    const res = await fetch(`${API_BASE_URL}/patients/me`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async getMyEncounters() {
    const res = await fetch(`${API_BASE_URL}/patients/my-encounters`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any[]>(res);
  },

  async createPatient(payload: any) {
    const res = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse<any>(res);
  },

  async updatePatient(patientId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse<any>(res);
  },

  async verifyAbha(abhaId: string, otp: string = "123456") {
    const res = await fetch(`${API_BASE_URL}/patients/verify-abha`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ abha_id: abhaId, otp })
    });
    return await handleResponse<any>(res);
  },

  // Kiosk
  async getKioskConfig() {
    const res = await fetch(`${API_BASE_URL}/kiosk/config`);
    return await handleResponse<any>(res);
  },

  async submitIntake(payload: any) {
    const res = await fetch(`${API_BASE_URL}/kiosk/intake`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse<any>(res);
  },

  // AI & OCR
  async requestAsr(language: string = "en", sampleTrigger?: string) {
    const res = await fetch(`${API_BASE_URL}/ai/asr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ language, sample_text_trigger: sampleTrigger })
    });
    return await handleResponse<any>(res);
  },

  async extractEntities(text: string, language: string = "en") {
    const res = await fetch(`${API_BASE_URL}/ai/extract`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, language })
    });
    return await handleResponse<any>(res);
  },

  async parseOcr(documentType: string = "Lab Report", sampleKey: string = "ananya_lab_report", customText?: string) {
    const res = await fetch(`${API_BASE_URL}/ai/ocr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ document_type: documentType, sample_key: sampleKey, text_override: customText })
    });
    return await handleResponse<any>(res);
  },

  // Ayush
  async calculatePrakriti(answers: any) {
    const res = await fetch(`${API_BASE_URL}/ayush/prakriti`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(answers)
    });
    return await handleResponse<any>(res);
  },

  async repertorizeHomeopathy(symptoms: string[], modalities: string[] = []) {
    const res = await fetch(`${API_BASE_URL}/ayush/repertorize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symptoms, modalities })
    });
    return await handleResponse<any>(res);
  },

  async getNamasteMappings(query: string = "") {
    const res = await fetch(`${API_BASE_URL}/ayush/namaste-mappings?query=${encodeURIComponent(query)}`);
    return await handleResponse<any>(res);
  },

  // Doctor Dashboard
  async getOpdQueue() {
    const res = await fetch(`${API_BASE_URL}/doctor/queue`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any[]>(res);
  },

  async getPatientCaseSheet(encounterId: string) {
    const res = await fetch(`${API_BASE_URL}/doctor/patient/${encounterId}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async updateDoctorNotes(encounterId: string, notes: any) {
    const res = await fetch(`${API_BASE_URL}/doctor/notes/${encounterId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notes)
    });
    return await handleResponse<any>(res);
  },

  async updateEncounterVitals(encounterId: string, vitals: Record<string, any>) {
    const res = await fetch(`${API_BASE_URL}/doctor/encounter/${encounterId}/vitals`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ vitals })
    });
    return await handleResponse<any>(res);
  },

  async updateEncounterDiagnosis(encounterId: string, diagnoses: any[]) {
    const res = await fetch(`${API_BASE_URL}/doctor/encounter/${encounterId}/diagnosis`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ diagnoses })
    });
    return await handleResponse<any>(res);
  },

  async updatePatientDemographics(patientId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/doctor/patient/${patientId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse<any>(res);
  },

  async savePrescription(prescription: any) {
    const res = await fetch(`${API_BASE_URL}/doctor/prescription`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(prescription)
    });
    return await handleResponse<any>(res);
  },

  // ABDM & FHIR
  async requestConsent(patientId: string) {
    const res = await fetch(`${API_BASE_URL}/abdm/consent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ patient_id: patientId })
    });
    return await handleResponse<any>(res);
  },

  async getFhirBundle(encounterId: string) {
    const res = await fetch(`${API_BASE_URL}/abdm/fhir-bundle/${encounterId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async exchangeAbdmData(encounterId: string) {
    const res = await fetch(`${API_BASE_URL}/abdm/exchange/${encounterId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async getAbdmStatus() {
    const res = await fetch(`${API_BASE_URL}/abdm/status`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  // Mandatory ABHA Verification Flow
  async sendAbhaOtp(abhaId: string) {
    const res = await fetch(`${API_BASE_URL}/abha/send-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ abha_id: abhaId })
    });
    return await handleResponse<any>(res);
  },

  async verifyAbhaOtp(abhaId: string, otp: string) {
    const res = await fetch(`${API_BASE_URL}/abha/verify-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ abha_id: abhaId, otp })
    });
    return await handleResponse<any>(res);
  },

  async getAbhaStatus() {
    const res = await fetch(`${API_BASE_URL}/abha/status`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  // Real File Upload & OCR
  async uploadDocument(file: File, documentType: string = "Medical Record", patientId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    if (patientId) {
      formData.append("patient_id", patientId);
    }

    const token = localStorage.getItem('medikiosk_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    return await handleResponse<any>(res);
  },

  async runDocumentOcr(documentId: string) {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}/ocr`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse<any>(res);
  },

  async getPatientDocuments(patientId: string) {
    const res = await fetch(`${API_BASE_URL}/documents/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse<any[]>(res);
  },

  // Real AI Clinical Summary Service
  async generateClinicalSummary(payload: {
    encounter_id?: string;
    chief_complaint?: string;
    symptoms?: string[];
    history?: string;
    prakriti?: any;
    ocr_findings?: any;
    observations?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/ai/clinical-summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse<any>(res);
  },

  // Encounter Status Updates
  async updateEncounterStatus(encounterId: string, status: string) {
    const res = await fetch(`${API_BASE_URL}/doctor/encounter/${encounterId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return await handleResponse<any>(res);
  }
};
