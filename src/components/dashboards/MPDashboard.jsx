import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle, AlertTriangle, ArrowUpRight, 
  Table, MapPin, Landmark, Clock, Activity, 
  ShieldCheck, IndianRupee, Layers, PhoneCall,
  Bot, Volume2, Sparkles, Send, Mic, X,
  Compass, BarChart3, AlertCircle, FileText,
  MessageSquareQuote, Loader2, Eye, ShieldAlert,
  Calendar, Image as ImageIcon, Globe, Printer, Download,
  UserCheck, LogOut, User, Zap, Flame, Shield, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const UI_TRANSLATIONS = {
  en: {
    house: "18th Lok Sabha",
    seat: "Parliamentary Seat",
    constituency: "Constituency",
    nodalDistrict: "Nodal District",
    summonBtn: "Summon District Magistrate / Order Flying Squad",
    fundPool: "Constituency Fund Pool",
    crGrant: "Cr Grant",
    sanctioned: "Sanctioned",
    unallocated: "Left",
    vitality: "Ground Works Vitality",
    totalProjects: "Total Projects",
    done: "Done",
    active: "Active",
    alert: "Alert",
    quota: "Statutory Social Quota",
    quotaSatisfied: "Statutory Quotas Satisfied",
    quotaAction: "Action Needed: Fund ST Habitats",
    auditIndex: "Constituency Audit Index",
    verifiedNode: "eSAKSHI Verified Cryptographic Node",
    tabMap: "1. Satellite GIS & Geofence Boundary",
    tabProjects: "2. Projects Directory",
    tabFinances: "3. Financial Utilization Pipeline",
    tabSla: "4. Statutory 45-Day SLA Audit",
    mapHeading: "Parliamentary Constituency Satellite Geofence",
    mapSubheading: "The highlighted perimeter designates your statutory jurisdiction. Projects outside this ring violate the MPLADS mandate.",
    aiRecHeading: "AI Opportunity Recommendation",
    draftBtn: "Draft Proposal",
    discussBtn: "Discuss with AI",
    inspectDrill: "Inspect →",
    tableId: "Work ID & Name",
    tableCategory: "Category",
    tableSanctioned: "Sanctioned",
    tableProgress: "Progress",
    tableStatus: "Audit Status",
    tableInspect: "Inspect"
  },
  ta: {
    house: "18வது மக்களவை",
    seat: "நாடாளுமன்ற தொகுதி",
    constituency: "தொகுதி",
    nodalDistrict: "முதன்மை மாவட்டம்",
    summonBtn: "மாவட்ட ஆட்சியரை அழைக்க / பறக்கும் படைக்கு உத்தரவிட",
    fundPool: "தொகுதி நிதி இருப்பு",
    crGrant: "கோடி நிதி",
    sanctioned: "ஒதுக்கப்பட்டது",
    unallocated: "மீதம்",
    vitality: "திட்டங்கள் செயலாக்கம்",
    totalProjects: "மொத்த திட்டங்கள்",
    done: "நிறைவு",
    active: "நடப்பில்",
    alert: "கவனம்",
    quota: "சமூக இடஒதுக்கீட்டு இலக்கு",
    quotaSatisfied: "சட்டப்பூர்வ ஒதுக்கீடுகள் பூர்த்தி செய்யப்பட்டன",
    quotaAction: "நடவடிக்கை தேவை: பழங்குடியினர் நிதி பற்றாக்குறை",
    auditIndex: "தொகுதி தணிக்கை குறியீடு",
    verifiedNode: "eSAKSHI சரிபார்க்கப்பட்ட தணிக்கை தளம்",
    tabMap: "1. செயற்கைக்கோள் வரைபடம் & எல்லை",
    tabProjects: "2. திட்டங்கள் பட்டியல்",
    tabFinances: "3. நிதி பயன்பாட்டு கட்டமைப்பு",
    tabSla: "4. 45-நாள் சட்டப்பூர்வ காலக்கெடு",
    mapHeading: "நாடாளுமன்ற தொகுதி செயற்கைக்கோள் எல்லை",
    mapSubheading: "மஞ்சள் நிற எல்லை உங்கள் தொகுதி எல்லையைக் காட்டுகிறது. இதற்கு வெளியே மேற்கொள்ளப்படும் திட்டங்கள் விதிகளுக்கு புறம்பானவை.",
    aiRecHeading: "செயற்கை நுண்ணறிவு பரிந்துரை",
    draftBtn: "பரிந்துரை கடிதம் வரைவு",
    discussBtn: "AI வழிகாட்டியுடன் விவாதிக்க",
    inspectDrill: "ஆய்வு →",
    tableId: "திட்ட எண் & பெயர்",
    tableCategory: "பிரிவு",
    tableSanctioned: "ஒதுக்கீடு",
    tableProgress: "முன்னேற்றம்",
    tableStatus: "தணிக்கை நிலை",
    tableInspect: "ஆய்வு"
  },
  hi: {
    house: "18वीं लोक सभा",
    seat: "संसदीय क्षेत्र",
    constituency: "निर्वाचन क्षेत्र",
    nodalDistrict: "नोडल जिला",
    summonBtn: "जिला मजिस्ट्रेट को तलब करें / फ्लाइंग स्क्वाड आदेश",
    fundPool: "निर्वाचन क्षेत्र निधि कोष",
    crGrant: "करोड़ अनुदान",
    sanctioned: "स्वीकृत",
    unallocated: "शेष",
    vitality: "जमीनी कार्यों की स्थिति",
    totalProjects: "कुल परियोजनाएं",
    done: "पूर्ण",
    active: "प्रगति में",
    alert: "सतर्कता",
    quota: "वैधानिक सामाजिक कोटा",
    quotaSatisfied: "वैधानिक कोटा पूर्ण रूप से संतुष्ट",
    quotaAction: "कार्रवाई आवश्यक: एसटी बस्तियों को धन आवंटित करें",
    auditIndex: "संसदीय लेखापरीक्षा सूचकांक",
    verifiedNode: "eSAKSHI सत्यापित क्रिप्टोग्राफ़िक नोड",
    tabMap: "1. उपग्रह जीआईएस और भू-बाड़ सीमा",
    tabProjects: "2. परियोजनाएं सूची",
    tabFinances: "3. वित्तीय उपयोग पाइपलाइन",
    tabSla: "4. 45-दिवसीय वैधानिक समय सीमा ऑडिट",
    mapHeading: "संसदीय निर्वाचन क्षेत्र उपग्रह भू-बाड़",
    mapSubheading: "पीली सीमा आपके आधिकारिक संसदीय अधिकार क्षेत्र को दर्शाती है। इसके बाहर के कार्य नियमों का उल्लंघन हैं।",
    aiRecHeading: "एआई अवसर सिफारिश",
    draftBtn: "प्रस्ताव का मसौदा तैयार करें",
    discussBtn: "एआई से चर्चा करें",
    inspectDrill: "निरीक्षण →",
    tableId: "कार्य आईडी और नाम",
    tableCategory: "श्रेणी",
    tableSanctioned: "स्वीकृत",
    tableProgress: "प्रगति",
    tableStatus: "लेखापरीक्षा स्थिति",
    tableInspect: "निरीक्षण"
  }
};

