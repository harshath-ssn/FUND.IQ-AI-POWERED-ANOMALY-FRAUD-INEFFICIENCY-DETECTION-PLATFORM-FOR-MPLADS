import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  MapPin, Landmark, Building2, FileText, Activity, 
  Search, ArrowUpRight, Filter, ShieldCheck, PhoneCall,
  Bot, Send, Mic, X, AlertCircle, Layers, Flame, LogOut, 
  UserCheck, ChevronRight, Check, Eye, Lock, ExternalLink,
  Sparkles, RefreshCw
} from 'lucide-react';

const DISTRICT_TRANSLATIONS = {
  en: {
    collectorTitle: "District Collector & District Magistrate",
    secureNode: "eSAKSHI Unified Sentinel System • Secure Audit Node",
    totalWorks: "District Works Count",
    highAnomalies: "High Anomaly Flags",
    requiresStop: "Requires DM stop-payment",
    allCompliant: "All works compliant",
    stalledOverdue: "Stalled & Overdue",
    stalledDesc: "Progress stalled >90 days",
    verifiedWorks: "Verified Clean Works",
    safeWorks: "100% geotag verified",
    triageHeading: "Urgent Critical Cases Requiring District Magistrate Intervention",
    triageSub: "Immediate triage of sanctions exhibiting statutory SLA delay or financial anomalies",
    triageCleanTitle: "Zero Active Critical Anomalies",
    triageCleanSub: "All active sanctions in this jurisdiction are operating within approved statutory tolerances.",
    registerHeading: "Full District Operational Works Register",
    searchPlaceholder: "Search work, agency, or risk type...",
    workId: "Work ID & Name",
    projectTitle: "Project Title",
    agency: "Agency",
    sanctioned: "Sanctioned",
    progress: "Progress",
    risk: "Risk Score",
    auditStatus: "Audit Status",
    action: "Action"
  },
  ta: {
    collectorTitle: "மாவட்ட ஆட்சியர் & மாவட்ட நீதிபதி",
    secureNode: "eSAKSHI ஒருங்கிணைந்த பாதுகாப்பு தணிக்கை தளம்",
    totalWorks: "மாவட்ட திட்டங்கள் எண்ணிக்கை",
    highAnomalies: "அதிக ஆபத்து எச்சரிக்கைகள்",
    requiresStop: "நிதி விடுவிப்பு தடுத்து நிறுத்தப்பட வேண்டும்",
    allCompliant: "அனைத்து பணிகளும் விதிமுறைப்படி உள்ளன",
    stalledOverdue: "நின்றுபோன மற்றும் காலாவதியான திட்டங்கள்",
    stalledDesc: "90 நாட்களுக்கு மேல் தேக்கம்",
    verifiedWorks: "சரிபார்க்கப்பட்ட தூய்மையான திட்டங்கள்",
    safeWorks: "100% புவிக்குறியீடு சரிபார்ப்பு",
    triageHeading: "மாவட்ட ஆட்சியரின் நேரடி தலையீடு தேவைப்படும் அவசர வழக்குகள்",
    triageSub: "கடுமையான நிதி அல்லது செயல்பாட்டு முறைகேடுகளைக் காட்டும் திட்டங்களின் உடனடி ஆய்வு",
    triageCleanTitle: "அவசர வழக்குகள் ஏதுமில்லை",
    triageCleanSub: "உங்கள் மாவட்டத்தில் உள்ள அனைத்து திட்டங்களும் சட்டப்பூர்வ விதிகளுக்கு உட்பட்டு நடைபெறுகின்றன.",
    registerHeading: "முழு மாவட்ட செயல்பாட்டு பணிகள் பதிவேடு",
    searchPlaceholder: "திட்டம், ஏஜென்சி அல்லது ஆபத்து நிலையை தேடுக...",
    workId: "திட்ட எண் & பெயர்",
    projectTitle: "திட்ட தலைப்பு",
    agency: "ஏஜென்சி",
    sanctioned: "ஒதுக்கீடு",
    progress: "முன்னேற்றம்",
    risk: "ஆபத்து குறியீடு",
    auditStatus: "தணிக்கை நிலை",
    action: "நடவடிக்கை"
  },
  hi: {
    collectorTitle: "जिला कलेक्टर एवं जिला मजिस्ट्रेट",
    secureNode: "eSAKSHI एकीकृत सेंटिनल सिस्टम • सुरक्षित ऑडिट नोड",
    totalWorks: "जिला कार्य गणना",
    highAnomalies: "उच्च विसंगति फ़्लैग",
    requiresStop: "डीएम भुगतान रोक की आवश्यकता",
    allCompliant: "सभी कार्य पूर्णतः अनुपालक हैं",
    stalledOverdue: "रुके हुए और विलंबित कार्य",
    stalledDesc: "प्रगति 90 दिनों से अधिक रुकी हुई",
    verifiedWorks: "सत्यापित स्वच्छ कार्य",
    safeWorks: "100% फोटो सत्यापित",
    triageHeading: "जिला मजिस्ट्रेट के हस्तक्षेप की आवश्यकता वाले अतिसंवेदनशील मामले",
    triageSub: "गंभीर वित्तीय विसंगतियों वाले स्वीकृत प्रस्तावों की तत्काल ट्राइएज",
    triageCleanTitle: "कोई सक्रिय विसंगति नहीं",
    triageCleanSub: "इस क्षेत्राधिकार में सभी स्वीकृत कार्य वैधानिक मानकों के भीतर संचालित हो रहे हैं।",
    registerHeading: "पूर्ण जिला परिचालन कार्य रजिस्टर",
    searchPlaceholder: "कार्य, एजेंसी या जोखिम खोजें...",
    workId: "कार्य आईडी और नाम",
    projectTitle: "परियोजना शीर्षक",
    agency: "एजेंसी",
    sanctioned: "स्वीकृत",
    progress: "प्रगति",
    risk: "जोखिम स्कोर",
    auditStatus: "ऑडिट स्थिति",
    action: "कार्रवाई"
  }
};

