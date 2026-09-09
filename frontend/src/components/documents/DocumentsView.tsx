import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileSearch, 
  Calendar, 
  Pill, 
  TestTube2, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export const DocumentsView: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<string>('ananya_lab_report');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<any>({
    document_name: "Thyrocare_CBC_Ferritin_Panel_Ananya.pdf",
    doc_type: "Lab Report",
    document_date: "2026-08-28",
    extracted_diagnoses: ["Mild Microcytic Hypochromic Anemia", "Serum Ferritin Deficiency"],
    extracted_medicines: [],
    extracted_lab_values: [
      { test_name: "Hemoglobin (Hb)", result_value: "11.2", unit: "g/dL", reference_range: "12.0 - 15.5", status: "LOW" },
      { test_name: "Total Leucocyte Count (TLC)", result_value: "7,400", unit: "/uL", reference_range: "4,000 - 11,000", status: "NORMAL" },
      { test_name: "Platelet Count", result_value: "245,000", unit: "/uL", reference_range: "150,000 - 450,000", status: "NORMAL" },
      { test_name: "ESR (Westergren)", result_value: "18", unit: "mm/1st hr", reference_range: "0 - 20", status: "NORMAL" },
      { test_name: "Serum Ferritin", result_value: "14", unit: "ng/mL", reference_range: "15 - 150", status: "LOW" },
      { test_name: "Random Blood Sugar (RBS)", result_value: "96", unit: "mg/dL", reference_range: "70 - 140", status: "NORMAL" }
    ],
    raw_text: "THYROCARE DIAGNOSTICS - CENTRAL LAB REPORT\nPatient: Ananya Sharma | Age: 34 Y | Sex: Female\nDate: 28-Aug-2026\nHemoglobin: 11.2 (L) g/dL | Ferritin: 14 (L) ng/mL | ESR: 18 mm/hr"
  });

  const handleRunOcr = async (sampleKey: string, docType: string) => {
    setSelectedSample(sampleKey);
    setIsProcessing(true);
    try {
      const data = await api.parseOcr(docType, sampleKey);
      setOcrResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="card-healthcare p-6 border-sky-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <FileSearch className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Clinical OCR & Patient Document Intelligence</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Extract medicines, diagnoses, lab parameters and integrate into chronological EHR timeline
            </p>
          </div>

          {/* Preset Sample Selectors */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleRunOcr('ananya_lab_report', 'Lab Report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedSample === 'ananya_lab_report' 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <TestTube2 className="w-3.5 h-3.5" />
              <span>Load CBC & Ferritin Panel</span>
            </button>

            <button
              onClick={() => handleRunOcr('prior_prescription', 'Prescription')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedSample === 'prior_prescription' 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Load Apollo Prescription</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: OCR Output */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Document Metadata Bar */}
          <div className="card-healthcare p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{ocrResult.document_name}</h4>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span>Type: <strong>{ocrResult.doc_type}</strong></span>
                  <span>•</span>
                  <span>Date: <strong>{ocrResult.document_date}</strong></span>
                </div>
              </div>
            </div>

            <span className="badge-success flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OCR Verified</span>
            </span>
          </div>

          {/* Extracted Diagnoses */}
          {ocrResult.extracted_diagnoses && ocrResult.extracted_diagnoses.length > 0 && (
            <div className="card-healthcare p-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extracted Clinical Diagnoses</h4>
              <div className="flex flex-wrap gap-2">
                {ocrResult.extracted_diagnoses.map((diag: string, i: number) => (
                  <span key={i} className="badge-info text-xs py-1 px-3">
                    {diag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Lab Values Table */}
          {ocrResult.extracted_lab_values && ocrResult.extracted_lab_values.length > 0 && (
            <div className="card-healthcare p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <TestTube2 className="w-4 h-4 text-sky-600" />
                  <span>Diagnostic Lab Parameters & Reference Range Assessment</span>
                </h4>
                <span className="text-xs text-slate-500">6 Parameters Analyzed</span>
              </div>

              <div className="overflow-x-auto border border-sky-100 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-sky-50/70 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Test Name</th>
                      <th className="px-4 py-3 text-left">Result Value</th>
                      <th className="px-4 py-3 text-left">Standard Reference</th>
                      <th className="px-4 py-3 text-left">Clinical Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ocrResult.extracted_lab_values.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{item.test_name}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {item.result_value} <span className="text-slate-500 font-normal">{item.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{item.reference_range} {item.unit}</td>
                        <td className="px-4 py-2.5">
                          {item.status === 'LOW' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              LOW (Below Range)
                            </span>
                          ) : item.status === 'HIGH' ? (
                            <span className="badge-emergency text-[10px]">
                              HIGH (Above Range)
                            </span>
                          ) : (
                            <span className="badge-success text-[10px]">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Extracted Medicines Table (for Prescriptions) */}
          {ocrResult.extracted_medicines && ocrResult.extracted_medicines.length > 0 && (
            <div className="card-healthcare p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Pill className="w-4 h-4 text-sky-600" />
                <span>Extracted Prescription Medications</span>
              </h4>

              <div className="overflow-x-auto border border-sky-100 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-sky-50/70 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Drug Formulation</th>
                      <th className="px-4 py-3 text-left">Dosage</th>
                      <th className="px-4 py-3 text-left">Frequency</th>
                      <th className="px-4 py-3 text-left">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ocrResult.extracted_medicines.map((med: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{med.name}</td>
                        <td className="px-4 py-2.5 text-slate-700">{med.dosage}</td>
                        <td className="px-4 py-2.5 font-medium text-sky-700">{med.frequency}</td>
                        <td className="px-4 py-2.5 text-slate-600">{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw OCR Text Preview */}
          <div className="card-healthcare p-5 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Raw Text Extracted via OCR Pipeline</h4>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
              {ocrResult.raw_text}
            </pre>
          </div>

        </div>

        {/* Right Col: Patient Medical Timeline */}
        <div className="space-y-6">
          <div className="card-healthcare p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-sky-100">
              <Clock className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Patient Medical Timeline</h3>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200">
              
              {/* Event 1: Today */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100"></span>
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span>MediKiosk OPD Intake</span>
                    <span className="text-[10px]">Today</span>
                  </div>
                  <p className="text-slate-700 font-medium">Severe throbbing headache (8/10), aggravated by sun, Pitta dominant.</p>
                  <span className="badge-emergency inline-block text-[10px]">Triage: High</span>
                </div>
              </div>

              {/* Event 2: Lab Test */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-sky-100"></span>
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-sky-950">
                    <span>Thyrocare Diagnostic Panel</span>
                    <span className="text-[10px] text-slate-500">28-Aug-2026</span>
                  </div>
                  <p className="text-slate-700">CBC & Ferritin: Hb 11.2 (Low), Ferritin 14 ng/mL (Low), TLC 7400 (Normal).</p>
                  <span className="badge-info inline-block text-[10px]">Microcytic Anemia</span>
                </div>
              </div>

              {/* Event 3: Prior Prescription */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-slate-100"></span>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Apollo Clinic OPD</span>
                    <span className="text-[10px] text-slate-500">10-Aug-2026</span>
                  </div>
                  <p className="text-slate-600">Prescribed Tab Paracetamol 650mg SOS & Cap Pantoprazole 40mg for Cephalea.</p>
                </div>
              </div>

              {/* Event 4: Past Treatment */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-300"></span>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Iron Supplementation</span>
                    <span className="text-[10px] text-slate-400">Nov-2025</span>
                  </div>
                  <p className="text-slate-500">Completed 3-month course of Ferrous Ascorbate for nutritional anemia.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
