import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  FileText, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Mic, 
  MicOff, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  FileCheck,
  UserCheck,
  RotateCcw,
  Loader2,
  File,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, SectionCard, StatusBadge, FormField } from '../ui';

interface KioskViewProps {
  language: 'en' | 'hi';
  onEncounterCreated?: (encounterId: string) => void;
  onNavigateToDoctor?: () => void;
}

export const KioskView: React.FC<KioskViewProps> = ({
  language,
  onEncounterCreated,
  onNavigateToDoctor
}) => {
  const { user } = useAuth();

  // Current Step: 1 to 8
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successResponse, setSuccessResponse] = useState<any>(null);

  // Loading States
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isExtractingOcr, setIsExtractingOcr] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Step 1: ABHA Verification
  const [abhaId, setAbhaId] = useState<string>('');
  const [abhaOtp, setAbhaOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [abhaStatus, setAbhaStatus] = useState<'NOT_VERIFIED' | 'OTP_SENT' | 'VERIFIED' | 'FAILED'>('NOT_VERIFIED');
  const [abhaError, setAbhaError] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');

  // Step 2: Consent
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [consentError, setConsentError] = useState<string>('');

  // Step 3: Patient Details
  const [patientId, setPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState<string>(user?.role === 'PATIENT' ? user.full_name : '');
  const [patientDob, setPatientDob] = useState<string>('1994-06-15');
  const [patientAge, setPatientAge] = useState<number | ''>(32);
  const [patientGender, setPatientGender] = useState<string>('Female');
  const [patientPhone, setPatientPhone] = useState<string>('9876543210');
  
  // Field-level Errors for Patient Details
  const [nameError, setNameError] = useState<string>('');
  const [dobError, setDobError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Step 4: Clinical Intake
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [complaintError, setComplaintError] = useState<string>('');
  const [site, setSite] = useState<string>('Forehead / Temples');
  const [onset, setOnset] = useState<string>('Gradually worsening over 3 days');
  const [character, setCharacter] = useState<string>('Throbbing / Pulsating');
  const [radiation, setRadiation] = useState<string>('Behind right eye');
  const [associations, setAssociations] = useState<string[]>(['Nausea', 'Sensitivity to light']);
  const [timeCourse, setTimeCourse] = useState<string>('Continuous with afternoon peak');
  const [exacerbatingRelieving, setExacerbatingRelieving] = useState<string>('Worse in direct sunlight; better in quiet dark room');
  const [severity, setSeverity] = useState<number>(6);
  const [pastHistory, setPastHistory] = useState<string>('No chronic medical conditions');
  const [currentMeds, setCurrentMeds] = useState<string>('None / OTC analgesics occasionally');
  const [allergies, setAllergies] = useState<string>('No known drug allergies');
  const [familyHistory, setFamilyHistory] = useState<string>('Mother has migraine headaches');

  // Step 5: Ayush Evaluation
  const [nadi, setNadi] = useState<string>('Manduka Gati (Frog jump, Pitta dominant, bounding)');
  const [jihva, setJihva] = useState<string>('Rakta Varna with mild yellow coating (Pitta)');
  const [mutra, setMutra] = useState<string>('Peeta Varna (Yellowish, acidic, burning)');
  const [mala, setMala] = useState<string>('Normal / Regular');
  const [sparsha, setSparsha] = useState<string>('Ushna (Warm/hot skin)');
  const [drik, setDrik] = useState<string>('Raktaksha (Redness, photophobic)');
  const [akriti, setAkriti] = useState<string>('Madhyama (Moderate athletic build)');

  // Step 6: Documents & OCR
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<any | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETE' | 'FAILED'>('IDLE');
  const [uploadError, setUploadError] = useState<string>('');

  // Load existing profile if patient is authenticated
  useEffect(() => {
    if (user?.role === 'PATIENT') {
      api.getMyPatientProfile().then((pat) => {
        if (pat) {
          setPatientId(pat.id);
          setPatientName(pat.name);
          if (pat.dob) setPatientDob(pat.dob);
          if (pat.age) setPatientAge(pat.age);
          if (pat.gender) setPatientGender(pat.gender);
          if (pat.phone) setPatientPhone(pat.phone);
          if (pat.abha_id) {
            setAbhaId(pat.abha_id);
            if (pat.abha_status === 'VERIFIED') {
              setAbhaStatus('VERIFIED');
            }
          }
        }
      }).catch(() => {
        if (user.full_name) setPatientName(user.full_name);
      });
    }
  }, [user]);

  // Calculate age automatically when DOB changes
  useEffect(() => {
    if (patientDob) {
      const birth = new Date(patientDob);
      const today = new Date();
      if (!isNaN(birth.getTime()) && birth <= today) {
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        setPatientAge(Math.max(0, age));
      }
    }
  }, [patientDob]);

  const stepNames = [
    { num: 1, en: "ABHA Verification", hi: "आभा सत्यापन" },
    { num: 2, en: "Consent", hi: "सहमति" },
    { num: 3, en: "Patient Details", hi: "मरीज़ विवरण" },
    { num: 4, en: "Clinical Intake", hi: "समस्या व लक्षण" },
    { num: 5, en: "Ayush Evaluation", hi: "आयुष मूल्यांकन" },
    { num: 6, en: "Documents & OCR", hi: "दस्तावेज़ और OCR" },
    { num: 7, en: "Review", hi: "समीक्षा" },
    { num: 8, en: "Queue Token", hi: "टोकन" }
  ];

  // ================= ABHA Verification Handlers =================
  const handleSendAbhaOtp = async () => {
    setAbhaError('');
    setOtpError('');
    const cleaned = abhaId.trim();
    if (!cleaned) {
      setAbhaError('ABHA ID / Number is required.');
      return;
    }
    const digitsOnly = cleaned.replace(/-/g, '');
    if (!/^\d{14}$/.test(digitsOnly) && !/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(cleaned)) {
      setAbhaError('Enter a valid 14-digit ABHA Number (e.g. 12-3456-7890-1234) or valid ABHA Address.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendAbhaOtp(cleaned);
      if (res.status === 'OTP_SENT') {
        setOtpSent(true);
        setAbhaStatus('OTP_SENT');
      } else {
        setAbhaError(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setAbhaError(err.message || 'Error communicating with ABHA gateway.');
      setAbhaStatus('FAILED');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAbhaOtp = async () => {
    setOtpError('');
    if (!abhaOtp.trim()) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyAbhaOtp(abhaId.trim(), abhaOtp.trim());
      if (res.status === 'VERIFIED') {
        setAbhaStatus('VERIFIED');
        if (res.patient) {
          if (res.patient.id) setPatientId(res.patient.id);
          if (res.patient.name && !patientName) setPatientName(res.patient.name);
          if (res.patient.dob) setPatientDob(res.patient.dob);
          if (res.patient.gender) setPatientGender(res.patient.gender);
          if (res.patient.phone) setPatientPhone(res.patient.phone);
        }
      } else {
        setAbhaStatus('FAILED');
        setOtpError(res.message || 'Invalid OTP. For sandbox testing, use 123456.');
      }
    } catch (err: any) {
      setAbhaStatus('FAILED');
      setOtpError(err.message || 'Verification failed. Sandbox OTP is 123456.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ================= Voice Assist =================
  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    try {
      const res = await api.requestAsr(language, language === 'hi'
        ? "मुझे पिछले 3 दिनों से बहुत तेज़ सिर दर्द है, धूप में जाने से दर्द बढ़ जाता है और जी मिचलाता है।"
        : "Throbbing headache localized to temples for 3 days, aggravated by sunlight and heat, accompanied by mild nausea."
      );
      if (res && res.transcript) {
        setChiefComplaint(res.transcript);
        setComplaintError('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecording(false);
    }
  };

  // ================= Real File Upload & OCR Handlers =================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // File type check
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please upload a PDF, JPG, or PNG document.');
        return;
      }

      // File size check (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }

      // Empty file check
      if (file.size === 0) {
        setUploadError('Uploaded file is empty.');
        return;
      }

      setSelectedFile(file);
      setUploadedDoc(null);
      setOcrResult(null);
      setUploadStatus('IDLE');
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;
    setUploadError('');
    setIsUploading(true);
    setUploadStatus('UPLOADING');

    try {
      const res = await api.uploadDocument(selectedFile, "Lab Report", patientId || undefined);
      setUploadedDoc(res);
      setUploadStatus('UPLOADED');
      
      // Automatically run real OCR
      runOcrOnDocument(res.id);
    } catch (err: any) {
      setUploadStatus('FAILED');
      setUploadError(err.message || 'File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const runOcrOnDocument = async (docId: string) => {
    setIsExtractingOcr(true);
    setUploadStatus('PROCESSING');
    try {
      const ocrData = await api.runDocumentOcr(docId);
      setOcrResult(ocrData.extracted_data);
      setUploadStatus('COMPLETE');
    } catch (err: any) {
      setUploadStatus('FAILED');
      setUploadError(err.message || 'OCR extraction failed.');
    } finally {
      setIsExtractingOcr(false);
    }
  };

  // ================= Validation per Step =================
  const validateCurrentStep = (): boolean => {
    setErrorMessage('');

    if (currentStep === 1) {
      // Step 1: ABHA Verification MUST be VERIFIED
      if (abhaStatus !== 'VERIFIED') {
        setAbhaError('ABHA verification is mandatory. Please send OTP and enter 123456 to verify.');
        return false;
      }
    } else if (currentStep === 2) {
      // Step 2: Consent
      if (!consentGranted) {
        setConsentError('Mandatory consent required under ABDM guidelines to proceed.');
        return false;
      }
    } else if (currentStep === 3) {
      // Step 3: Patient Details Validation
      let isValid = true;
      setNameError('');
      setDobError('');
      setPhoneError('');

      if (!patientName.trim()) {
        setNameError('Full name is required.');
        isValid = false;
      } else if (patientName.trim().length < 2) {
        setNameError('Name must be at least 2 characters.');
        isValid = false;
      }

      if (!patientDob) {
        setDobError('Date of birth is required.');
        isValid = false;
      } else {
        const d = new Date(patientDob);
        const today = new Date();
        if (isNaN(d.getTime())) {
          setDobError('Please select a valid date.');
          isValid = false;
        } else if (d > today) {
          setDobError('Date of birth cannot be in the future.');
          isValid = false;
        }
      }

      const phoneClean = patientPhone.replace(/[\s-]/g, '');
      if (!phoneClean) {
        setPhoneError('Mobile phone number is required.');
        isValid = false;
      } else if (!/^[6-9]\d{9}$/.test(phoneClean)) {
        setPhoneError('Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        isValid = false;
      }

      return isValid;
    } else if (currentStep === 4) {
      // Step 4: Clinical Intake
      setComplaintError('');
      if (!chiefComplaint.trim()) {
        setComplaintError('Chief complaint is required before proceeding.');
        return false;
      } else if (chiefComplaint.trim().length < 5) {
        setComplaintError('Please provide a meaningful description (at least 5 characters).');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 8));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ================= Final Submission to Backend Database =================
  const handleSubmitIntake = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // 1. Create or ensure patient record in DB
      let activePatId = patientId;
      if (!activePatId) {
        const createdPat = await api.createPatient({
          name: patientName.trim(),
          dob: patientDob,
          age: Number(patientAge) || 30,
          gender: patientGender,
          phone: patientPhone.trim(),
          abha_id: abhaId.trim(),
          has_consented: consentGranted,
          language
        });
        activePatId = createdPat.id;
        setPatientId(activePatId);
      } else {
        // Update existing patient record
        await api.updatePatient(activePatId, {
          name: patientName.trim(),
          dob: patientDob,
          age: Number(patientAge) || 30,
          gender: patientGender,
          phone: patientPhone.trim(),
          abha_id: abhaId.trim(),
          has_consented: consentGranted,
        });
      }

      // 2. Submit clinical intake encounter to DB
      const intakePayload = {
        patient_id: activePatId,
        chief_complaint: chiefComplaint.trim(),
        vitals: {
          bp: "120/80 mmHg",
          pulse: "78 bpm",
          temperature: "98.6 °F",
          spo2: "99%",
          respiratory_rate: "16 /min"
        },
        socrates: {
          site,
          onset,
          character,
          radiation,
          associations,
          time_course: timeCourse,
          exacerbating_relieving: exacerbatingRelieving,
          severity
        },
        general_history: {
          hpi: `${patientName}, ${patientAge}y/${patientGender}, presents with ${chiefComplaint}.`,
          past_history: [pastHistory],
          current_medications: [currentMeds],
          allergies: [allergies],
          family_history: [familyHistory],
          personal_habits: { "diet": "Regular", "sleep": "Normal" }
        },
        ayush_pariksha: {
          nadi,
          jihva,
          mutra,
          mala,
          sparsha,
          drik,
          akriti
        }
      };

      const encResponse = await api.submitIntake(intakePayload);
      setSuccessResponse(encResponse);
      setCurrentStep(8);

      if (onEncounterCreated && encResponse.id) {
        onEncounterCreated(encResponse.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit intake. Please verify all fields and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewIntake = () => {
    setCurrentStep(1);
    setSuccessResponse(null);
    setAbhaStatus('NOT_VERIFIED');
    setOtpSent(false);
    setAbhaOtp('');
    setConsentGranted(false);
    setChiefComplaint('');
    setSelectedFile(null);
    setUploadedDoc(null);
    setOcrResult(null);
    setUploadStatus('IDLE');
    setErrorMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Kiosk Step Progress Indicator */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-1 gap-2">
          {stepNames.map((step) => {
            const isDone = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div 
                key={step.num}
                onClick={() => {
                  if (step.num < currentStep) setCurrentStep(step.num);
                }}
                className={`flex items-center space-x-2 shrink-0 ${step.num < currentStep ? 'cursor-pointer' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone
                    ? 'bg-[#15803D] text-white'
                    : isCurrent
                    ? 'bg-[#2563EB] text-white ring-2 ring-[#2563EB]/20'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? 'text-[#0F172A] font-semibold' : 'text-[#64748B]'}`}>
                  {language === 'en' ? step.en : step.hi}
                </span>
                {step.num < 8 && <div className="w-4 h-px bg-[#E2E8F0] mx-1"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Error Notice */}
      {errorMessage && (
        <div className="p-3.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= STEP 1: MANDATORY ABHA VERIFICATION ================= */}
      {currentStep === 1 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  {language === 'en' ? 'Step 1: Mandatory ABHA Verification' : 'चरण 1: अनिवार्य आभा सत्यापन'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {language === 'en' 
                    ? 'Ayushman Bharat Digital Mission (ABDM) identification is required to proceed with OPD intake.' 
                    : 'ओपीडी पंजीकरण हेतु आयुष्मान भारत स्वास्थ्य खाता (ABHA) सत्यापन अनिवार्य है।'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-[11px] font-semibold rounded-md">
                ABHA Sandbox/Mock
              </span>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* Status indicator banner */}
            <div className={`p-3 rounded-[8px] border text-xs flex items-center justify-between ${
              abhaStatus === 'VERIFIED'
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                : abhaStatus === 'OTP_SENT'
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
            }`}>
              <div className="flex items-center space-x-2">
                {abhaStatus === 'VERIFIED' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                )}
                <span>
                  ABHA Status: <strong>{abhaStatus}</strong>
                </span>
              </div>
              {abhaStatus === 'VERIFIED' && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D]">
                  Verified ✓
                </span>
              )}
            </div>

            <FormField 
              label={language === 'en' ? '14-Digit ABHA Number or ABHA Address' : '14-अंकीय आभा नंबर'} 
              required
              error={abhaError}
              helperText="Enter your 14-digit ABHA (e.g. 91-8742-9901-2341 or 12345678901234)"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={abhaId}
                  disabled={abhaStatus === 'VERIFIED'}
                  onChange={(e) => {
                    setAbhaId(e.target.value);
                    setAbhaError('');
                  }}
                  placeholder="e.g. 91-8742-9901-2341"
                  className="flex-1 px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-mono text-[#0F172A] disabled:bg-[#F1F5F9]"
                />
                <button
                  type="button"
                  onClick={handleSendAbhaOtp}
                  disabled={isSendingOtp || abhaStatus === 'VERIFIED'}
                  className="px-4 py-2 bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold rounded-[8px] transition-colors disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSendingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSendingOtp ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                </button>
              </div>
            </FormField>

            {/* OTP Entry Box if OTP is sent */}
            {otpSent && abhaStatus !== 'VERIFIED' && (
              <div className="p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-[8px] space-y-3 animate-in fade-in">
                <div className="text-xs text-[#0369A1]">
                  An OTP has been dispatched to the mobile linked with your ABHA. <br />
                  <span className="text-[11px] text-[#0284C7] font-semibold">
                    (Sandbox Test Secret: <strong>123456</strong>)
                  </span>
                </div>

                <FormField 
                  label="Enter 6-Digit OTP" 
                  required
                  error={otpError}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={abhaOtp}
                      onChange={(e) => {
                        setAbhaOtp(e.target.value);
                        setOtpError('');
                      }}
                      placeholder="123456"
                      className="w-36 px-3 py-2 bg-white border border-[#BAE6FD] rounded-[8px] text-sm font-mono text-center tracking-widest text-[#0F172A]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAbhaOtp}
                      disabled={isVerifyingOtp}
                      className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-[8px] transition-colors disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      {isVerifyingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isVerifyingOtp ? 'Verifying ABHA...' : 'Verify OTP'}</span>
                    </button>
                  </div>
                </FormField>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handleNextStep}
              disabled={abhaStatus !== 'VERIFIED'}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{language === 'en' ? 'Continue to Consent' : 'सहमति पर जाएं'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 2: CONSENT ================= */}
      {currentStep === 2 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {language === 'en' ? 'Step 2: Patient Consent & ABDM Authorization' : 'चरण 2: सहमति एवं प्राधिकरण'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'en' ? 'Authorize clinical record sharing and Ayush clinical decision support' : 'डिजिटल परामर्श एवं आयुष स्वास्थ्य विश्लेषण हेतु सहमति'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs text-[#475569] space-y-2 leading-relaxed">
              <p>
                <strong>1. Digital Health Record Creation:</strong> I agree to the creation of a temporary OPD encounter record linked to my ABHA Health ID (<span className="font-mono text-[#2563EB]">{abhaId}</span>) for the purpose of physical and virtual clinical consultation.
              </p>
              <p>
                <strong>2. Assistive Ayush & Clinical Decision Support:</strong> I understand that MediKiosk utilizes assistive clinical algorithms and Prakriti scoring to support attending physicians. AI and algorithm outputs are assistive recommendations only and do not replace certified medical diagnosis.
              </p>
              <p>
                <strong>3. Privacy & ABDM Exchange:</strong> All health data is encrypted according to NRCES FHIR R4 specifications and will only be shared with authorized hospital staff.
              </p>
            </div>

            <div className="space-y-1">
              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => {
                    setConsentGranted(e.target.checked);
                    setConsentError('');
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-xs font-semibold text-[#0F172A]">
                  I give my explicit, informed consent for this OPD encounter intake, clinical document OCR, and Ayush evaluation under the ABDM framework. *
                </span>
              </label>
              {consentError && (
                <p className="text-xs text-[#B91C1C] font-medium pl-1">{consentError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back' : 'वापस'}</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Continue to Details' : 'विवरण पर जाएं'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 3: PATIENT DETAILS ================= */}
      {currentStep === 3 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {language === 'en' ? 'Step 3: Patient Demographic Details' : 'चरण 3: मरीज़ व्यक्तिगत विवरण'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'en' ? 'Enter accurate demographic details. Fields are validated strictly.' : 'सही विवरण भरें। सभी फ़ील्ड का सत्यापन किया जाता है।'}
            </p>
          </div>

          <div className="space-y-4">
            <FormField 
              label={language === 'en' ? 'Full Legal Name' : 'पूरा नाम'} 
              required
              error={nameError}
            >
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  setNameError('');
                }}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField 
                label={language === 'en' ? 'Date of Birth' : 'जन्म तिथि'} 
                required
                error={dobError}
              >
                <input
                  type="date"
                  required
                  value={patientDob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setPatientDob(e.target.value);
                    setDobError('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
                />
              </FormField>

              <FormField label={language === 'en' ? 'Calculated Age' : 'आयु'} required>
                <input
                  type="text"
                  disabled
                  value={patientAge !== '' ? `${patientAge} years` : ''}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#64748B]"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={language === 'en' ? 'Gender' : 'लिंग'} required>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
                >
                  <option value="Female">Female (महिला)</option>
                  <option value="Male">Male (पुरुष)</option>
                  <option value="Other">Other (अन्य)</option>
                </select>
              </FormField>

              <FormField 
                label={language === 'en' ? 'Mobile Phone Number' : 'मोबाइल नंबर'} 
                required
                error={phoneError}
                helperText="10-digit Indian phone number"
              >
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={patientPhone}
                  onChange={(e) => {
                    setPatientPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A]"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back' : 'वापस'}</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Continue to Clinical Intake' : 'समस्या पर जाएं'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 4: CLINICAL INTAKE ================= */}
      {currentStep === 4 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {language === 'en' ? 'Step 4: Chief Complaint & Symptoms' : 'चरण 4: मुख्य समस्या व लक्षण'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'en' ? 'Record reason for visit with SOCRATES pain analysis and medical history' : 'समस्या, लक्षण और पूर्व इतिहास दर्ज करें'}
            </p>
          </div>

          <div className="space-y-4">
            <FormField 
              label={language === 'en' ? 'Primary Reason for Visit / Chief Complaint' : 'मुख्य समस्या'} 
              required
              error={complaintError}
            >
              <div className="relative">
                <textarea
                  rows={3}
                  value={chiefComplaint}
                  onChange={(e) => {
                    setChiefComplaint(e.target.value);
                    setComplaintError('');
                  }}
                  placeholder="e.g. Throbbing frontal headache for 3 days with nausea and photophobia..."
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:ring-1 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  className={`absolute right-2 bottom-2.5 px-2.5 py-1 text-xs rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
                    isRecording 
                      ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] animate-pulse'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5 text-[#B91C1C]" /> : <Mic className="w-3.5 h-3.5 text-[#2563EB]" />}
                  <span className="text-[11px] font-medium">{isRecording ? 'Listening...' : 'Voice Assist'}</span>
                </button>
              </div>
            </FormField>

            {/* SOCRATES Details */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-3">
              <span className="text-xs font-semibold text-[#0F172A] block">SOCRATES Symptom Breakdown:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <FormField label="Site / Location">
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="e.g. Temples, Forehead, Abdomen"
                    className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                  />
                </FormField>

                <FormField label="Onset / Duration">
                  <input
                    type="text"
                    value={onset}
                    onChange={(e) => setOnset(e.target.value)}
                    placeholder="e.g. Gradually over 3 days"
                    className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                  />
                </FormField>

                <FormField label="Pain Character">
                  <input
                    type="text"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder="e.g. Throbbing, Dull ache, Burning"
                    className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                  />
                </FormField>

                <FormField label="Triggers & Relieving Factors">
                  <input
                    type="text"
                    value={exacerbatingRelieving}
                    onChange={(e) => setExacerbatingRelieving(e.target.value)}
                    placeholder="e.g. Worse in sun, better in dark room"
                    className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                  />
                </FormField>
              </div>
            </div>

            {/* Medical History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Past Medical History">
                <input
                  type="text"
                  value={pastHistory}
                  onChange={(e) => setPastHistory(e.target.value)}
                  placeholder="e.g. None or Hypertension"
                  className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                />
              </FormField>

              <FormField label="Known Allergies">
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin or None"
                  className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back' : 'वापस'}</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Continue to Ayush' : 'आयुष पर जाएं'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 5: AYUSH EVALUATION ================= */}
      {currentStep === 5 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {language === 'en' ? 'Step 5: Ayush Ashtavidha Pariksha' : 'चरण 5: आयुष अष्टविध परीक्षा'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'en' ? 'Eightfold clinical examination indicators for Prakriti assessment' : 'प्रकृति निर्धारण हेतु अष्टविध परीक्षा'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <FormField label="Nadi (Pulse Character)">
              <select
                value={nadi}
                onChange={(e) => setNadi(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="Manduka Gati (Frog jump, Pitta dominant, bounding)">Manduka Gati (Pitta - Bounding)</option>
                <option value="Sarpa Gati (Snake-like, Vata dominant, feeble)">Sarpa Gati (Vata - Feeble)</option>
                <option value="Hamsa Gati (Swan-like, Kapha dominant, slow)">Hamsa Gati (Kapha - Slow)</option>
              </select>
            </FormField>

            <FormField label="Jihva (Tongue Appearance)">
              <select
                value={jihva}
                onChange={(e) => setJihva(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="Rakta Varna with mild yellow coating (Pitta)">Rakta Varna with yellow coating (Pitta)</option>
                <option value="Shushka / Ruksha (Vata - Dry)">Shushka / Ruksha (Vata - Dry)</option>
                <option value="Shweta Picchila (Kapha - Thick white coat)">Shweta Picchila (Kapha - White coat)</option>
              </select>
            </FormField>

            <FormField label="Sparsha (Skin Temperature & Texture)">
              <select
                value={sparsha}
                onChange={(e) => setSparsha(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="Ushna (Warm/hot skin)">Ushna (Warm/hot skin)</option>
                <option value="Sheeta (Cold to touch)">Sheeta (Cold to touch)</option>
                <option value="Snigdha (Oily / Smooth)">Snigdha (Oily / Smooth)</option>
              </select>
            </FormField>

            <FormField label="Drik (Eyes & Vision Response)">
              <select
                value={drik}
                onChange={(e) => setDrik(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              >
                <option value="Raktaksha (Redness, photophobic)">Raktaksha (Redness, sensitive to light)</option>
                <option value="Ruksha (Dry eyes)">Ruksha (Dry eyes)</option>
                <option value="Prakrita (Normal sclera)">Prakrita (Normal sclera)</option>
              </select>
            </FormField>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back' : 'वापस'}</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Continue to Documents' : 'दस्तावेज़ पर जाएं'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 6: REAL DOCUMENTS & OCR ================= */}
      {currentStep === 6 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {language === 'en' ? 'Step 6: Real Document Upload & OCR Extraction' : 'चरण 6: दस्तावेज़ अपलोड व OCR'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'en' 
                ? 'Upload previous prescriptions or lab reports (PDF, PNG, JPG). Backend OCR extracts findings in real time.' 
                : 'पूर्व पर्ची या लैब रिपोर्ट अपलोड करें। OCR प्रणाली स्वचालित जानकारी निकालेगी।'}
            </p>
          </div>

          <div className="space-y-4">
            {/* File Input */}
            <div className="p-6 border-2 border-dashed border-[#E2E8F0] rounded-[10px] text-center space-y-3 bg-[#F8FAFC]">
              <Upload className="w-8 h-8 text-[#2563EB] mx-auto" />
              <div>
                <label className="inline-block px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] cursor-pointer shadow-xs transition-colors">
                  <span>Browse Document File</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-[#64748B] mt-1.5">
                  Supported formats: PDF, PNG, JPG, JPEG (Max 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-[8px] max-w-md mx-auto flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <File className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="font-medium text-[#0F172A] truncate">{selectedFile.name}</span>
                    <span className="text-[11px] text-[#64748B]">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadedDoc(null);
                      setOcrResult(null);
                      setUploadStatus('IDLE');
                    }}
                    className="text-[#64748B] hover:text-[#B91C1C]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Action Button */}
            {selectedFile && uploadStatus === 'IDLE' && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleUploadDocument}
                  className="px-5 py-2.5 bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold rounded-[8px] flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload & Run OCR</span>
                </button>
              </div>
            )}

            {/* Upload Lifecycle Progress Indicator */}
            {uploadStatus !== 'IDLE' && (
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-[8px] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0F172A]">Processing Pipeline Status:</span>
                  <span className={`font-semibold uppercase text-[11px] ${
                    uploadStatus === 'COMPLETE' ? 'text-[#15803D]' : uploadStatus === 'FAILED' ? 'text-[#B91C1C]' : 'text-[#2563EB]'
                  }`}>
                    {uploadStatus === 'UPLOADING' && 'Uploading...'}
                    {uploadStatus === 'UPLOADED' && 'Uploaded'}
                    {uploadStatus === 'PROCESSING' && 'Extracting information...'}
                    {uploadStatus === 'COMPLETE' && 'Complete ✓'}
                    {uploadStatus === 'FAILED' && 'Failed'}
                  </span>
                </div>

                {(isUploading || isExtractingOcr) && (
                  <div className="flex items-center space-x-2 text-xs text-[#2563EB]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {isUploading ? 'Uploading document to medical store...' : 'Extracting information using OCR service...'}
                    </span>
                  </div>
                )}

                {/* Structured OCR Findings Display */}
                {ocrResult && (
                  <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] space-y-2 text-xs">
                    <span className="font-semibold text-[#15803D] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OCR Structured Findings Extracted:</span>
                    </span>
                    
                    {ocrResult.lab_results && ocrResult.lab_results.length > 0 && (
                      <div>
                        <strong className="text-[#0F172A]">Lab Values: </strong>
                        {ocrResult.lab_results.map((l: any, i: number) => (
                          <span key={i} className="inline-block bg-white px-2 py-0.5 rounded border border-[#BBF7D0] mr-1 mb-1 font-mono text-[11px]">
                            {l.test}: {l.value} {l.unit} ({l.status})
                          </span>
                        ))}
                      </div>
                    )}

                    {ocrResult.diagnoses && ocrResult.diagnoses.length > 0 && (
                      <div>
                        <strong className="text-[#0F172A]">Diagnoses Identified: </strong>
                        <span className="text-[#475569]">{ocrResult.diagnoses.join(', ')}</span>
                      </div>
                    )}

                    {ocrResult.medications && ocrResult.medications.length > 0 && (
                      <div>
                        <strong className="text-[#0F172A]">Prior Medications: </strong>
                        <span className="text-[#475569]">{ocrResult.medications.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back' : 'वापस'}</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Review & Submit' : 'समीक्षा करें'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 7: REVIEW & CONFIRM ================= */}
      {currentStep === 7 && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {language === 'en' ? 'Step 7: Review Clinical Intake Details' : 'चरण 7: विवरण की समीक्षा व पुष्टि'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'en' ? 'Please verify all recorded information prior to OPD transmission' : 'पंजीकरण से पूर्व सभी जानकारी सत्यापित करें'}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Patient Identity & ABHA:</span>
              <div className="text-[#475569]">
                <strong>{patientName}</strong> • {patientAge}y • {patientGender} • DOB: {patientDob}
                {patientPhone && <span> • Phone: {patientPhone}</span>}
              </div>
              <div className="mt-1">
                ABHA: <span className="font-mono text-[#15803D] font-bold">{abhaId}</span>
                <span className="ml-2 px-1.5 py-0.2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded text-[10px] font-semibold uppercase">
                  {abhaStatus}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Chief Complaint & Symptoms:</span>
              <p className="text-[#475569]">{chiefComplaint}</p>
              <div className="text-[#64748B] mt-1">
                Location: {site} | Character: {character} | Onset: {onset}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Ayush Ashtavidha Profile:</span>
              <div className="text-[#475569]">
                Nadi: {nadi} | Jihva: {jihva} | Sparsha: {sparsha}
              </div>
            </div>

            {ocrResult && (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] space-y-1">
                <span className="font-semibold text-[#15803D] block">Attached Document Findings:</span>
                <p className="text-[#475569]">
                  {ocrResult.diagnoses?.length > 0 && `Diagnoses: ${ocrResult.diagnoses.join(', ')}`}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back / Edit' : 'वापस'}</span>
            </button>
            <button
              onClick={handleSubmitIntake}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'en' ? 'Confirm & Submit Intake' : 'पुष्टि करें'}</span>
                </>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* ================= STEP 8: REGISTRATION SUCCESS & TOKEN ================= */}
      {currentStep === 8 && (
        <Card padding="lg" className="space-y-6 text-center">
          <div className="w-12 h-12 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[#0F172A]">
              {language === 'en' ? 'Intake Successfully Registered' : 'पंजीकरण सफल रहा'}
            </h2>
            <p className="text-xs text-[#64748B]">
              Your clinical case sheet has been routed to the OPD Doctor Workspace queue.
            </p>
          </div>

          <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] max-w-sm mx-auto space-y-2 text-xs">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">OPD Token</span>
            <div className="text-3xl font-bold text-[#2563EB] tracking-tight font-mono">
              {successResponse?.id ? `MED-${successResponse.id.slice(-4).toUpperCase()}` : 'MED-001'}
            </div>
            <div className="text-xs text-[#0F172A] font-semibold">
              Patient: {patientName}
            </div>
            <div className="text-[11px] text-[#64748B]">
              Encounter ID: <span className="font-mono text-[#0F172A]">{successResponse?.id || 'ENC-GENERATED'}</span>
            </div>
            <div className="text-[11px] text-[#15803D] font-medium">
              Status: WAITING FOR ATTENDING PHYSICIAN
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleStartNewIntake}
              className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold rounded-[8px] flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Register Another Patient</span>
            </button>

            {onNavigateToDoctor && user?.role !== 'PATIENT' && (
              <button
                onClick={onNavigateToDoctor}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Open in Doctor Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};
