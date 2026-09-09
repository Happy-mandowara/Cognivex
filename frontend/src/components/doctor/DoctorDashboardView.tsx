import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  AlertTriangle, 
  FileText, 
  Pill, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Activity,
  History,
  Send,
  Edit3,
  Share2,
  RefreshCw,
  Search,
  Check,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../../services/api';
import { OpdQueueItem, PrescriptionItem } from '../../types';
import { 
  Card, 
  SectionCard, 
  ClinicalCard, 
  PatientHeader, 
  StatusBadge, 
  EmptyState, 
  Modal, 
  Drawer, 
  FormField 
} from '../ui';

interface DoctorDashboardViewProps {
  onNavigateToAbdm?: () => void;
  onNavigateToAyush?: () => void;
  onNavigateToDocuments?: () => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({ 
  onNavigateToAbdm,
  onNavigateToAyush,
  onNavigateToDocuments 
}) => {
  // Queue & Selection
  const [queue, setQueue] = useState<OpdQueueItem[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [caseSheet, setCaseSheet] = useState<any>(null);
  const [queueLoading, setQueueLoading] = useState<boolean>(true);
  const [sheetLoading, setSheetLoading] = useState<boolean>(false);
  const [queueFilter, setQueueFilter] = useState<string>('ALL');
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Active section scroll/tab in center pane
  const [activeSection, setActiveSection] = useState<string>('summary');

  // Modals & Drawers
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [isEditVitalsOpen, setIsEditVitalsOpen] = useState(false);
  const [isEditDiagnosisOpen, setIsEditDiagnosisOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states for Patient Demographics Edit
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState<number>(30);
  const [editGender, setEditGender] = useState('Female');
  const [editPhone, setEditPhone] = useState('');
  const [editAbhaId, setEditAbhaId] = useState('');

  // Form states for Vitals Edit
  const [vitalsBp, setVitalsBp] = useState('120/80 mmHg');
  const [vitalsPulse, setVitalsPulse] = useState('78 bpm');
  const [vitalsTemp, setVitalsTemp] = useState('98.6 °F');
  const [vitalsSpo2, setVitalsSpo2] = useState('99%');
  const [vitalsResp, setVitalsResp] = useState('16 /min');

  // Form states for Diagnoses
  const [diagnosesList, setDiagnosesList] = useState<Array<{ code: string; description: string; system: string; type: string }>>([]);
  const [newDiagCode, setNewDiagCode] = useState('');
  const [newDiagDesc, setNewDiagDesc] = useState('');
  const [newDiagSystem, setNewDiagSystem] = useState('ICD-11');
  const [newDiagType, setNewDiagType] = useState('CONFIRMED');

  // Clinical Summary & Verification Notes
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [soapSubjective, setSoapSubjective] = useState<string>('');
  const [soapObjective, setSoapObjective] = useState<string>('');
  const [soapAssessment, setSoapAssessment] = useState<string>('');
  const [soapPlan, setSoapPlan] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // Prescriptions
  const [medications, setMedications] = useState<PrescriptionItem[]>([]);
  const [dietaryAdvice, setDietaryAdvice] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('After 7 days');
  
  // New medication form inside prescription modal
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('1 tablet');
  const [newMedFreq, setNewMedFreq] = useState('BD (Twice daily)');
  const [newMedDuration, setNewMedDuration] = useState('7 days');
  const [newMedSystem, setNewMedSystem] = useState('Ayurveda');
  const [newMedInst, setNewMedInst] = useState('');

  // Action Loading states
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isGeneratingFhir, setIsGeneratingFhir] = useState<boolean>(false);
  const [isTransmittingAbdm, setIsTransmittingAbdm] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const showNotice = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const loadQueue = async () => {
    setQueueLoading(true);
    try {
      const data = await api.getOpdQueue();
      setQueue(data || []);
      if (data && data.length > 0) {
        // If current selection is still in queue, keep it; else select first
        const exists = data.find((item) => item.encounter_id === selectedEncounterId);
        if (!exists) {
          setSelectedEncounterId(data[0].encounter_id);
          loadCaseSheet(data[0].encounter_id);
        } else {
          loadCaseSheet(selectedEncounterId);
        }
      } else {
        setCaseSheet(null);
      }
    } catch (err: any) {
      showNotice(err.message || 'Error fetching OPD queue', 'error');
    } finally {
      setQueueLoading(false);
    }
  };

  const loadCaseSheet = async (encId: string) => {
    if (!encId) return;
    setSheetLoading(true);
    try {
      const data = await api.getPatientCaseSheet(encId);
      setCaseSheet(data);

      // Populate local editing states
      if (data.patient) {
        setEditName(data.patient.name || '');
        setEditAge(data.patient.age || 0);
        setEditGender(data.patient.gender || 'Other');
        setEditPhone(data.patient.phone || '');
        setEditAbhaId(data.patient.abha_id || '');
      }

      if (data.encounter) {
        const v = data.encounter.vitals || {};
        setVitalsBp(v.bp || '120/80 mmHg');
        setVitalsPulse(v.pulse || '78 bpm');
        setVitalsTemp(v.temperature || '98.6 °F');
        setVitalsSpo2(v.spo2 || '99%');
        setVitalsResp(v.respiratory_rate || '16 /min');

        setDiagnosesList(data.encounter.diagnosis || []);
      }

      if (data.clinical_summary) {
        setDoctorNotes(data.clinical_summary.doctor_notes || '');
        setSoapSubjective(data.clinical_summary.soap_subjective || '');
        setSoapObjective(data.clinical_summary.soap_objective || '');
        setSoapAssessment(data.clinical_summary.soap_assessment || '');
        setSoapPlan(data.clinical_summary.soap_plan || '');
        setIsVerified(Boolean(data.clinical_summary.is_verified));
      }

      if (data.prescription) {
        setMedications(data.prescription.medications || []);
        setDietaryAdvice(data.prescription.dietary_advice || '');
        setFollowUpDate(data.prescription.follow_up_date || 'After 7 days');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error loading patient case sheet', 'error');
    } finally {
      setSheetLoading(false);
    }
  };

  const handleSelectPatient = (encId: string) => {
    setSelectedEncounterId(encId);
    loadCaseSheet(encId);
  };

  // Save Patient Demographics
  const handleSaveDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseSheet?.patient?.id) return;
    try {
      await api.updatePatientDemographics(caseSheet.patient.id, {
        name: editName,
        age: editAge,
        gender: editGender,
        phone: editPhone,
        abha_id: editAbhaId,
      });
      showNotice('Patient demographic information updated successfully.');
      setIsEditPatientOpen(false);
      loadCaseSheet(selectedEncounterId);
      loadQueue();
    } catch (err: any) {
      showNotice(err.message || 'Failed to update demographics', 'error');
    }
  };

  // Save Vitals
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounterId) return;
    try {
      await api.updateEncounterVitals(selectedEncounterId, {
        bp: vitalsBp,
        pulse: vitalsPulse,
        temperature: vitalsTemp,
        spo2: vitalsSpo2,
        respiratory_rate: vitalsResp,
      });
      showNotice('Clinical vitals and observations saved successfully.');
      setIsEditVitalsOpen(false);
      loadCaseSheet(selectedEncounterId);
    } catch (err: any) {
      showNotice(err.message || 'Failed to update vitals', 'error');
    }
  };

  // Save Diagnoses
  const handleAddDiagnosis = () => {
    if (!newDiagDesc.trim()) return;
    const updated = [
      ...diagnosesList,
      {
        code: newDiagCode.trim(),
        description: newDiagDesc.trim(),
        system: newDiagSystem,
        type: newDiagType,
      },
    ];
    setDiagnosesList(updated);
    setNewDiagCode('');
    setNewDiagDesc('');
  };

  const handleRemoveDiagnosis = (idx: number) => {
    setDiagnosesList(diagnosesList.filter((_, i) => i !== idx));
  };

  const handleSaveDiagnoses = async () => {
    if (!selectedEncounterId) return;
    try {
      await api.updateEncounterDiagnosis(selectedEncounterId, diagnosesList);
      showNotice('Clinical diagnoses saved to patient encounter.');
      setIsEditDiagnosisOpen(false);
      loadCaseSheet(selectedEncounterId);
    } catch (err: any) {
      showNotice(err.message || 'Failed to save diagnoses', 'error');
    }
  };

  // Save / Verify Clinical Summary
  const handleSaveNotes = async (verifyStatus: boolean) => {
    if (!selectedEncounterId) return;
    setIsSavingNotes(true);
    try {
      await api.updateDoctorNotes(selectedEncounterId, {
        doctor_notes: doctorNotes,
        soap_subjective: soapSubjective,
        soap_objective: soapObjective,
        soap_assessment: soapAssessment,
        soap_plan: soapPlan,
        is_verified: verifyStatus,
      });
      if (verifyStatus) {
        await api.updateEncounterStatus(selectedEncounterId, 'VERIFIED');
      }
      setIsVerified(verifyStatus);
      showNotice(
        verifyStatus 
          ? 'Encounter clinical summary signed and verified by attending physician.' 
          : 'Clinical notes saved successfully.'
      );
      loadCaseSheet(selectedEncounterId);
      loadQueue();
    } catch (err: any) {
      showNotice(err.message || 'Failed to save clinical notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Generate Real AI Summary
  const handleGenerateAiSummary = async () => {
    if (!selectedEncounterId || !caseSheet) return;
    setIsGeneratingAi(true);
    try {
      const payload = {
        encounter_id: selectedEncounterId,
        chief_complaint: caseSheet.encounter?.chief_complaint || '',
        symptoms: caseSheet.encounter?.socrates?.associations || [],
        history: caseSheet.encounter?.general_history?.hpi || '',
        prakriti: caseSheet.ayush || {},
        ocr_findings: caseSheet.documents || [],
        observations: `${vitalsBp}, Pulse ${vitalsPulse}, Temp ${vitalsTemp}`
      };
      const res = await api.generateClinicalSummary(payload);
      setAiAnalysisResult(res);
      if (res.soap_draft) {
        if (res.soap_draft.subjective) setSoapSubjective(res.soap_draft.subjective);
        if (res.soap_draft.objective) setSoapObjective(res.soap_draft.objective);
        if (res.soap_draft.assessment) setSoapAssessment(res.soap_draft.assessment);
        if (res.soap_draft.plan) setSoapPlan(res.soap_draft.plan);
      }
      if (res.clinical_summary) {
        setDoctorNotes(res.clinical_summary);
      }
      showNotice('AI clinical summary and SOAP draft generated. Please review and verify.');
    } catch (err: any) {
      showNotice(err.message || 'Failed to generate AI summary', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Update Encounter Status Lifecycle
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedEncounterId) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateEncounterStatus(selectedEncounterId, newStatus);
      showNotice(`Encounter status updated to ${newStatus}.`);
      loadCaseSheet(selectedEncounterId);
      loadQueue();
    } catch (err: any) {
      showNotice(err.message || 'Failed to update encounter status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add Medication to list
  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const newItem: PrescriptionItem = {
      name: newMedName.trim(),
      dosage: newMedDose,
      frequency: newMedFreq,
      duration: newMedDuration,
      system: newMedSystem,
      instructions: newMedInst.trim(),
    };
    setMedications([...medications, newItem]);
    setNewMedName('');
    setNewMedInst('');
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  // Save Prescription
  const handleSavePrescription = async () => {
    if (!selectedEncounterId || !caseSheet?.patient?.id) return;
    try {
      await api.savePrescription({
        encounter_id: selectedEncounterId,
        patient_id: caseSheet.patient.id,
        medications,
        dietary_advice: dietaryAdvice,
        follow_up_date: followUpDate,
      });
      showNotice('Electronic prescription saved and digitally signed.');
      setIsPrescriptionModalOpen(false);
      loadCaseSheet(selectedEncounterId);
    } catch (err: any) {
      showNotice(err.message || 'Failed to save prescription', 'error');
    }
  };

  // ABDM Actions
  const handleGenerateFhir = async () => {
    if (!selectedEncounterId) return;
    setIsGeneratingFhir(true);
    try {
      await api.getFhirBundle(selectedEncounterId);
      showNotice('HL7 FHIR R4 Bundle generated successfully.');
    } catch (err: any) {
      showNotice(err.message || 'Failed to build FHIR R4 bundle', 'error');
    } finally {
      setIsGeneratingFhir(false);
    }
  };

  const handleSendToAbdm = async () => {
    if (!selectedEncounterId) return;
    setIsTransmittingAbdm(true);
    try {
      await api.exchangeAbdmData(selectedEncounterId);
      showNotice('Encrypted health record dispatched to ABDM Gateway.');
    } catch (err: any) {
      showNotice(err.message || 'Failed to transmit to ABDM', 'error');
    } finally {
      setIsTransmittingAbdm(false);
    }
  };

  // Queue filtering
  const filteredQueue = queue.filter((item) => {
    if (queueFilter === 'EMERGENCY' && item.triage_priority !== 'EMERGENCY') return false;
    if (queueFilter === 'HIGH' && item.triage_priority !== 'HIGH') return false;
    if (queueFilter === 'NORMAL' && item.triage_priority !== 'NORMAL') return false;
    if (queueSearch) {
      const q = queueSearch.toLowerCase();
      return (
        item.patient_name.toLowerCase().includes(q) ||
        (item.abha_id && item.abha_id.toLowerCase().includes(q)) ||
        item.encounter_id.toLowerCase().includes(q) ||
        item.chief_complaint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-5 space-y-4">
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`p-3 rounded-[8px] border text-xs font-medium flex items-center justify-between animate-in fade-in ${
          actionNotice.type === 'error'
            ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
            : actionNotice.type === 'info'
            ? 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1]'
            : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
        }`}>
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs font-bold px-2 py-0.5 hover:opacity-80 cursor-pointer">✕</button>
        </div>
      )}

      {/* 3-PANE EHR WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ================= LEFT PANE: OPD QUEUE (3 Cols) ================= */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-semibold text-[#0F172A]">OPD Waiting Queue</h2>
              </div>
              <button
                onClick={loadQueue}
                className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                title="Refresh Queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
              </button>
            </div>

            {/* Queue Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search patient name, ABHA..."
                className="w-full pl-8 pr-2 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB]"
              />
            </div>

            {/* Triage Filter Chips */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar">
              {['ALL', 'EMERGENCY', 'HIGH', 'NORMAL'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium transition-colors cursor-pointer ${
                    queueFilter === filter
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Queue Items List */}
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {queueLoading ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Loading OPD Queue...</span>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B] space-y-2">
                  <p>No patients in queue.</p>
                  <p className="text-[11px] text-[#94A3B8]">Patients registered at Kiosk appear here in real-time.</p>
                </div>
              ) : (
                filteredQueue.map((item) => {
                  const isSelected = selectedEncounterId === item.encounter_id;
                  return (
                    <div
                      key={item.encounter_id}
                      onClick={() => handleSelectPatient(item.encounter_id)}
                      className={`p-3 rounded-[10px] border transition-all cursor-pointer text-xs space-y-1.5 ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs'
                          : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-semibold text-[#0F172A] truncate max-w-[140px]">
                            {item.patient_name}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {item.age}y • {item.gender}
                          </div>
                        </div>
                        <StatusBadge status={item.triage_priority} />
                      </div>

                      <p className="text-[11px] text-[#475569] line-clamp-2 leading-tight">
                        {item.chief_complaint}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0]/60">
                        <span className="font-mono text-[#0F172A]">{item.encounter_id.slice(-8)}</span>
                        <span>{item.vitals?.bp || 'Vitals: Normal'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= CENTER PANE: EHR CLINICAL WORKSPACE (6 Cols) ================= */}
        <div className="lg:col-span-6 space-y-4">
          {sheetLoading ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-[12px] shadow-xs text-xs text-[#64748B]">
              <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Loading patient clinical workspace...</span>
            </div>
          ) : !caseSheet ? (
            <EmptyState
              title="No Patient Encounter Selected"
              description="Select an active patient from the OPD waiting queue on the left to review demographics, vitals, clinical summary, and generate prescriptions."
            />
          ) : (
            <>
              {/* Patient Header Component */}
              <PatientHeader
                patient={caseSheet.patient}
                triagePriority={caseSheet.encounter.triage_priority}
                encounterStatus={caseSheet.encounter.status}
                onEditPatient={() => setIsEditPatientOpen(true)}
              />

              {/* Vitals Bar Component */}
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">Clinical Vitals & Observations</h3>
                  </div>
                  <button
                    onClick={() => setIsEditVitalsOpen(true)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Vitals</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] block font-medium">Blood Pressure</span>
                    <span className="text-xs font-semibold text-[#0F172A] mt-0.5 block">{caseSheet.encounter.vitals?.bp || '120/80 mmHg'}</span>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] block font-medium">Heart Rate</span>
                    <span className="text-xs font-semibold text-[#0F172A] mt-0.5 block">{caseSheet.encounter.vitals?.pulse || '78 bpm'}</span>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] block font-medium">Temperature</span>
                    <span className="text-xs font-semibold text-[#0F172A] mt-0.5 block">{caseSheet.encounter.vitals?.temperature || '98.6 °F'}</span>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] block font-medium">SpO2</span>
                    <span className="text-xs font-semibold text-[#0F172A] mt-0.5 block">{caseSheet.encounter.vitals?.spo2 || '99%'}</span>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] block font-medium">Resp. Rate</span>
                    <span className="text-xs font-semibold text-[#0F172A] mt-0.5 block">{caseSheet.encounter.vitals?.respiratory_rate || '16 /min'}</span>
                  </div>
                </div>
              </div>

              {/* Chief Complaint & SOCRATES */}
              <SectionCard
                title="Chief Complaint & Symptom History (SOCRATES)"
                icon={FileText}
              >
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                    <span className="font-semibold text-[#0F172A] block mb-0.5">Reported Complaint:</span>
                    <p className="text-xs text-[#475569] leading-relaxed">{caseSheet.encounter.chief_complaint}</p>
                  </div>

                  {caseSheet.encounter.socrates && Object.keys(caseSheet.encounter.socrates).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {caseSheet.encounter.socrates.site && (
                        <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                          <span className="text-[#64748B]">Site:</span>
                          <span className="font-medium text-[#0F172A]">{caseSheet.encounter.socrates.site}</span>
                        </div>
                      )}
                      {caseSheet.encounter.socrates.onset && (
                        <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                          <span className="text-[#64748B]">Onset:</span>
                          <span className="font-medium text-[#0F172A]">{caseSheet.encounter.socrates.onset}</span>
                        </div>
                      )}
                      {caseSheet.encounter.socrates.character && (
                        <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                          <span className="text-[#64748B]">Character:</span>
                          <span className="font-medium text-[#0F172A]">{caseSheet.encounter.socrates.character}</span>
                        </div>
                      )}
                      {caseSheet.encounter.socrates.severity && (
                        <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                          <span className="text-[#64748B]">Severity Score:</span>
                          <span className="font-semibold text-[#B91C1C]">{caseSheet.encounter.socrates.severity}/10</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Diagnoses Card */}
              <SectionCard
                title="Clinical Diagnoses & ICD-11 Mapping"
                action={
                  <button
                    onClick={() => setIsEditDiagnosisOpen(true)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add / Edit Diagnosis</span>
                  </button>
                }
              >
                {diagnosesList.length === 0 ? (
                  <p className="text-xs text-[#64748B] italic">No diagnoses added yet. Click Add / Edit Diagnosis above.</p>
                ) : (
                  <div className="space-y-2">
                    {diagnosesList.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs">
                        <div>
                          <div className="font-semibold text-[#0F172A]">{d.description}</div>
                          <div className="text-[11px] text-[#64748B] flex items-center space-x-2">
                            {d.code && <span className="font-mono text-[#2563EB]">Code: {d.code}</span>}
                            <span>System: {d.system}</span>
                          </div>
                        </div>
                        <StatusBadge status={d.type} variant="info" />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Clinical Summary & Physician Verification */}
              <SectionCard
                title="Physician Clinical Assessment & Verification"
                icon={Stethoscope}
                action={
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiSummary}
                      disabled={isGeneratingAi || !caseSheet}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isGeneratingAi ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating clinical summary...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate AI Summary</span>
                        </>
                      )}
                    </button>
                    {isVerified ? (
                      <StatusBadge status="Verified by Physician" variant="success" icon={CheckCircle2} />
                    ) : (
                      <StatusBadge status="Draft — Requires Verification" variant="warning" icon={AlertTriangle} />
                    )}
                  </div>
                }
              >
                <div className="space-y-4 text-xs">
                  {/* AI Assistive Output & Red Flags */}
                  {aiAnalysisResult && (
                    <div className="space-y-3 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#15803D] flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>AI Clinical Assistance (Review and edit before verifying):</span>
                        </span>
                        <span className="text-[10px] text-[#64748B] italic">Assistive only — Not a final diagnosis</span>
                      </div>

                      {aiAnalysisResult.red_flags && aiAnalysisResult.red_flags.length > 0 && (
                        <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] text-xs text-[#B91C1C] space-y-1">
                          <strong className="block font-semibold">⚠️ Red-Flag Screening:</strong>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {aiAnalysisResult.red_flags.map((rf: string, idx: number) => (
                              <li key={idx}>{rf}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysisResult.suggested_questions && aiAnalysisResult.suggested_questions.length > 0 && (
                        <div className="p-2.5 bg-white border border-[#BBF7D0] rounded-[6px] text-xs text-[#0F172A] space-y-1">
                          <strong className="block font-semibold text-[#15803D]">Suggested Clinical Inquiries:</strong>
                          <ul className="list-disc pl-4 text-[#475569] space-y-0.5">
                            {aiAnalysisResult.suggested_questions.map((q: string, idx: number) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SOAP fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1">SOAP Assessment & Impression:</label>
                      <textarea
                        rows={3}
                        value={soapAssessment}
                        onChange={(e) => setSoapAssessment(e.target.value)}
                        placeholder="Enter clinical assessment or impression..."
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1">SOAP Treatment Plan:</label>
                      <textarea
                        rows={3}
                        value={soapPlan}
                        onChange={(e) => setSoapPlan(e.target.value)}
                        placeholder="Enter clinical plan and patient instructions..."
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1">Attending Physician Notes:</label>
                      <textarea
                        rows={2}
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        placeholder="Enter physician clinical observations and notes..."
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => handleSaveNotes(false)}
                      className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-medium rounded-[8px] text-xs transition-colors cursor-pointer"
                    >
                      Save Draft Notes
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveNotes(true)}
                        className="px-4 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white font-semibold rounded-[8px] text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign & Verify Encounter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Prescriptions Table */}
              <SectionCard
                title="Prescription & Pharmacotherapy"
                icon={Pill}
                action={
                  <button
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage Prescription</span>
                  </button>
                }
              >
                {medications.length === 0 ? (
                  <p className="text-xs text-[#64748B] italic">No medications prescribed yet. Click Manage Prescription above.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto border border-[#E2E8F0] rounded-[8px]">
                      <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                        <thead className="bg-[#F8FAFC] text-[#475569] font-semibold">
                          <tr>
                            <th className="px-3 py-2 text-left">Medication Name</th>
                            <th className="px-3 py-2 text-left">Dosage</th>
                            <th className="px-3 py-2 text-left">Frequency</th>
                            <th className="px-3 py-2 text-left">Duration</th>
                            <th className="px-3 py-2 text-left">System</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] bg-white">
                          {medications.map((m, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-semibold text-[#0F172A]">{m.name}</td>
                              <td className="px-3 py-2 text-[#475569]">{m.dosage}</td>
                              <td className="px-3 py-2 text-[#475569]">{m.frequency}</td>
                              <td className="px-3 py-2 text-[#475569]">{m.duration}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  m.system === 'Ayurveda'
                                    ? 'bg-[#F0FDF4] text-[#15803D]'
                                    : m.system === 'Homeopathy'
                                    ? 'bg-[#FFFBEB] text-[#B45309]'
                                    : 'bg-[#EFF6FF] text-[#2563EB]'
                                }`}>
                                  {m.system}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {dietaryAdvice && (
                      <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0] text-xs">
                        <span className="font-semibold text-[#0F172A] block mb-0.5">Pathya / Apathya Advice:</span>
                        <p className="text-xs text-[#475569]">{dietaryAdvice}</p>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>

        {/* ================= RIGHT PANE: ACTION PANEL (3 Cols) ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Case Lifecycle Status */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                Case Lifecycle Status
              </h3>
              {caseSheet?.encounter?.status && (
                <StatusBadge 
                  status={caseSheet.encounter.status} 
                  variant={
                    caseSheet.encounter.status === 'VERIFIED' || caseSheet.encounter.status === 'COMPLETED'
                      ? 'success'
                      : caseSheet.encounter.status === 'IN_CONSULTATION'
                      ? 'info'
                      : 'warning'
                  } 
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleUpdateStatus('IN_CONSULTATION')}
                disabled={isUpdatingStatus || !caseSheet || caseSheet.encounter?.status === 'IN_CONSULTATION'}
                className="py-1.5 px-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] font-medium rounded-[6px] transition-colors disabled:opacity-40 cursor-pointer text-center"
              >
                In Consultation
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('VERIFIED')}
                disabled={isUpdatingStatus || !caseSheet || caseSheet.encounter?.status === 'VERIFIED'}
                className="py-1.5 px-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] font-medium rounded-[6px] transition-colors disabled:opacity-40 cursor-pointer text-center"
              >
                Verify Case
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('WAITING')}
                disabled={isUpdatingStatus || !caseSheet || caseSheet.encounter?.status === 'WAITING'}
                className="py-1.5 px-2 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] font-medium rounded-[6px] transition-colors disabled:opacity-40 cursor-pointer text-center"
              >
                Mark Waiting
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('COMPLETED')}
                disabled={isUpdatingStatus || !caseSheet || caseSheet.encounter?.status === 'COMPLETED'}
                className="py-1.5 px-2 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] font-medium rounded-[6px] transition-colors disabled:opacity-40 cursor-pointer text-center"
              >
                Complete
              </button>
            </div>
          </Card>

          <Card padding="md" className="space-y-4">
            <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
              Clinical Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAi || !caseSheet}
                className="w-full py-2 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating clinical summary...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Summary</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSaveNotes(true)}
                disabled={isSavingNotes || !caseSheet}
                className="w-full py-2 px-3 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Verify & Sign Case</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditPatientOpen(true)}
                disabled={!caseSheet}
                className="w-full py-2 px-3 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-[8px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Edit Patient Information</span>
              </button>

              <button
                onClick={() => setIsEditVitalsOpen(true)}
                disabled={!caseSheet}
                className="w-full py-2 px-3 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-[8px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Add / Update Vitals</span>
              </button>

              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                disabled={!caseSheet}
                className="w-full py-2 px-3 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-[8px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Pill className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Create / Edit Prescription</span>
              </button>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Interoperability & Standards
                </span>

                <button
                  onClick={handleGenerateFhir}
                  disabled={isGeneratingFhir || !caseSheet}
                  className="w-full py-2 px-3 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold rounded-[8px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingFhir ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating FHIR bundle...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Generate HL7 FHIR R4 Bundle</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendToAbdm}
                  disabled={isTransmittingAbdm || !caseSheet}
                  className="w-full py-2 px-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-[8px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isTransmittingAbdm ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending to ABDM sandbox...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Transmit to ABDM Gateway</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Ayush CDS Summary Box */}
          {caseSheet?.ayush && (
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#15803D]" />
                  <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">Ayush Prakriti Profile</h3>
                </div>
                {onNavigateToAyush && (
                  <button onClick={onNavigateToAyush} className="text-[11px] text-[#2563EB] hover:underline cursor-pointer">
                    Full Engine
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Dominant Dosha:</span>
                  <span className="font-semibold text-[#15803D]">{caseSheet.ayush.dominant_prakriti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Vikriti Imbalance:</span>
                  <span className="font-medium text-[#B45309]">{caseSheet.ayush.vikriti_state}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[11px]">
                  <div className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Vata</span>
                    <span className="font-semibold text-[#0F172A]">{caseSheet.ayush.vata_score}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Pitta</span>
                    <span className="font-semibold text-[#0F172A]">{caseSheet.ayush.pitta_score}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Kapha</span>
                    <span className="font-semibold text-[#0F172A]">{caseSheet.ayush.kapha_score}%</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* ================= MODAL 1: EDIT PATIENT DEMOGRAPHICS ================= */}
      <Modal
        isOpen={isEditPatientOpen}
        onClose={() => setIsEditPatientOpen(false)}
        title="Edit Patient Information"
        subtitle="Update demographics and identity records in database"
        footer={
          <>
            <button
              onClick={() => setIsEditPatientOpen(false)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] rounded-[8px] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDemographics}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save Changes
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveDemographics} className="space-y-3">
          <FormField label="Full Name" required>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Age (Years)" required>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={editAge}
                onChange={(e) => setEditAge(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
              />
            </FormField>

            <FormField label="Gender" required>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
          </div>

          <FormField label="Phone Number">
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
            />
          </FormField>

          <FormField label="ABHA Health ID">
            <input
              type="text"
              value={editAbhaId}
              onChange={(e) => setEditAbhaId(e.target.value)}
              placeholder="e.g. 91-8742-9901-2341"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
            />
          </FormField>
        </form>
      </Modal>

      {/* ================= MODAL 2: EDIT VITALS ================= */}
      <Modal
        isOpen={isEditVitalsOpen}
        onClose={() => setIsEditVitalsOpen(false)}
        title="Update Patient Vitals & Observations"
        subtitle="Record recent examination measurements"
        footer={
          <>
            <button
              onClick={() => setIsEditVitalsOpen(false)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] rounded-[8px] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVitals}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer"
            >
              Update Vitals
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveVitals} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Blood Pressure">
              <input
                type="text"
                value={vitalsBp}
                onChange={(e) => setVitalsBp(e.target.value)}
                placeholder="e.g. 120/80 mmHg"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </FormField>

            <FormField label="Heart Rate / Pulse">
              <input
                type="text"
                value={vitalsPulse}
                onChange={(e) => setVitalsPulse(e.target.value)}
                placeholder="e.g. 78 bpm"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </FormField>

            <FormField label="Body Temperature">
              <input
                type="text"
                value={vitalsTemp}
                onChange={(e) => setVitalsTemp(e.target.value)}
                placeholder="e.g. 98.6 °F"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </FormField>

            <FormField label="Oxygen Saturation (SpO2)">
              <input
                type="text"
                value={vitalsSpo2}
                onChange={(e) => setVitalsSpo2(e.target.value)}
                placeholder="e.g. 99%"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </FormField>
          </div>

          <FormField label="Respiratory Rate">
            <input
              type="text"
              value={vitalsResp}
              onChange={(e) => setVitalsResp(e.target.value)}
              placeholder="e.g. 16 /min"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            />
          </FormField>
        </form>
      </Modal>

      {/* ================= MODAL 3: EDIT DIAGNOSIS ================= */}
      <Modal
        isOpen={isEditDiagnosisOpen}
        onClose={() => setIsEditDiagnosisOpen(false)}
        title="Add & Edit Clinical Diagnoses"
        subtitle="Manage differential and confirmed diagnoses"
        maxWidth="xl"
        footer={
          <>
            <button
              onClick={() => setIsEditDiagnosisOpen(false)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] rounded-[8px] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDiagnoses}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save Diagnoses
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-3">
            <span className="text-xs font-semibold text-[#0F172A] block">Add New Diagnosis Entry:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newDiagDesc}
                onChange={(e) => setNewDiagDesc(e.target.value)}
                placeholder="Diagnosis Description (e.g. Migraine without aura)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
              <input
                type="text"
                value={newDiagCode}
                onChange={(e) => setNewDiagCode(e.target.value)}
                placeholder="ICD-11 / NAMASTE Code (e.g. 8A80.0)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newDiagSystem}
                onChange={(e) => setNewDiagSystem(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="ICD-11">WHO ICD-11</option>
                <option value="NAMASTE">NAMASTE (Ayush Portal)</option>
                <option value="ICD-10">WHO ICD-10</option>
              </select>
              <select
                value={newDiagType}
                onChange={(e) => setNewDiagType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="CONFIRMED">Confirmed Diagnosis</option>
                <option value="DIFFERENTIAL">Differential Diagnosis</option>
                <option value="PROVISIONAL">Provisional Diagnosis</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddDiagnosis}
              className="px-3 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-[8px] hover:bg-[#1E293B] cursor-pointer"
            >
              + Add to List
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#0F172A] block">Current Encounter Diagnoses:</span>
            {diagnosesList.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No diagnoses in list.</p>
            ) : (
              diagnosesList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs">
                  <div>
                    <span className="font-semibold text-[#0F172A]">{item.description}</span>
                    <span className="text-[#64748B] ml-2">({item.system}: {item.code || 'None'})</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-medium">{item.type}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveDiagnosis(idx)}
                    className="text-[#B91C1C] hover:text-[#991B1B] p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 4: PRESCRIPTION BUILDER ================= */}
      <Modal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        title="Electronic Prescription Formulation"
        subtitle="Integrated Ayush & Allopathic Medications"
        maxWidth="2xl"
        footer={
          <>
            <button
              onClick={() => setIsPrescriptionModalOpen(false)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] rounded-[8px] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePrescription}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save & Sign Prescription
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-3">
            <span className="text-xs font-semibold text-[#0F172A] block">Add Medication:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medication Name (e.g. Sutshekhar Ras)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
              <input
                type="text"
                value={newMedDose}
                onChange={(e) => setNewMedDose(e.target.value)}
                placeholder="Dosage (e.g. 125 mg / 1 tab)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
              <select
                value={newMedSystem}
                onChange={(e) => setNewMedSystem(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="Ayurveda">Ayurveda</option>
                <option value="Allopathy">Allopathy</option>
                <option value="Homeopathy">Homeopathy</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                placeholder="Frequency (e.g. BD - Twice daily)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
              <input
                type="text"
                value={newMedDuration}
                onChange={(e) => setNewMedDuration(e.target.value)}
                placeholder="Duration (e.g. 7 days)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
              <input
                type="text"
                value={newMedInst}
                onChange={(e) => setNewMedInst(e.target.value)}
                placeholder="Instructions (e.g. after meals with warm water)"
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </div>

            <button
              type="button"
              onClick={handleAddMedication}
              className="px-3 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-[8px] hover:bg-[#1E293B] cursor-pointer"
            >
              + Add Medication
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#0F172A] block">Prescribed Medicines ({medications.length}):</span>
            {medications.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs">
                <div>
                  <span className="font-semibold text-[#0F172A]">{m.name}</span>
                  <span className="text-[#64748B] ml-2">{m.dosage} • {m.frequency} • {m.duration} ({m.system})</span>
                  {m.instructions && <div className="text-[11px] text-[#475569] mt-0.5">{m.instructions}</div>}
                </div>
                <button
                  onClick={() => handleRemoveMedication(idx)}
                  className="text-[#B91C1C] hover:text-[#991B1B] p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <FormField label="Pathya / Apathya (Dietary & Lifestyle Advice)">
            <textarea
              rows={2}
              value={dietaryAdvice}
              onChange={(e) => setDietaryAdvice(e.target.value)}
              placeholder="e.g. Pathya: Coconut water, pomegranates. Apathya: Strictly avoid noon sun, excessive chili."
              className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            />
          </FormField>

          <FormField label="Follow-Up Schedule">
            <input
              type="text"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              placeholder="e.g. After 7 days"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            />
          </FormField>
        </div>
      </Modal>

    </div>
  );
};