const DISTRICT_GEO = {
  "Madurai": {
    center: [9.9252, 78.1198],
    zoom: 11,
    boundary: [
      [10.1500, 77.8500], [10.2200, 78.1200], [10.1800, 78.3200],
      [9.9800, 78.4200], [9.7500, 78.2800], [9.7200, 78.0200], [9.8100, 77.8200]
    ],
    unallocatedZone: [9.9800, 78.1900],
    zoneLabel: {
      en: "East Madurai Rural Sector (Drinking Water Deficit Habitation)",
      ta: "கிழக்கு மதுரை ஊரகப் பகுதி (குடிநீர் பற்றாக்குறை குடியிருப்பு)",
      hi: "पूर्वी मदुरै ग्रामीण क्षेत्र (पेयजल अभाव बस्ती)"
    }
  },
  "Coimbatore": {
    center: [11.0168, 76.9558],
    zoom: 11,
    boundary: [
      [11.2500, 76.8200], [11.3200, 77.0800], [11.1500, 77.2200],
      [10.8500, 77.1500], [10.7200, 76.9200], [10.8800, 76.7500], [11.1200, 76.7600]
    ],
    unallocatedZone: [11.0800, 76.8800],
    zoneLabel: {
      en: "Western Ghats Tribal Fringe Community",
      ta: "மேற்கு தொடர்ச்சி மலை பழங்குடியினர் குடியிருப்பு",
      hi: "पश्चिमी घाट जनजातीय सीमांत समुदाय"
    }
  },
  "Chennai Central": {
    center: [13.0827, 80.2707],
    zoom: 12,
    boundary: [
      [13.1400, 80.2200], [13.1500, 80.3000], [13.0500, 80.3100],
      [13.0100, 80.2500], [13.0400, 80.2000], [13.1000, 80.1900]
    ],
    unallocatedZone: [13.0400, 80.2100],
    zoneLabel: {
      en: "Urban Slum Sanitation & Solid Waste Node",
      ta: "நகர்ப்புற குடிசை பகுதி சுகாதார மற்றும் கழிவு மேலாண்மை மையம்",
      hi: "शहरी झुग्गी स्वच्छता एवं ठोस अपशिष्ट नोड"
    }
  }
};

