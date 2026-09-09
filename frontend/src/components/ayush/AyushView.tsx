import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Flame, 
  Wind, 
  Droplets, 
  BookOpen, 
  Search, 
  CheckCircle2, 
  Scale, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { api } from '../../services/api';

export const AyushView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'prakriti' | 'homeopathy' | 'namaste'>('prakriti');
  
  // Prakriti state
  const [vataScore, setVataScore] = useState<number>(28.0);
  const [pittaScore, setPittaScore] = useState<number>(58.0);
  const [kaphaScore, setKaphaScore] = useState<number>(14.0);
  const [dominantDosha, setDominantDosha] = useState<string>('Pitta');
  const [vikritiState, setVikritiState] = useState<string>('Pitta Prakopa (Vitiation) with Vata Anubandha');

  // Homeopathy state
  const [selectedRubrics, setSelectedRubrics] = useState<string[]>([
    'headache_sunlight',
    'headache_throbbing',
    'headache_nausea'
  ]);
  const [topRemedies, setTopRemedies] = useState<any[]>([
    {
      remedy_name: "Glonoinum",
      score: 8,
      keynote_indication: "Severe throbbing congestive headache from sun exposure; blood rushes violently to head; cannot bear heat or head covered.",
      grade: "Grade 3 (Bold)",
      rubrics_matched: ["HEAD - PAIN - sun; from exposure to the", "HEAD - PAIN - throbbing, pulsating"]
    },
    {
      remedy_name: "Belladonna",
      score: 8,
      keynote_indication: "Acute violent throbbing with flushed face, dilated pupils, photophobia, sensitive to least noise or motion.",
      grade: "Grade 3 (Bold)",
      rubrics_matched: ["HEAD - PAIN - sun; from exposure to the", "HEAD - PAIN - throbbing, pulsating", "EYES - PHOTOPHOBIA - with headache"]
    },
    {
      remedy_name: "Natrum Muriaticum",
      score: 6,
      keynote_indication: "Bursting throbbing headache appearing with sunrise and decreasing at sunset, preceded by visual zigzag aura.",
      grade: "Grade 3 (Bold)",
      rubrics_matched: ["HEAD - PAIN - sun; from exposure to the", "HEAD - PAIN - throbbing, pulsating"]
    },
    {
      remedy_name: "Iris Versicolor",
      score: 5,
      keynote_indication: "Periodic sick headache preceded by blurriness, severe bilious nausea, vomiting of intensely sour or bitter fluid.",
      grade: "Grade 2 (Italics)",
      rubrics_matched: ["HEAD - PAIN - accompanied by - Nausea and Vomiting"]
    },
    {
      remedy_name: "Bryonia Alba",
      score: 4,
      keynote_indication: "Splitting bursting headache starting over forehead/right temple, worse from slightest movement, better by firm pressure.",
      grade: "Grade 2 (Italics)",
      rubrics_matched: ["HEAD - PAIN - sun; from exposure to the", "HEAD - PAIN - motion; worse from least"]
    }
  ]);

  // NAMASTE state
  const [namasteQuery, setNamasteQuery] = useState<string>('');
  const [namasteData, setNamasteData] = useState<any[]>([]);

  useEffect(() => {
    loadNamasteMappings();
  }, [namasteQuery]);

  const loadNamasteMappings = async () => {
    try {
      const data = await api.getNamasteMappings(namasteQuery);
      setNamasteData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const radarData = [
    { dosha: 'Vata (वात)', score: vataScore, fullMark: 100 },
    { dosha: 'Pitta (पित्त)', score: pittaScore, fullMark: 100 },
    { dosha: 'Kapha (कफ)', score: kaphaScore, fullMark: 100 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Mandatory Statutory Clinical Disclaimer */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <p className="text-xs font-semibold text-amber-900 leading-tight">
            <strong>STATUTORY AYUSH CDSS DISCLAIMER:</strong> This module is an assistive Clinical Decision Support System. In accordance with Ministry of Ayush ethical guidelines, it <u>never autonomously diagnoses or prescribes</u>. Physician clinical validation is strictly required.
          </p>
        </div>
        <span className="badge-ayush whitespace-nowrap hidden sm:inline-block">Decision Support Only</span>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-sky-100 pb-3">
        <button
          onClick={() => setActiveSubTab('prakriti')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'prakriti'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>Ayurvedic Prakriti & Tridosha Radar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('homeopathy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'homeopathy'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4 text-sky-300" />
          <span>Kent Homeopathic Repertorization</span>
        </button>

        <button
          onClick={() => setActiveSubTab('namaste')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'namaste'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>NAMASTE & ICD-11/10 Standard Cross-walk</span>
        </button>
      </div>

      {/* SUB-TAB 1: Prakriti & Tridosha Radar */}
      {activeSubTab === 'prakriti' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Radar Chart Card */}
          <div className="card-healthcare p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tridosha Balance Radar (Prakriti vs. Vikriti)</h3>
                <p className="text-xs text-slate-500">Multidimensional Dosha Distribution Score</p>
              </div>
              <span className="badge-ayush font-bold text-xs">{dominantDosha} Dominant</span>
            </div>

            {/* Recharts Radar */}
            <div className="w-full h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#bae6fd" />
                  <PolarAngleAxis dataKey="dosha" tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar 
                    name="Score %" 
                    dataKey="score" 
                    stroke="#0284c7" 
                    fill="#38bdf8" 
                    fillOpacity={0.45} 
                  />
                  <Tooltip 
                    formatter={(val) => [`${val}%`, 'Dosha Proportion']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #bae6fd', fontSize: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dosha Progress Bars */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-700 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pitta (पित्त - Fire & Metabolic Principle)</span>
                  </span>
                  <span className="text-amber-900">{pittaScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pittaScore}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-sky-700 flex items-center space-x-1">
                    <Wind className="w-3.5 h-3.5 text-sky-500" />
                    <span>Vata (वात - Air & Nervous Movement)</span>
                  </span>
                  <span className="text-sky-900">{vataScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${vataScore}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700 flex items-center space-x-1">
                    <Droplets className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kapha (कफ - Water, Earth & Structural Lubrication)</span>
                  </span>
                  <span className="text-emerald-900">{kaphaScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${kaphaScore}%` }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Clinical Interpretation & Pathya/Apathya */}
          <div className="space-y-6">
            
            <div className="card-healthcare p-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Vikriti Clinical Assessment</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-sky-50/60 p-3.5 rounded-xl border border-sky-100">
                <strong>Condition:</strong> {vikritiState}. Direct sunlight exposure (Atapa Sevana) has provoked Ushna and Tikshna gunas of Pitta in the cranial micro-channels (Shirasa Siras), precipitating vascular throbbing headache (Pittaja Shirashoola).
              </p>
            </div>

            <div className="card-healthcare p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pathya (Recommended Lifestyle & Diet)</span>
              </h4>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Diet:</strong> Cooling tastes (Sweet, Bitter, Astringent). Fresh coconut water, sweet pomegranate, boiled cow's milk with cardamom, coriander seed tea.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Pranayama:</strong> Sheetali and Sheetkari pranayama (10 minutes twice daily) to lower core body heat.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Nasya:</strong> Pratimarsha Nasya with pure cow's ghee (2 drops in each nostril at dawn).</span>
                </li>
              </ul>
            </div>

            <div className="card-healthcare p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2 text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Apathya (Strict Contraindications)</span>
              </h4>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start space-x-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span><strong>Sunlight:</strong> Avoid direct noon sun (11 AM to 3 PM); always use head protection or umbrella.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span><strong>Foods:</strong> Excessively spicy (Katu), sour (Amla), salty (Lavana), vinegar, pickles, fermented foods, and coffee on empty stomach.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: Kent & Boericke Homeopathy Repertorization */}
      {activeSubTab === 'homeopathy' && (
        <div className="space-y-6">
          
          <div className="card-healthcare p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kent Repertory Differential Analysis</h3>
                <p className="text-xs text-slate-500">Graded Remedy Totals based on Selected Case Rubrics</p>
              </div>
              <span className="badge-ayush">Homeopathic CDS Demo</span>
            </div>

            {/* Rubrics matched tags */}
            <div className="flex flex-wrap gap-2">
              <span className="badge-info py-1 px-2.5">HEAD - PAIN - sun, from exposure to</span>
              <span className="badge-info py-1 px-2.5">HEAD - PAIN - throbbing, pulsating</span>
              <span className="badge-info py-1 px-2.5">HEAD - PAIN - accompanied by nausea</span>
              <span className="badge-info py-1 px-2.5">EYES - PHOTOPHOBIA - with headache</span>
            </div>

            {/* Ranked Remedies Table */}
            <div className="overflow-x-auto border border-sky-100 rounded-xl mt-4">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-sky-50/70 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Remedy Name</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Grade</th>
                    <th className="px-4 py-3 text-left">Keynote Symptom Profile</th>
                    <th className="px-4 py-3 text-left">Rubrics Matched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {topRemedies.map((rem: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-extrabold text-sky-950 text-sm">{rem.remedy_name}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 inline-flex items-center justify-center">
                          {rem.score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={rem.grade.includes('Grade 3') ? 'badge-emergency text-[10px]' : 'badge-info text-[10px]'}>
                          {rem.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">{rem.keynote_indication}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {rem.rubrics_matched ? rem.rubrics_matched.length : 2} Rubrics
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 italic text-right">
              *Remedies displayed for diagnostic aid only. Potency, posology, and administration must be determined by a qualified BHMS/MD Homeopath.
            </p>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: NAMASTE & ICD Cross-walk */}
      {activeSubTab === 'namaste' && (
        <div className="card-healthcare p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sky-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">National AYUSH Morbidity Electronic Portal (NAMASTE)</h3>
              <p className="text-xs text-slate-500">Harmonized terminological cross-walk to WHO ICD-11 & ICD-10</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search disease, NAMASTE or ICD code..."
                value={namasteQuery}
                onChange={(e) => setNamasteQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-sky-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-sky-100 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-sky-50/70 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">NAMASTE Term</th>
                  <th className="px-4 py-3 text-left">Morbidity Code</th>
                  <th className="px-4 py-3 text-left">Ayush System</th>
                  <th className="px-4 py-3 text-left">ICD-11 Code & Title</th>
                  <th className="px-4 py-3 text-left">ICD-10 Code</th>
                  <th className="px-4 py-3 text-left">Clinical Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {namasteData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.namaste_term}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-sky-700">{row.namaste_code}</td>
                    <td className="px-4 py-3">
                      <span className="badge-ayush text-[10px]">{row.ayush_system}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <span className="font-mono text-indigo-700 mr-1.5">{row.icd11_code}</span>
                      <span>{row.icd11_title}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{row.icd10_code}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{row.clinical_features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
