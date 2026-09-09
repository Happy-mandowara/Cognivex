import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Zap, 
  User, 
  HeartPulse, 
  Sparkles, 
  FileText, 
  Stethoscope, 
  Pill, 
  Share2, 
  ArrowRight,
  X
} from 'lucide-react';

interface DemoRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const DemoRunnerModal: React.FC<DemoRunnerModalProps> = ({
  isOpen,
  onClose,
  onCompleted
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const demoSteps = [
    { title: "Patient Registration & ABHA Verification", detail: "Ananya Sharma (34/F) linked to ABHA ID 91-8742-9901-2341@abdm", icon: User },
    { title: "Kiosk Case Taking (SOCRATES)", detail: "Throbbing headache for 3 days, aggravated by sunlight, nausea, Severity 8/10", icon: HeartPulse },
    { title: "Clinical NLP Entity Extraction", detail: "Extracted: Right Temporal, Sun Exposure trigger, Photophobia, Severity 8", icon: Sparkles },
    { title: "Ayush Tridosha & Kent Repertorization", detail: "Pitta 58%, Vata 28%, Kapha 14% | Top Homeopathy: Glonoinum & Belladonna", icon: Sparkles },
    { title: "Document OCR Ingestion", detail: "Parsed CBC & Ferritin Panel: Hb 11.2 g/dL (Low), Ferritin 14 ng/mL (Low)", icon: FileText },
    { title: "Doctor Clinical Summary (SOAP)", detail: "Formulated Subjective, Objective, Assessment & Treatment Plan draft", icon: Stethoscope },
    { title: "Dual Prescription Generation", detail: "Prescribed Sutshekhar Ras, Kamdudha Ras & SOS Paracetamol 650mg", icon: Pill },
    { title: "HL7 FHIR R4 & ABDM Consent Transfer", detail: "Generated 5-resource FHIR Bundle & simulated encrypted HIS dispatch", icon: Share2 }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    let interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < demoSteps.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDone = currentStepIndex >= demoSteps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-sky-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">System Integration Workflow Tour</h3>
            <p className="text-xs text-slate-500">Autonomous Case Taking & Clinical Integration Pipeline</p>
          </div>
        </div>

        {/* Steps Progression List */}
        <div className="space-y-3 py-1">
          {demoSteps.map((step, idx) => {
            const Icon = step.icon;
            const isFinished = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border transition-all flex items-start space-x-3 ${
                  isFinished
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : isCurrent
                    ? 'bg-sky-50 border-sky-300 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight">{step.title}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{step.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="pt-2">
          {isDone ? (
            <button
              onClick={() => {
                onClose();
                onCompleted();
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>Explore Verified Patient in Doctor Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              <span>Executing clinical workflow pipeline...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