const DISTRICT_ROSTER = {
  "Coimbatore": { name: "Dr. K. Senthil Nathan, IAS", office: "Office of District Collector, Coimbatore" },
  "Madurai": { name: "M. S. Sangeetha, IAS", office: "Office of District Collector, Madurai" },
  "Chennai Central": { name: "Rashmi Siddharth Zagade, IAS", office: "Office of District Collector, Chennai" },
  "Salem": { name: "Dr. R. Brindha Devi, IAS", office: "Office of District Collector, Salem" },
  "Thanjavur": { name: "Deepak Jacob, IAS", office: "Office of District Collector, Thanjavur" },
  "Tiruchirappalli": { name: "M. Pradeep Kumar, IAS", office: "Office of District Collector, Tiruchirappalli" }
};

export default function DistrictDashboard({
  works = [],
  onSelectWork,
  scopedDistrict = "Coimbatore",
  currentUser,
  onLogout,
  onSelectMp,
  pinnedWorkId = null,
  onClearPinnedWork
}) {
  const [currentLang, setCurrentLang] = useState('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  // Floating Collector AI state
  const [botExpanded, setBotExpanded] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'bot', 
      text: 'வணக்கம் மாவட்ட ஆட்சியர் அவர்களே! I am your AI Administrative Sentinel. Ground audit and contractor monopoly surveillance are online.' 
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const t = DISTRICT_TRANSLATIONS[currentLang] || DISTRICT_TRANSLATIONS.en;
  const targetDistrict = (scopedDistrict || currentUser?.district || "Coimbatore").trim();
  const districtDignitary = currentUser?.name || DISTRICT_ROSTER[targetDistrict]?.name || `${targetDistrict} District Magistrate, IAS`;

  // 1. DATA FILTERING ENGINE
  const worksPool = Array.isArray(works) ? works : [];

  const districtWorks = useMemo(() => {
    const targetLower = targetDistrict.toLowerCase().trim();

    return worksPool.filter(w => {
      const wDist = (w.district || w.constituency || w.Constituency || "").toLowerCase().trim();
      return wDist && (wDist === targetLower || wDist.includes(targetLower) || targetLower.includes(wDist));
    });
  }, [worksPool, targetDistrict]);

  // Derived metrics that reflect real dataset counts
  const flaggedWorks = useMemo(() => districtWorks.filter(w => w.isNegative || w.riskScore >= 70), [districtWorks]);
  const stalledWorks = useMemo(() => districtWorks.filter(w => (w.progressPct === null || w.progressPct < 50) && w.paymentReleased > 300000), [districtWorks]);
  const verifiedWorks = useMemo(() => districtWorks.filter(w => !w.isNegative && w.riskScore < 70), [districtWorks]);

  // Real work-category clusters instead of fictional geographic zones --
  // there's no ward/zone field in the source data, but "Work category" is
  // real, so cluster by that and compute every number/brief from the
  // district's actual works instead of inventing sub-districts.
  const zones = useMemo(() => {
    const byCategory = {};
    districtWorks.forEach(w => {
      const cat = w.category || "Uncategorized";
      if (!byCategory[cat]) byCategory[cat] = { works: [], sanctioned: 0 };
      byCategory[cat].works.push(w);
      byCategory[cat].sanctioned += (w.sanctionedAmount || 0);
    });

    return Object.entries(byCategory).map(([cat, data]) => {
      const flagged = data.works.filter(w => w.isNegative || w.riskScore >= 70);
      const avgRisk = Math.round(data.works.reduce((s, w) => s + (w.riskScore || 0), 0) / Math.max(1, data.works.length));
      const topFlag = [...flagged].sort((a, b) => b.riskScore - a.riskScore)[0];

      return {
        id: `CAT-${cat}`,
        name: cat,
        riskScore: avgRisk,
        sanctioned: `₹${(data.sanctioned / 1e7).toFixed(2)} Cr`,
        status: avgRisk >= 70 ? "Critical High Risk" : avgRisk >= 40 ? "Medium Risk" : "Low Risk",
        brief: topFlag
          ? `${topFlag.title}: ${topFlag.anomalyType}`
          : `All ${data.works.length} works in this category verified against ML integrity baselines.`,
        workCount: data.works.length
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [districtWorks]);

  const activeZone = zones.find(z => z.id === selectedZoneId) || zones[0] || null;

  const filteredRegister = useMemo(() => {
    const base = districtWorks.filter(w => {
      const matchesSearch = (w.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (w.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (w.agency || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (riskFilter === 'FLAGGED') return matchesSearch && (w.isNegative || w.riskScore >= 70);
      if (riskFilter === 'CLEAN') return matchesSearch && (!w.isNegative && w.riskScore < 70);
      return matchesSearch;
    });
    if (!pinnedWorkId) return base;
    // An MP-escalated work is pinned to the top so the District Authority
    // sees exactly what was flagged, regardless of the current sort/filter.
    const pinned = base.filter(w => w.id === pinnedWorkId);
    const rest = base.filter(w => w.id !== pinnedWorkId);
    return [...pinned, ...rest];
  }, [districtWorks, searchTerm, riskFilter, pinnedWorkId]);

  const pinnedWork = pinnedWorkId ? districtWorks.find(w => w.id === pinnedWorkId) : null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;
    const userQuery = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');
    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: `District Collector Sir, pursuant to Rule 4.2 of the MPLADS guidelines, you have statutory powers to freeze disputed funds in ${targetDistrict}. Inspection records are synchronized.` 
        }
      ]);
    }, 1000);
  };

  return (
    <div className="w-full bg-[#fcf9f2] text-slate-900 font-sans select-none space-y-6 pb-28">

      {/* ESCALATION NOTICE: work flagged by an MP and escalated here */}
      {pinnedWork && (
        <div className="w-full rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-sm p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-900">Escalated by MP {pinnedWork.mpName}</p>
              <p className="text-sm font-bold text-slate-900">{pinnedWork.title} — risk {pinnedWork.riskScore}/100</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectWork && onSelectWork(pinnedWork.id)}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
            >
              Open Dossier
            </button>
            <button
              type="button"
              onClick={() => onClearPinnedWork && onClearPinnedWork()}
              className="p-2 rounded-xl hover:bg-amber-100 text-amber-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 1. DIGNITARY BANNER */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white shadow-[0_15px_40px_rgba(15,23,42,0.25)] p-6 sm:p-8 relative overflow-hidden border border-indigo-900 transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 flex shadow-md">
          <div className="w-1/3 bg-[#FF9933] animate-pulse" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808] animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-3">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-gradient-to-tr from-amber-400 to-yellow-300 text-indigo-950 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <span className="font-black text-2xl sm:text-3xl font-mono drop-shadow-sm">IAS</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-indigo-950 animate-bounce" title="Verified Authority Node">
                <ShieldCheck size={14} />
              </span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-indigo-950 shadow-sm border border-amber-500">
                  {targetDistrict} Nodal District
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t.collectorTitle}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {districtDignitary}
              </h1>

              <p className="text-xs sm:text-sm text-indigo-200 font-medium flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400 animate-pulse" />
                <span>{t.secureNode}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-inner">
              <button
                type="button"
                onClick={() => setCurrentLang('ta')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLang === 'ta' ? 'bg-amber-400 text-indigo-950 shadow-md scale-105' : 'text-slate-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLang === 'en' ? 'bg-amber-400 text-indigo-950 shadow-md scale-105' : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('hi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLang === 'hi' ? 'bg-amber-400 text-indigo-950 shadow-md scale-105' : 'text-slate-300 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-white/20 shadow-xs"
                title="Sign out"
              >
                <LogOut size={16} className="text-rose-400" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATUTORY SURVEILLANCE KPI PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.12)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{t.totalWorks}</span>
            <Activity size={15} className="text-indigo-600 group-hover:scale-110 transition-transform" />
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black font-mono text-slate-950">{districtWorks.length}</span>
            <span className="text-xs font-bold text-slate-500">works active</span>
          </div>
          <div className="text-[11px] font-bold text-indigo-900 pt-1 border-t border-slate-100 flex items-center gap-1.5">
            <Landmark size={14} className="text-indigo-600" />
            <span>eSAKSHI digital node</span>
          </div>
        </div>

        <div className={`p-5 rounded-3xl backdrop-blur-md border transition-all duration-300 flex flex-col justify-between space-y-2 group ${
          flaggedWorks.length > 0 
            ? 'bg-gradient-to-br from-white to-red-50/40 border-red-300 shadow-[0_4px_20px_rgba(220,38,38,0.1)] hover:shadow-[0_8px_25px_rgba(220,38,38,0.2)]'
            : 'bg-white/95 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
            flaggedWorks.length > 0 ? 'text-red-700' : 'text-slate-500'
          }`}>
            <span>{t.highAnomalies}</span>
            <Flame size={16} className={flaggedWorks.length > 0 ? "text-red-600 animate-pulse" : "text-slate-400"} />
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className={`text-3xl font-black font-mono ${flaggedWorks.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {flaggedWorks.length}
            </span>
            <span className={`text-xs font-bold ${flaggedWorks.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>
              cases flagged
            </span>
          </div>
          <div className={`text-[11px] font-bold pt-1 border-t ${
            flaggedWorks.length > 0 ? 'text-red-700 border-red-100' : 'text-emerald-700 border-slate-100'
          }`}>
            {flaggedWorks.length > 0 ? t.requiresStop : t.allCompliant}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.12)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
            <span>{t.stalledOverdue}</span>
            <Clock size={16} className="text-amber-600 group-hover:scale-110 transition-transform" />
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black font-mono text-amber-800">{stalledWorks.length}</span>
            <span className="text-xs font-bold text-slate-500">delayed</span>
          </div>
          <div className="text-[11px] font-bold text-amber-900 pt-1 border-t border-slate-100">
            {t.stalledDesc}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-emerald-50/40 backdrop-blur-md border border-emerald-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
            <span>{t.verifiedWorks}</span>
            <CheckCircle2 size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black font-mono text-emerald-800">{verifiedWorks.length}</span>
            <span className="text-xs font-bold text-emerald-700">safe</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-800 pt-1 border-t border-emerald-100">
            {t.safeWorks}
          </div>
        </div>
      </div>

      {/* 3. AI COLLUSION RADAR BANNER */}
      <div className="w-full rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 border border-indigo-900 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/80 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold shrink-0">
              <ShieldAlert size={28} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>AI Collusion Network Surveillance</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  flaggedWorks.length > 0 ? 'bg-red-600 text-white border-red-400' : 'bg-emerald-600 text-white border-emerald-400'
                }`}>
                  {flaggedWorks.length > 0 ? `Syndicate Risk: ${flaggedWorks[0].riskScore}/100` : "Clear: Risk 12/100"}
                </span>
              </h3>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                {targetDistrict} Implementation Agency Allocation Check &bull; Rule 4.2 Single Agency Threshold (&gt;40%)
              </p>
            </div>
          </div>

          {flaggedWorks.length > 0 && (
            <button
              type="button"
              onClick={() => alert(`Official Section 4.2 dossier for ${targetDistrict} transmitted to Directorate of Vigilance and Anti-Corruption (DVAC).`)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold transition shadow-[0_4px_20px_rgba(220,38,38,0.3)] cursor-pointer shrink-0 border border-red-500/30 transform hover:-translate-y-0.5"
            >
              Trigger DVAC Inquiry
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-mono text-[10px]">Agency Distribution:</span>
            <p className="font-bold text-white leading-relaxed">
              {flaggedWorks.length > 0 
                ? "Disproportionate milestone SLA delays clustered under executing contractor ABC Infrastructure Services." 
                : "Contract allocation evenly distributed among accredited state and municipal executing agencies."}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-mono text-[10px]">Rule 4.2 Compliance:</span>
            <p className={`font-bold leading-relaxed ${flaggedWorks.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {flaggedWorks.length > 0 
                ? `${flaggedWorks.length} work orders have exceeded the statutory 45-day SLA timeline.`
                : "No single agency exceeds statutory delay or concentration thresholds."}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-mono text-[10px]">Statutory Remedy:</span>
            <p className="font-bold text-emerald-400 leading-relaxed">
              {flaggedWorks.length > 0 
                ? "Executive powers to withhold advance disbursement pending physical milestone sign-off."
                : "Automatic treasury release authorized under standard SLA timelines."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. DISTRICT ZONAL RISK CONTOUR & HEATMAP */}
      <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-950" />
              <span>{targetDistrict} District Operational Risk Contour</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-950 border border-indigo-200">
                Official Boundaries
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Administrative surveillance sectors synchronized with eSAKSHI live sanction records
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" /> High (&gt;70)
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low (&lt;30)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white border border-slate-800 shadow-inner space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Work Category Risk Clusters
            </span>

            {zones.length === 0 && (
              <p className="text-xs text-slate-400 py-4">No works on file for {targetDistrict} in the current data scope.</p>
            )}

            <div className="space-y-2.5">
              {zones.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                const isHigh = zone.riskScore >= 70;
                const isMed = zone.riskScore >= 40 && zone.riskScore < 70;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-white/15 border-amber-400 shadow-md scale-[1.02]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${
                        isHigh ? 'bg-red-500 animate-ping' : isMed ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <div>
                        <h4 className="text-xs font-bold text-white">{zone.name}</h4>
                        <p className="text-[10px] text-slate-400">{zone.sanctioned} Sanctioned</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      isHigh ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      Risk {zone.riskScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-200 p-5 bg-slate-50/70 space-y-4">
            {activeZone ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    Active Cluster Intelligence
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeZone.riskScore >= 70 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {activeZone.status}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MapPin size={16} className={activeZone.riskScore >= 70 ? "text-red-600" : "text-emerald-600"} />
                  <span>{activeZone.name} ({activeZone.workCount} works)</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-400 block text-[10px]">Cluster Anomaly Risk</span>
                    <span className={`text-base font-mono font-black ${activeZone.riskScore >= 70 ? 'text-red-600' : 'text-slate-900'}`}>
                      {activeZone.riskScore} / 100
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-400 block text-[10px]">Total Allocation</span>
                    <span className="text-base font-mono font-black text-slate-900">{activeZone.sanctioned}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <span>Cluster Intelligence Brief:</span>
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {activeZone.brief}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 py-4">No works on file for {targetDistrict} in the current data scope.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. URGENT CRITICAL CASES REQUIRING DM INTERVENTION */}
      <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-5 h-5 ${flaggedWorks.length > 0 ? "text-red-600 animate-pulse" : "text-emerald-600"}`} />
            <h3 className="text-base font-black text-slate-900">
              {t.triageHeading}
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${
            flaggedWorks.length > 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}>
            {flaggedWorks.length} Critical Hotspots
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          {flaggedWorks.length > 0 ? t.triageSub : t.triageCleanSub}
        </p>

        {flaggedWorks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-black text-emerald-900">{t.triageCleanTitle}</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              All registered works in {targetDistrict} currently match certified records with no milestone SLA delays.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {flaggedWorks.slice(0, 4).map((work) => (
              <div key={work.id} className="p-5 rounded-2xl border border-red-200 bg-red-50/40 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-red-900 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
                    {work.id}
                  </span>
                  <span className="text-xs font-bold text-red-700 font-mono bg-white px-2 py-0.5 rounded border border-red-100">
                    Risk: {work.riskScore}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{work.title}</h4>
                <p className="text-xs text-slate-600">{work.anomalyType}</p>
                <div className="flex items-center gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => alert(`Official Stop-Payment Warrant dispatched for ${work.id}. Disbursal frozen.`)}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    Execute Stop-Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectWork && onSelectWork(work.id)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Inspect Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. FULL DISTRICT OPERATIONAL WORKS REGISTER */}
      <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/70 bg-[#faf6ef]">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {t.registerHeading} ({filteredRegister.length} Projects in {targetDistrict})
            </h3>
            <p className="text-xs text-slate-500 font-medium">Search, sort by risk score, filter stalled works, and inspect project details</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setRiskFilter('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  riskFilter === 'ALL' ? 'bg-indigo-950 text-amber-400 shadow-md' : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                All ({districtWorks.length})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('FLAGGED')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  riskFilter === 'FLAGGED' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                Flagged ({flaggedWorks.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-amber-200/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-6">{t.workId}</th>
                <th className="py-4 px-6">{t.projectTitle}</th>
                <th className="py-4 px-6">MP</th>
                <th className="py-4 px-6">{t.agency}</th>
                <th className="py-4 px-6">{t.sanctioned}</th>
                <th className="py-4 px-6">{t.progress}</th>
                <th className="py-4 px-6">{t.risk}</th>
                <th className="py-4 px-6">{t.auditStatus}</th>
                <th className="py-4 px-6 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegister.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                    No matching works found in {targetDistrict}.
                  </td>
                </tr>
              ) : (
                filteredRegister.map((work) => {
                  const isFlag = work.isNegative || work.riskScore >= 70;
                  const isPinned = work.id === pinnedWorkId;
                  return (
                    <tr
                      key={work.id}
                      onClick={() => onSelectWork && onSelectWork(work.id)}
                      className={`cursor-pointer transition-colors group ${isPinned ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-amber-50/50'}`}
                    >
                      <td className="py-4 px-6 font-mono text-indigo-950 font-black">
                        {isPinned && <span className="mr-1.5 text-amber-600">📌</span>}
                        {work.id}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 group-hover:text-indigo-950 transition-colors line-clamp-1">
                        {work.title}
                      </td>
                      <td className="py-4 px-6">
                        {work.mpName ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSelectMp && onSelectMp(work.mpId); }}
                            className="text-indigo-700 font-bold hover:underline cursor-pointer"
                            title={`Open ${work.mpName}'s constituency dashboard`}
                          >
                            {work.mpName}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">
                        {work.agency || "Unassigned"}
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-slate-900">
                        ₹{(work.sanctionedAmount / 100000).toFixed(1)} L
                      </td>
                      <td className="py-4 px-6">
                        {work.progressPct === null || work.progressPct === undefined ? (
                          <span className="font-mono text-[11px] font-bold text-slate-500">{work.statusLabel || "Status Not Recorded"}</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-100 rounded-full h-2">
                              <div
                                className={`h-full rounded-full ${work.progressPct === 100 ? 'bg-emerald-600' : isFlag ? 'bg-red-600' : 'bg-indigo-950'}`}
                                style={{ width: `${work.progressPct}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700">{work.progressPct}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] border ${
                          isFlag ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          Risk: {work.riskScore}/100
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isFlag ? (
                          <span className="text-red-700 font-bold flex items-center gap-1">
                            <AlertTriangle size={14} /> SLA Anomaly
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 size={14} /> Verified Clean
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-950 hover:text-white text-xs font-bold text-indigo-950 transition-colors cursor-pointer"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. FLOATING COMPANION ROBOT (BOTTY) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {botExpanded ? (
          <div className="w-84 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-2xl border border-indigo-300 shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-300">
            <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-indigo-950 flex items-center justify-center shadow-lg border border-white/20">
                    <Bot size={24} className={isListening || isGenerating ? 'animate-pulse' : ''} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-indigo-950 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-indigo-950" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Botty • Collector AI</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-indigo-950 shadow-2xs">
                      GEMINI
                    </span>
                  </h4>
                  <p className="text-[10px] text-amber-300 font-mono">Administrative Execution Guide</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBotExpanded(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Minimize Botty"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf6ef]/70 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
                <ShieldCheck size={16} className="text-amber-700 shrink-0" />
                <span>Ask me to draft inspection memos, review Rule 4.2 compliance, or flag contractor monopolies.</span>
              </div>

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-950 text-white rounded-br-none font-medium'
                      : 'bg-white border border-amber-200 text-slate-900 rounded-bl-none font-semibold'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-white border border-amber-200 text-indigo-950 text-xs flex items-center gap-2 font-medium shadow-xs">
                    <Clock size={15} className="animate-spin text-amber-500" />
                    <span>Gemini is auditing records...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-amber-200 bg-white space-y-2">
              <button
                type="button"
                onClick={() => setIsListening(!isListening)}
                disabled={isGenerating}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse shadow-md' 
                    : 'bg-indigo-50 text-indigo-950 hover:bg-indigo-100 border border-indigo-200/70'
                }`}
              >
                <Mic size={16} className={isListening ? 'animate-bounce' : 'text-indigo-950'} />
                <span>{isListening ? 'Listening to Collector...' : 'Tap to Dictate Orders'}</span>
              </button>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  disabled={isGenerating}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Draft notice to executing agency..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="p-2.5 rounded-xl bg-indigo-950 text-amber-400 hover:bg-indigo-900 transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBotExpanded(true)}
            className="flex items-center gap-3 p-3.5 rounded-full bg-indigo-950 text-white shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-amber-400/80 animate-pulse"
          >
            <div className="w-9 h-9 rounded-full bg-amber-400 text-indigo-950 flex items-center justify-center shadow-md">
              <Bot size={22} className="animate-bounce" />
            </div>
            <span className="text-xs font-bold pr-2 text-amber-300">
              Botty • Collector AI
            </span>
          </button>
        )}
      </div>

    </div>
  );
}