export default function MPDashboard({ 
  mpProfiles = [], 
  works = [], 
  onSelectWork, 
  scopedMpId = null,
  onLogout,
  currentUser
}) {
  const [selectedMpId, setSelectedMpId] = useState(scopedMpId || "MP001"); 
  const [activeTab, setActiveTab] = useState('map');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [currentLang, setCurrentLang] = useState('en');
  
  // Modals & Panels
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [showDraftLetterModal, setShowDraftLetterModal] = useState(false);

  // Floating Companion Robot State (Gemini)
  const [botExpanded, setBotExpanded] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'bot', 
      text: 'வணக்கம் மாண்புமிகு நாடாளுமன்ற உறுப்பினர் அவர்களே! நான் உங்கள் Gemini AI வழிகாட்டி. உங்கள் தொகுதி திட்டங்கள் மற்றும் நிதி பயன்பாடு குறித்து உடனுக்குடன் ஆலோசிக்கலாம்.' 
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.en;

  useEffect(() => {
    if (scopedMpId) setSelectedMpId(scopedMpId);
  }, [scopedMpId]);

  const currentMp = mpProfiles.find(m => (m.id === (scopedMpId || selectedMpId) || m.mpId === (scopedMpId || selectedMpId))) || mpProfiles[0] || {};
  const currentMpId = currentMp?.id || currentMp?.mpId || currentUser?.mpId || "MP001";
  const currentDistrict = (currentUser?.district || currentMp?.district || "Coimbatore").trim();
  const rawMpName = currentUser?.name || currentMp?.name || 'Shri Ravi Prakash';

  // 1. DATA SYNCHRONIZATION ENGINE FOR MP
  const worksPool = Array.isArray(works) ? works : [];

  const mpWorks = useMemo(() => {
    return worksPool.filter(w => {
      const wMpId = (w.mpId || "").toLowerCase().trim();
      const wDistrict = (w.district || "").toLowerCase().trim();
      const currentDistLower = currentDistrict.toLowerCase().trim();
      const currentMpIdLower = currentMpId.toLowerCase().trim();

      return (wMpId && wMpId === currentMpIdLower) || (wDistrict && wDistrict.includes(currentDistLower));
    });
  }, [worksPool, currentDistrict, currentMpId]);

  // Derived metrics that guarantee table rows match KPI counters exactly
  const completedCount = useMemo(() => mpWorks.filter(w => w.progressPct === 100).length, [mpWorks]);
  const inProgressCount = useMemo(() => mpWorks.filter(w => w.progressPct !== 100).length, [mpWorks]);
  const flaggedCount = useMemo(() => mpWorks.filter(w => w.isNegative || w.riskScore >= 70).length, [mpWorks]);

  const filteredWorks = useMemo(() => {
    if (filterCategory === 'FLAGGED') return mpWorks.filter(w => w.isNegative || w.riskScore >= 70);
    return mpWorks;
  }, [mpWorks, filterCategory]);

  const entitlementVal = currentMp.entitlement || 50000000;
  const sanctionedVal = currentMp.sanctionedAmount || 7500000;
  const expenditureVal = currentMp.expenditureAmount || 5500000;
  const unallocatedVal = entitlementVal - sanctionedVal;

  const scPct = currentMp.scAllocationPct ?? 15.0;
  const stPct = currentMp.stAllocationPct ?? 7.5;
  const scCompliant = scPct >= 15.0;
  const stCompliant = stPct >= 7.5;

  const fundFlowData = [
    { name: currentLang === 'ta' ? "மத்திய நிதி" : currentLang === 'hi' ? "केंद्रीय अनुदान" : "Central Grant", amount: entitlementVal / 10000000, fill: "#0f172a" },
    { name: currentLang === 'ta' ? "ஒதுக்கீடு" : currentLang === 'hi' ? "स्वीकृत" : "Sanctioned", amount: sanctionedVal / 10000000, fill: "#3b82f6" },
    { name: currentLang === 'ta' ? "செலவு" : currentLang === 'hi' ? "व्यய" : "Expended", amount: expenditureVal / 10000000, fill: "#10b981" },
    { name: currentLang === 'ta' ? "மீதம்" : currentLang === 'hi' ? "शेष" : "Balance", amount: unallocatedVal / 10000000, fill: "#f59e0b" }
  ];

  const districtGeoInfo = DISTRICT_GEO[currentDistrict] || {
    center: [11.0168, 76.9558],
    zoom: 11,
    boundary: [
      [11.2500, 76.8200], [11.3200, 77.0800], [11.1500, 77.2200],
      [10.8500, 77.1500], [10.7200, 76.9200], [10.8800, 76.7500]
    ],
    unallocatedZone: [11.0800, 76.8800],
    zoneLabel: {
      en: `${currentDistrict} Underserved Sector`,
      ta: `${currentDistrict} பின்தங்கிய பகுதி`,
      hi: `${currentDistrict} अविकसित क्षेत्र`
    }
  };

  const currentZoneLabel = districtGeoInfo.zoneLabel[currentLang] || districtGeoInfo.zoneLabel.en;

  // Leaflet CDN injection
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLeafletReady(true);
    document.body.appendChild(script);
  }, []);

  // Map Setup
  useEffect(() => {
    if (!leafletReady || activeTab !== 'map' || !mapContainerRef.current) return;

    const L = window.L;
    const container = mapContainerRef.current;

    if (container._leaflet_id) container._leaflet_id = null;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(container, {
        center: districtGeoInfo.center,
        zoom: districtGeoInfo.zoom,
        scrollWheelZoom: true
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Esri Satellite'
      }).addTo(map);

      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        opacity: 0.85
      }).addTo(map);

      if (districtGeoInfo.boundary && districtGeoInfo.boundary.length > 0) {
        const boundaryPolygon = L.polygon(districtGeoInfo.boundary, {
          color: '#f59e0b',
          weight: 3.5,
          opacity: 0.95,
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
          dashArray: '8, 6'
        }).addTo(map);

        map.fitBounds(boundaryPolygon.getBounds(), { padding: [35, 35] });
      }

      mpWorks.forEach((work, idx) => {
        const isDone = work.progressPct === 100;
        const isFlag = work.isNegative || work.riskScore >= 70;

        const distLat = districtGeoInfo.center[0];
        const distLng = districtGeoInfo.center[1];
        const lat = work.latitude || (distLat + ((idx * 0.016) - 0.022));
        const lng = work.longitude || (distLng + (((idx * 0.022) % 0.06) - 0.028));

        const marker = L.circleMarker([lat, lng], {
          radius: 11,
          color: '#ffffff',
          weight: 2.5,
          fillColor: isFlag ? '#dc2626' : isDone ? '#059669' : '#2563eb',
          fillOpacity: 0.95
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 180px;">
            <b style="color: #1e1b4b;">${work.id}</b>
            <div style="font-weight: 700; margin-top: 2px; color: #0f172a;">${work.title}</div>
            <div style="color: ${isFlag ? '#dc2626' : '#059669'}; font-weight: 700; margin-top: 4px;">
              ${isFlag ? `⚠ Anomaly: Risk ${work.riskScore}/100` : `✓ Verified Clean`}
            </div>
          </div>
        `);

        marker.on('click', () => onSelectWork && onSelectWork(work.id));
      });

      if (districtGeoInfo.unallocatedZone) {
        const zone = L.circleMarker(districtGeoInfo.unallocatedZone, {
          radius: 32,
          color: '#f59e0b',
          weight: 3,
          dashArray: '5, 8',
          fillColor: '#fbbf24',
          fillOpacity: 0.35
        }).addTo(map);

        zone.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 4px;">
            <b style="color: #78350f;">AI Statutory Allocation Hotspot</b>
            <div style="margin-top: 3px; color: #334155;">${currentZoneLabel}</div>
            <div style="color: #047857; font-weight: 700; margin-top: 3px;">Allocate ₹35.0 Lakhs to satisfy community quotas.</div>
          </div>
        `);
      }

      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 300);
    } catch (err) {
      console.warn("Map setup error:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletReady, activeTab, currentDistrict, mpWorks, currentLang]);

  const handleStartCall = () => {
    setShowCallModal(true);
    setCallStatus('calling');
    setTimeout(() => setCallStatus('connected'), 1400);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: `Hon'ble MP Sir, in ${currentDistrict}, you have ${flaggedCount} flagged milestone anomaly requiring collectorate audit, and ₹${(unallocatedVal / 10000000).toFixed(2)} Cr remaining to allocate for community quotas.` 
        }
      ]);
    }, 1000);
  };

  return (
    <div className="w-full bg-[#fcf9f2] text-slate-900 font-sans select-none space-y-6 pb-24">
      
      {/* 1. FLASHY GLOWING CONSTITUENCY HEADER */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-white via-amber-50/30 to-indigo-50/30 backdrop-blur-xl border border-amber-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 flex shadow-md">
          <div className="w-1/3 bg-[#FF9933] animate-pulse" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808] animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-3">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-gradient-to-tr from-indigo-950 to-indigo-900 text-amber-400 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <User size={42} className="text-amber-300 drop-shadow-md" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce" title="Verified Node">
                <UserCheck size={13} />
              </span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-amber-300 shadow-sm border border-indigo-900">
                  {t.house}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                  {currentDistrict} {t.seat}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 bg-clip-text text-transparent">
                {rawMpName}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 font-semibold flex items-center gap-2">
                <MapPin size={16} className="text-indigo-900 animate-pulse" />
                <span>{t.constituency}: <strong className="text-slate-900 font-bold">{currentDistrict}</strong></span>
                <span>•</span>
                <span>{t.nodalDistrict}: <strong className="text-slate-900 font-bold">{currentDistrict}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-amber-200/80 shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentLang('ta')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLang === 'ta' ? 'bg-indigo-950 text-amber-400 shadow-md scale-105' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLang === 'en' ? 'bg-indigo-950 text-amber-400 shadow-md scale-105' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('hi')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLang === 'hi' ? 'bg-indigo-950 text-amber-400 shadow-md scale-105' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={handleStartCall}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(220,38,38,0.3)] transition-all cursor-pointer border border-red-500/30 transform hover:-translate-y-0.5"
            >
              <PhoneCall size={17} className="text-amber-300 animate-bounce" />
              <span>{t.summonBtn}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
                title="Sign out"
              >
                <LogOut size={16} className="text-rose-600" />
                <span className="sm:hidden">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. THE 4 STATUTORY PILLARS (100% Synced) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{t.fundPool}</span>
            <IndianRupee size={15} className="text-amber-500 group-hover:scale-110 transition-transform" />
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black font-mono text-slate-950">₹{(entitlementVal / 10000000).toFixed(2)}</span>
            <span className="text-sm font-bold text-slate-500">{t.crGrant}</span>
          </div>
          <div className="text-xs font-bold text-emerald-800 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{t.sanctioned}: ₹{(sanctionedVal / 100000).toFixed(1)} L</span>
            <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              ₹{(unallocatedVal / 10000000).toFixed(2)} Cr {t.unallocated}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.15)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{t.vitality}</span>
            <Activity size={15} className="text-indigo-600 group-hover:scale-110 transition-transform" />
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black font-mono text-indigo-950">{mpWorks.length}</span>
            <span className="text-xs font-bold text-slate-500">{t.totalProjects}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-100">
            <span className="text-emerald-700">✓ {completedCount} {t.done}</span>
            <span className="text-blue-700">• {inProgressCount} {t.active}</span>
            <span className={flaggedCount > 0 ? "text-red-600 animate-pulse" : "text-slate-400"}>
              ⚠ {flaggedCount} {t.alert}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{t.quota}</span>
            <Layers size={15} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${scCompliant && stCompliant ? 'text-emerald-700' : 'text-red-600'}`}>
              {scPct}% SC / {stPct}% ST
            </span>
          </div>
          <div className="text-[11px] font-bold pt-1 border-t border-slate-100">
            {scCompliant && stCompliant ? (
              <span className="text-emerald-700 flex items-center gap-1">✓ {t.quotaSatisfied}</span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">⚠ {t.quotaAction}</span>
            )}
          </div>
          <div className="text-[9px] text-slate-400 font-medium leading-snug pt-1">
            {currentMp.scStProxyNote || "Estimated from work-description keywords -- no official SC/ST-area field in source data."}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col justify-between space-y-2 group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{t.auditIndex}</span>
            <Shield size={15} className="text-indigo-950 group-hover:scale-110 transition-transform" />
          </span>
          <div className="my-1">
            <h4 className={`text-sm font-black leading-snug ${flaggedCount > 0 ? 'text-red-700' : 'text-emerald-800'}`}>
              {flaggedCount === 0 ? "100% Compliant" : `${flaggedCount} Active Anomaly`}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
              {flaggedCount === 0 ? "All works verified with photo elevation proofs." : "Inspection squad review required."}
            </p>
          </div>
          <div className="text-[11px] font-bold text-indigo-950 pt-1 border-t border-slate-100 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{t.verifiedNode}</span>
          </div>
        </div>
      </div>

      {/* 3. SIMPLIFIED MENU TABS */}
      <div className="flex flex-wrap items-center gap-3 border-b border-amber-200/70 pb-3 w-full">
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'map' 
              ? 'bg-indigo-950 text-amber-400 shadow-[0_4px_15px_rgba(15,23,42,0.3)] ring-2 ring-indigo-950/20 scale-102' 
              : 'bg-white/80 text-slate-700 hover:bg-white border border-amber-200/60'
          }`}
        >
          <Compass size={17} className={activeTab === 'map' ? 'text-amber-400 animate-spin' : ''} />
          <span>{t.tabMap}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'projects' 
              ? 'bg-indigo-950 text-amber-400 shadow-[0_4px_15px_rgba(15,23,42,0.3)] ring-2 ring-indigo-950/20 scale-102' 
              : 'bg-white/80 text-slate-700 hover:bg-white border border-amber-200/60'
          }`}
        >
          <Table size={17} />
          <span>{t.tabProjects} ({mpWorks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finances')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'finances' 
              ? 'bg-indigo-950 text-amber-400 shadow-[0_4px_15px_rgba(15,23,42,0.3)] ring-2 ring-indigo-950/20 scale-102' 
              : 'bg-white/80 text-slate-700 hover:bg-white border border-amber-200/60'
          }`}
        >
          <BarChart3 size={17} />
          <span>{t.tabFinances}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sla')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sla' 
              ? 'bg-indigo-950 text-amber-400 shadow-[0_4px_15px_rgba(15,23,42,0.3)] ring-2 ring-indigo-950/20 scale-102' 
              : 'bg-white/80 text-slate-700 hover:bg-white border border-amber-200/60'
          }`}
        >
          <Calendar size={17} className="text-amber-500" />
          <span>{t.tabSla}</span>
        </button>
      </div>

      {/* 4. MAIN FLUID WORKSPACE VIEW */}
      <div className="w-full space-y-6">
        
        {/* TAB 1: SATELLITE GIS MAP & RADAR */}
        {activeTab === 'map' && (
          <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {currentDistrict} {t.mapHeading}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t.mapSubheading}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> {t.done}
                </span>
                <span className="flex items-center gap-1.5 text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" /> {t.active}
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" /> {t.alert}
                </span>
              </div>
            </div>

            {/* LEAFLET SATELLITE CONTAINER */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-amber-200 shadow-inner z-0 bg-slate-900" style={{ height: '530px' }}>
              <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '530px' }} />

              <div className="absolute top-4 right-4 z-[400] bg-slate-950/85 text-white px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold border border-slate-700 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ISRO / ESRI High-Res Orbital Satellite</span>
              </div>

              <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 text-[11px] font-bold shadow-md flex items-center gap-2">
                <div className="w-4 h-0.5 bg-amber-500 border border-dashed border-amber-600" />
                <span>{currentDistrict} Constituency Geofence Boundary</span>
              </div>
            </div>

            {/* AI OPPORTUNITY RECOMMENDATION */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/50 border border-amber-300/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-600 animate-spin" />
                  <span>{t.aiRecHeading}</span>
                </span>
                <h4 className="text-sm font-bold text-slate-900">{currentZoneLabel}</h4>
                <p className="text-xs text-slate-600 max-w-4xl">
                  Allocate ₹35.0 Lakhs from your remaining ₹{(unallocatedVal / 10000000).toFixed(2)} Cr pool to satisfy community quotas in this sector.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDraftLetterModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-amber-400 text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer hover:scale-105"
                >
                  <FileText size={15} />
                  <span>{t.draftBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS CATALOG (100% Synchronized) */}
        {activeTab === 'projects' && (
          <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 flex items-center justify-between border-b border-amber-200/70 bg-[#faf6ef]">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {rawMpName} ({currentDistrict}) {t.tabProjects}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Click any row to open forensic drill-down verification.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === 'ALL' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  All ({mpWorks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('FLAGGED')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === 'FLAGGED' ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Flagged ({flaggedCount})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-amber-200/60 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-6">{t.tableId}</th>
                    <th className="py-3.5 px-6">{t.tableCategory}</th>
                    <th className="py-3.5 px-6">{t.tableSanctioned}</th>
                    <th className="py-3.5 px-6">{t.tableProgress}</th>
                    <th className="py-3.5 px-6">{t.tableStatus}</th>
                    <th className="py-3.5 px-6 text-right">{t.tableInspect}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                        No registered works matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWorks.map((work) => {
                      const isFlagged = work.isNegative || work.riskScore >= 70;
                      return (
                        <tr
                          key={work.id}
                          onClick={() => onSelectWork && onSelectWork(work.id)}
                          className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="font-mono text-indigo-950 font-black block text-xs">{work.id}</span>
                            <span className="text-slate-900 font-bold line-clamp-1">{work.title}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-semibold">{work.category}</td>
                          <td className="py-4 px-6 font-mono font-black text-slate-900">
                            ₹{(work.sanctionedAmount / 100000).toFixed(1)} L
                          </td>
                          <td className="py-4 px-6">
                            {work.progressPct === null || work.progressPct === undefined ? (
                              <span className="font-mono text-[11px] font-bold text-slate-500">{work.statusLabel || "Status Not Recorded"}</span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-slate-100 rounded-full h-2.5">
                                  <div
                                    className={`h-full rounded-full ${work.progressPct === 100 ? 'bg-emerald-600' : isFlagged ? 'bg-red-600' : 'bg-indigo-950'}`}
                                    style={{ width: `${work.progressPct}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-800">{work.progressPct}%</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {isFlagged ? (
                              <span className="text-red-700 font-bold flex items-center gap-1.5">
                                <AlertTriangle size={15} /> {work.anomalyType}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                <CheckCircle size={15} /> Verified Compliant
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              className="px-4 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-950 hover:text-white text-xs font-bold text-indigo-950 transition-colors cursor-pointer"
                            >
                              {t.inspectDrill}
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
        )}

        {/* TAB 3: FINANCIAL UTILIZATION PIPELINE */}
        {activeTab === 'finances' && (
          <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {t.tabFinances} (₹ Crores)
                </h3>
                <p className="text-xs text-slate-500">
                  Full lifecycle pipeline of central treasury grants down to inspected ground delivery.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-950 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
                FY 2026 Active
              </span>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundFlowData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={13} tickLine={false} />
                  <YAxis unit=" Cr" stroke="#64748b" fontSize={13} tickLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3.5 rounded-xl bg-slate-950 text-white text-xs font-mono shadow-xl border border-slate-800">
                            <p className="font-bold text-amber-400">{payload[0].payload.name}</p>
                            <p className="text-white text-sm">₹{payload[0].value.toFixed(2)} Crore</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {fundFlowData.map((entry, index) => (
                      <Cell key={`flow-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4: STATUTORY 45-DAY SLA SURVEILLANCE */}
        {activeTab === 'sla' && (
          <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  District Authority 45-Day Statutory Approval Clock
                </h3>
                <p className="text-xs text-slate-500">
                  Under official guidelines, District Authorities must sanction or reject recommended works within 45 days.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-mono text-xs font-bold border border-red-200">
                Statutory Legal Clock
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {mpWorks.map((work) => {
                const daysElapsed = work.daysToSanction;
                const hasData = daysElapsed !== null && daysElapsed !== undefined;
                const daysRemaining = hasData ? Math.max(0, 45 - daysElapsed) : null;
                const isBreached = hasData && daysElapsed > 45;

                return (
                  <div key={work.id} className={`p-4 rounded-2xl border ${isBreached ? 'bg-red-50/60 border-red-300' : 'bg-white border-slate-200'} space-y-3 shadow-xs`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-900">{work.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        !hasData ? 'bg-slate-100 text-slate-500' : isBreached ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {!hasData ? 'No recommendation date on file' : isBreached ? 'SLA BREACH' : `${daysRemaining} Days Left`}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{work.title}</p>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Elapsed Time:</span>
                        <span>{hasData ? `${daysElapsed} / 45 Days` : "Unavailable"}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isBreached ? 'bg-red-600' : 'bg-indigo-900'}`}
                          style={{ width: hasData ? `${Math.min(100, (daysElapsed / 45) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>

                    {isBreached ? (
                      <button
                        type="button"
                        onClick={handleStartCall}
                        className="w-full py-2 rounded-xl bg-red-600 text-white text-[11px] font-bold shadow hover:bg-red-700 transition cursor-pointer"
                      >
                        Escalate to Collectorate
                      </button>
                    ) : (
                      <span className="block text-center text-[11px] text-slate-500 font-semibold py-1">
                        Normal Processing Range
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 5. ALWAYS-PRESENT FLOATING COMPANION ROBOT (BOTTY) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {botExpanded ? (
          <div className="w-84 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-2xl border border-amber-300 shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-300">
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
                    <span>Botty • MP Sahayak</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-indigo-950 shadow-2xs">
                      GEMINI
                    </span>
                  </h4>
                  <p className="text-[10px] text-amber-300 font-mono">Real-time Intelligence Guide</p>
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
                <MessageSquareQuote size={16} className="text-amber-700 shrink-0" />
                <span>Ask any question or query constituency fund allocations.</span>
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
                    <Loader2 size={15} className="animate-spin text-amber-500" />
                    <span>Gemini is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-amber-200 bg-white space-y-2">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  disabled={isGenerating}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type question here..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="p-2.5 rounded-xl bg-indigo-950 text-amber-400 hover:bg-indigo-900 transition-colors cursor-pointer shrink-0 shadow-sm"
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
              Botty • MP Sahayak
            </span>
          </button>
        )}
      </div>

      {/* 7. OFFICIAL DRAFTING RECOMMENDATION LETTER MODAL */}
      {showDraftLetterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-amber-300 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shadow-sm">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Official MPLADS Recommendation Letter</h3>
                  <p className="text-xs text-slate-500 font-mono">eSAKSHI Rule 3.1 &bull; Statutory Form Annexure II</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftLetterModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#faf6ef] border border-amber-200 font-serif text-xs text-slate-900 space-y-4 shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400 bg-indigo-950 text-amber-400 flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-950 text-sm">{rawMpName}</h4>
                    <p className="text-[11px] text-slate-600">Member of Parliament ({currentMp.house || 'Lok Sabha'})</p>
                    <p className="text-[10px] text-slate-500">{currentDistrict} Parliamentary Constituency</p>
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-500">
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                  <p>File No: MPLADS/TN/{currentDistrict.toUpperCase()}/2026</p>
                </div>
              </div>

              <p className="leading-relaxed">
                To The District Collector & Magistrate,<br />
                Under the provisions of the MPLADS Scheme Guidelines, I hereby formally recommend the public utility work <strong>{currentZoneLabel}</strong> with a recommended allocation of ₹35,00,000/- for rural habitations.
              </p>

              <div className="pt-4 flex justify-between items-end font-sans">
                <div className="text-[10px] font-mono text-slate-500">
                  <p>Digital Cryptographic Node: TN-{currentDistrict.toUpperCase()}-2026</p>
                  <p>SHA256-VERIFIED-AUTH</p>
                </div>
                <div className="text-center font-bold text-slate-900">
                  <p>{rawMpName}</p>
                  <p className="text-[10px] text-slate-500">Member of Parliament</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Printer size={16} />
                <span>Print Official Letter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Formal proposal dispatched directly to the District Collectorate eSAKSHI inbox.");
                  setShowDraftLetterModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
              >
                <Send size={16} />
                <span>Submit to Collectorate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. STATUTORY CALL ESCALATION DIALOG */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-amber-300 shadow-2xl p-6 space-y-5 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center shadow-inner">
              <PhoneCall size={30} className={callStatus === 'calling' ? 'animate-pulse' : ''} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full">
                Statutory Administrative Line
              </span>
              <h3 className="text-lg font-black text-slate-900 pt-1">
                {callStatus === 'calling' ? 'Connecting Secure Line...' : 'Connected: District Magistrate Office'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentDistrict} District Implementation Authority (eSAKSHI Encrypted)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Calling Authority:</span>
                <span className="font-bold text-slate-900">{rawMpName} (MP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Jurisdiction:</span>
                <span className="font-bold text-slate-900">{currentDistrict} Constituency</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Action:</span>
                <span className="font-bold text-red-700">Order Squad Inspection / Freeze Disputed Tranche</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                End Call
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Official Inspection Warrant dispatched to the District Collectorate.");
                  setShowCallModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Confirm Squad Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}