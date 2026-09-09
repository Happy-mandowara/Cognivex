import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  Copy, 
  Download, 
  RefreshCw, 
  FileCode2, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Lock,
  History,
  FileCheck,
  Building2,
  User,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export const AbdmView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fhir' | 'consent' | 'transactions'>('overview');
  const [bundleData, setBundleData] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExchanging, setIsExchanging] = useState<boolean>(false);
  const [exchangeResult, setExchangeResult] = useState<any>(null);
  const [currentEncounterId, setCurrentEncounterId] = useState<string>('');

  useEffect(() => {
    initView();
  }, []);

  const initView = async () => {
    try {
      const q = await api.getOpdQueue();
      if (q && q.length > 0) {
        const id = q[0].encounter_id || q[0].id;
        setCurrentEncounterId(id);
        fetchBundle(id);
      } else {
        fetchBundle('ENC-CURRENT');
      }
    } catch {
      fetchBundle('ENC-CURRENT');
    }
  };

  const fetchBundle = async (encId?: string) => {
    const id = encId || currentEncounterId || 'ENC-CURRENT';
    try {
      const data = await api.getFhirBundle(id);
      setBundleData(data.payload || data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateExchange = async () => {
    setIsExchanging(true);
    try {
      const id = currentEncounterId || 'ENC-CURRENT';
      const res = await api.exchangeAbdmData(id);
      setExchangeResult(res);
      await fetchBundle(id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExchanging(false);
    }
  };

  const handleCopyJson = () => {
    if (!bundleData) return;
    navigator.clipboard.writeText(JSON.stringify(bundleData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!bundleData) return;
    const blob = new Blob([JSON.stringify(bundleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR-R4-Bundle-${currentEncounterId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pipelineSteps = [
    { id: 'patient', label: 'PATIENT', desc: 'Ananya Sharma (34/F)', done: true },
    { id: 'consent', label: 'CONSENT', desc: 'ABDM-CONSENT-CAREST', done: true },
    { id: 'abha', label: 'ABHA', desc: '91-8742-9901-2341@abdm', done: true },
    { id: 'fhir', label: 'FHIR R4 BUNDLE', desc: 'NRCES India Core v1.0', done: true },
    { id: 'abdm', label: 'ABDM', desc: 'Encrypted Gateway Sync', done: true },
    { id: 'his', label: 'HIS', desc: 'Hospital EHR Repository', done: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white border border-border-clinical rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-clinical font-bold">
                <Share2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-semibold text-content-primary">ABDM & HL7 FHIR R4 Integration Engine</h2>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-clinical border border-blue-200">
                ABDM Sandbox Gateway
              </span>
              <span className="text-xs text-content-muted">
                National Digital Health Mission / HL7 FHIR R4 India Core Milestone Pipeline
              </span>
            </div>
          </div>

          <button
            onClick={handleSimulateExchange}
            disabled={isExchanging}
            className="flex items-center space-x-2 px-5 py-2.5 bg-clinical hover:bg-clinical-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isExchanging ? 'animate-spin' : ''}`} />
            <span>{isExchanging ? 'Simulating Pipeline...' : 'Run Full ABDM Sync Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* VISUAL INTEGRATION PIPELINE */}
      <div className="card-healthcare p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Visual Interoperability Pipeline
          </h3>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All 6 Pipeline Stages Operational</span>
          </span>
        </div>

        {/* Pipeline Diagram with Arrows & Green Checkmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineSteps.map((step, idx) => (
            <div key={step.id} className="relative p-3.5 bg-sky-50/50 border border-sky-200 rounded-2xl text-center space-y-1 group hover:border-sky-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-slate-900 mt-1">{step.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{step.desc}</div>
              
              {idx < pipelineSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-sky-400">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('fhir')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'fhir'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          FHIR JSON Bundle
        </button>

        <button
          onClick={() => setActiveTab('consent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'consent'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Consent Artefact
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'transactions'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Transaction Log
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-healthcare p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>NRCES India Core FHIR R4 Specification</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <p>
                MediKiosk strictly follows National Resource Centre for EHR Standards (NRCES) India Core structure definitions:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                <li><strong>Patient:</strong> Identifier ABHA number & ABHA address</li>
                <li><strong>Encounter:</strong> Ambulatory Care class with practitioner reference</li>
                <li><strong>Condition:</strong> Dual coded with WHO ICD-11 (8A80.0) & NAMASTE (AYU-SHS-004)</li>
                <li><strong>Observation:</strong> Tridosha Prakriti component scores (Vata, Pitta, Kapha)</li>
                <li><strong>MedicationRequest:</strong> Allopathic & Ayush formulations with dosage and frequency</li>
              </ul>
            </div>
          </div>

          <div className="card-healthcare p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Security & Cryptographic Standards</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">Diffie-Hellman Key Exchange (ECDH):</span>
                <span className="text-slate-600">Curve25519 key generation for forward secrecy data transfer.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">Payload Encryption:</span>
                <span className="text-slate-600">AES-GCM 256 authenticated payload encryption prior to HIS dispatch.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">Electronic Signature:</span>
                <span className="text-slate-600">SHA-256 with RSA electronic digest timestamped on consent grant.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FHIR JSON */}
      {activeTab === 'fhir' && (
        <div className="card-healthcare p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileCode2 className="w-5 h-5 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-900">HL7 FHIR R4 Bundle Payload</h4>
              <span className="badge-info text-xs">{bundleData?.total || 7} Resources</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Bundle</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(bundleData, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB 3: CONSENT */}
      {activeTab === 'consent' && (
        <div className="card-healthcare p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>ABDM Electronic Consent Artefact Record</span>
          </h4>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Consent Artefact ID:</span>
              <span className="font-mono text-slate-900 font-bold">ABDM-CONSENT-559CDC08</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Patient ABHA Address:</span>
              <span className="font-mono text-sky-700 font-bold">ananya.sharma@abdm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Health Information User (HIU):</span>
              <span className="text-slate-800 font-bold">MEDIKIOSK_OPD_01</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Health Information Provider (HIP):</span>
              <span className="text-slate-800 font-bold">MEDIKIOSK_AYUSH_HIP_01</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Purpose:</span>
              <span className="text-slate-800">Care Context Consultation & Clinical Case-Taking History (CAREST)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Status:</span>
              <span className="badge-success">GRANTED (Active 30 Days)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-semibold">Digital Signature:</span>
              <span className="font-mono text-[11px] text-slate-600">SHA256withRSA:e8f9a21b...</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="card-healthcare p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-4 h-4 text-sky-600" />
            <span>Health Information Exchange Transaction Trail</span>
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Transaction ID</th>
                  <th className="px-4 py-3 text-left">Milestone</th>
                  <th className="px-4 py-3 text-left">Protocol</th>
                  <th className="px-4 py-3 text-left">Target System</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sky-700 font-bold">df20b59b-8d14-41b9</td>
                  <td className="px-4 py-3 font-sans">M3 (Data Exchange)</td>
                  <td className="px-4 py-3 text-slate-600">ECDH-X25519-AES-GCM</td>
                  <td className="px-4 py-3 text-slate-600 font-sans">ABDM Health Repository / HIS</td>
                  <td className="px-4 py-3 font-sans">
                    <span className="badge-success">DISPATCHED</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sky-700 font-bold">abdm-m2-consent-991</td>
                  <td className="px-4 py-3 font-sans">M2 (Consent Artefact)</td>
                  <td className="px-4 py-3 text-slate-600">SHA256withRSA</td>
                  <td className="px-4 py-3 text-slate-600 font-sans">NHA Consent Manager Gateway</td>
                  <td className="px-4 py-3 font-sans">
                    <span className="badge-success">GRANTED</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sky-700 font-bold">abdm-m1-kyc-verify</td>
                  <td className="px-4 py-3 font-sans">M1 (ABHA Verification)</td>
                  <td className="px-4 py-3 text-slate-600">OAuth2.0 / Demo OTP</td>
                  <td className="px-4 py-3 text-slate-600 font-sans">ABDM Health ID Registry</td>
                  <td className="px-4 py-3 font-sans">
                    <span className="badge-success">VERIFIED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
