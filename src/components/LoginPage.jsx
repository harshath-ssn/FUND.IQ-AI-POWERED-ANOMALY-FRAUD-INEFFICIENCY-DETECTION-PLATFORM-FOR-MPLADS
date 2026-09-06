import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Landmark, ShieldCheck, User, Key, Lock, ArrowRight, ArrowLeft, 
  MapPin, Building2, CheckCircle2, ChevronRight, Shield, Layers, Compass, 
  RotateCcw, Volume2, VolumeX, Search
} from 'lucide-react';

import { MP_PROFILES } from '../data/mpMaster';
import { AUTH_USERS } from '../data/authUsers';

import parliamentBg from '../assets/parliament.png';
import nationalEmblem from '../assets/Government-Jobs-In-India-for-2013.jpg';

export default function LoginPage({ onLogin }) {
  const [showCinematicIntro, setShowCinematicIntro] = useState(true);
  const [introPhase, setIntroPhase] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);

  const [currentStep, setCurrentStep] = useState('select_role'); 
  const [selectedRole, setSelectedRole] = useState('district'); 

  const [districtStateFilter, setDistrictStateFilter] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [selectedAuthId, setSelectedAuthId] = useState('');

  const [mpStateFilter, setMpStateFilter] = useState('');
  const [mpSearch, setMpSearch] = useState('');
  const [selectedMpId, setSelectedMpId] = useState('');

  const [selectedNodalState, setSelectedNodalState] = useState('');

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const allStates = useMemo(() => {
    const states = new Set();
    if (AUTH_USERS) AUTH_USERS.forEach(u => u.state && states.add(u.state.trim()));
    if (MP_PROFILES) MP_PROFILES.forEach(m => m.state && states.add(m.state.trim()));
    return Array.from(states).sort();
  }, []);

  useEffect(() => {
    if (allStates.length > 0) {
      if (!districtStateFilter) setDistrictStateFilter(allStates[0]);
      if (!mpStateFilter) setMpStateFilter(allStates[0]);
      if (!selectedNodalState) setSelectedNodalState(allStates[0]);
    }
  }, [allStates, districtStateFilter, mpStateFilter, selectedNodalState]);

  const filteredDistrictAuths = useMemo(() => {
    if (!AUTH_USERS) return [];
    return AUTH_USERS.filter(u => {
      const matchState = !districtStateFilter || u.state?.toLowerCase() === districtStateFilter.toLowerCase();
      const matchSearch = !districtSearch || 
        u.name?.toLowerCase().includes(districtSearch.toLowerCase()) ||
        u.district?.toLowerCase().includes(districtSearch.toLowerCase()) ||
        u.username?.toLowerCase().includes(districtSearch.toLowerCase());
      return matchState && matchSearch;
    });
  }, [districtStateFilter, districtSearch]);

  const currentDistrictAuth = useMemo(() => {
    if (selectedAuthId) {
      const match = AUTH_USERS?.find(u => u.id === selectedAuthId || u.username === selectedAuthId);
      if (match) return match;
    }
    return filteredDistrictAuths[0] || AUTH_USERS?.[0] || {
      id: "DIST0001",
      district: "National District",
      name: "District Magistrate",
      role: "district",
      title: "District Magistrate (DM)",
      office: "Office of the District Collector",
      username: "dm_admin",
      state: "All India"
    };
  }, [selectedAuthId, filteredDistrictAuths]);

  const filteredMps = useMemo(() => {
    if (!MP_PROFILES) return [];
    return MP_PROFILES.filter(m => {
      const matchState = !mpStateFilter || m.state?.toLowerCase() === mpStateFilter.toLowerCase();
      const matchSearch = !mpSearch ||
        m.name?.toLowerCase().includes(mpSearch.toLowerCase()) ||
        m.constituency?.toLowerCase().includes(mpSearch.toLowerCase()) ||
        m.district?.toLowerCase().includes(mpSearch.toLowerCase());
      return matchState && matchSearch;
    });
  }, [mpStateFilter, mpSearch]);

  const currentMpAuth = useMemo(() => {
    if (selectedMpId) {
      const match = MP_PROFILES?.find(m => m.id === selectedMpId);
      if (match) return match;
    }
    return filteredMps[0] || MP_PROFILES?.[0] || {
      id: "MP0001",
      name: "Hon'ble Member of Parliament",
      district: "Parliamentary Seat",
      constituency: "Parliamentary Seat",
      state: "All India"
    };
  }, [selectedMpId, filteredMps]);

  const playCinematicImpact = () => {
    if (soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const t0 = ctx.currentTime;

      // 1. Deep Sub-Bass Thud (48Hz -> 30Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(65, t0);
      subOsc.frequency.exponentialRampToValueAtTime(32, t0 + 1.2);

      subGain.gain.setValueAtTime(0.7, t0);
      subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.8);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t0);
      subOsc.stop(t0 + 1.8);

      // 2. Lowpass Warm Noise Sweep (Cinematic Air Rush)
      const bufferSize = ctx.sampleRate * 1.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, t0);
      filter.frequency.linearRampToValueAtTime(800, t0 + 0.35);
      filter.frequency.exponentialRampToValueAtTime(80, t0 + 1.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.5);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(t0);
      whiteNoise.stop(t0 + 1.5);

      // 3. Warm Ambient Triad Swell (C3, G3, C4)
      [130.81, 196.00, 261.63].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0 + 0.1);

        gain.gain.setValueAtTime(0.001, t0 + 0.1);
        gain.gain.linearRampToValueAtTime(0.12, t0 + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + 0.1);
        osc.stop(t0 + 2.5);
      });
    } catch (err) {
      console.warn("Audio error:", err);
    }
  };

  useEffect(() => {
    if (!showCinematicIntro) return;

    const t0 = setTimeout(() => {
      setIntroPhase(1);
      playCinematicImpact();
    }, 400);

    const t1 = setTimeout(() => {
      setIntroPhase(2);
    }, 1400);

    const t2 = setTimeout(() => {
      setIntroPhase(3);
    }, 2800);

    const t3 = setTimeout(() => {
      setShowCinematicIntro(false);
    }, 3400);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showCinematicIntro]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleRoleCardClick = (role) => {
    setSelectedRole(role);
    setCurrentStep('credentials');
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === 'district') {
      onLogin({
        ...currentDistrictAuth,
        role: 'district'
      });
    } else if (selectedRole === 'mp') {
      onLogin({
        id: currentMpAuth.id,
        username: `mp_${currentMpAuth.id.toLowerCase()}`,
        name: currentMpAuth.name,
        role: 'mp',
        district: currentMpAuth.constituency || currentMpAuth.district,
        constituency: currentMpAuth.constituency || currentMpAuth.district,
        state: currentMpAuth.state,
        mpId: currentMpAuth.id,
        title: `Member of Parliament (${currentMpAuth.constituency || currentMpAuth.district})`,
        office: `Constituency Office, ${currentMpAuth.constituency || currentMpAuth.district}, ${currentMpAuth.state}`
      });
    } else if (selectedRole === 'state') {
      const stateJurisdiction = selectedNodalState || "All India";
      onLogin({
        id: `STATE_${stateJurisdiction.toUpperCase().slice(0, 3)}`,
        username: `state_${stateJurisdiction.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}`,
        name: `Principal Secretary (P&D), ${stateJurisdiction}`,
        role: 'state',
        state: stateJurisdiction,
        district: 'ALL',
        title: 'State Nodal Officer (SNA)',
        office: stateJurisdiction === 'All India'
          ? 'Ministry of Statistics & Programme Implementation, New Delhi'
          : `Planning & Development Department, Government of ${stateJurisdiction}`
      });
    } else {
      onLogin({
        id: 'MIN001',
        username: 'mospi_sec',
        name: 'Secretary, MoSPI',
        role: 'ministry',
        state: 'ALL',
        district: 'ALL',
        title: 'Central MoSPI Administrator',
        office: 'Ministry of Statistics & Programme Implementation, New Delhi'
      });
    }
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-y-auto select-none text-slate-100 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(9, 11, 20, 0.85), rgba(9, 11, 20, 0.95)), url(${parliamentBg})`
      }}
    >
      {showCinematicIntro && (
        <div className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${
          introPhase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="absolute top-0 left-0 right-0 h-14 sm:h-20 bg-black border-b border-white/5 z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 bg-black border-t border-white/5 z-20 flex items-center justify-between px-8">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              MoSPI Sovereign Sentinel Engine
            </span>
            <button
              type="button"
              onClick={() => setShowCinematicIntro(false)}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-amber-400 border border-white/10 transition cursor-pointer"
            >
              Skip Intro &rarr;
            </button>
          </div>

          <div className={`absolute w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-all duration-1000 ${
            introPhase >= 1 ? 'scale-x-100 opacity-80' : 'scale-x-0 opacity-0'
          }`} />

          <div className={`absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/30 via-emerald-600/30 to-indigo-600/20 blur-3xl transition-all duration-1000 ${
            introPhase >= 1 ? 'scale-150 opacity-100' : 'scale-50 opacity-0'
          }`} />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6 px-4">
            <div className={`relative transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
              introPhase === 0 ? 'scale-0 opacity-0 blur-xl rotate-12' :
              introPhase === 1 ? 'scale-110 sm:scale-125 opacity-100 blur-0 rotate-0' :
              'scale-100 opacity-100'
            }`}>
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-4 border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.6)] flex items-center justify-center relative overflow-hidden group bg-slate-900">
                <img 
                  src={nationalEmblem} 
                  alt="National Emblem of India" 
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite] z-10" />
              </div>
              
              <span className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 text-white border-2 border-black flex items-center justify-center shadow-lg z-20">
                <ShieldCheck size={20} />
              </span>
            </div>

            <div className={`space-y-1.5 transition-all duration-1000 transform ${
              introPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <div className="h-0.5 w-8 bg-amber-400" />
                <span className="text-xs font-mono font-black uppercase tracking-[0.35em] text-amber-400 drop-shadow-sm">
                  Government of India
                </span>
                <div className="h-0.5 w-8 bg-amber-400" />
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                eSAKSHI SENTINEL
              </h1>

              <p className="text-xs sm:text-sm font-mono tracking-widest text-indigo-300 uppercase">
                Autonomous MPLADS Anomaly & Collusion Platform (All-India Scope)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowCinematicIntro(true);
            setIntroPhase(0);
          }}
          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
          title="Replay Opening Sequence"
        >
          <RotateCcw size={13} className="text-amber-400" />
          <span>Replay Intro</span>
        </button>

        <button
          type="button"
          onClick={() => setSoundMuted(!soundMuted)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer backdrop-blur-md"
          title={soundMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {soundMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
        </button>
      </div>

      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg)`
        }}
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar bg-[#faf6ef] text-slate-900 rounded-3xl border border-[#e2d9c8] shadow-[0_25px_70px_rgba(0,0,0,0.6)] relative z-10 transition-transform duration-200 ease-out backdrop-blur-sm"
      >
        <div className="h-1.5 flex w-full shadow-xs shrink-0">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>

        {currentStep === 'select_role' ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950 text-amber-400 text-xs font-mono font-bold shadow-xs border border-indigo-900">
                <Shield size={14} />
                <span>eSAKSHI Cryptographic Gateway</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Select Administrative Role
              </h1>
              <p className="text-xs text-slate-600 font-medium max-w-lg mx-auto">
                Official Ministry of Statistics & Programme Implementation portal for statutory MPLADS surveillance and governance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              <div 
                onClick={() => handleRoleCardClick('district')}
                className="group h-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-950 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-950 border border-amber-300">
                    District Level (IDA)
                  </span>
                </div>
                <div className="flex-1 mb-3">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-950 transition-colors">
                    District Authority (DM / Collector)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Statutory implementation authority, 45-day approval triage, Rule 4.2 anti-collusion radar, and forensic stop-payments across all nationwide constituencies.
                  </p>
                </div>
                <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span>Enter Collectorate Node</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => handleRoleCardClick('mp')}
                className="group h-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-950 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                    <Landmark size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-950 border border-indigo-200">
                    Parliamentary Seat
                  </span>
                </div>
                <div className="flex-1 mb-3">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-950 transition-colors">
                    Member of Parliament (MP)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Constituency fund allocation, AI Gemini audit assistant, official sanction drafting, and satellite boundary geofence for 542 Lok Sabha seats.
                  </p>
                </div>
                <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span>Enter MP Dashboard</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => handleRoleCardClick('state')}
                className="group h-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-950 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                    <Compass size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    State Level (SNA)
                  </span>
                </div>
                <div className="flex-1 mb-3">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-950 transition-colors">
                    State Nodal Authority
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Statewide risk heatmap, cross-district coordination, inter-agency audits, and treasury allocation flow for all 36 States and UTs.
                  </p>
                </div>
                <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span>Enter State Authority</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => handleRoleCardClick('ministry')}
                className="group h-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-950 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                    <Layers size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                    Union Level (Apex)
                  </span>
                </div>
                <div className="flex-1 mb-3">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-950 transition-colors">
                    National Ministry (MoSPI)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Macro surveillance, Benford's Law forensics, national quota fulfillment, and parliamentary policy compliance across India.
                  </p>
                </div>
                <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span>Enter National Sentinel</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep('select_role')}
                className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Choose Different Role</span>
              </button>

              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100/90 text-indigo-950 border border-indigo-200">
                {selectedRole === 'district' && "District Level (IDA)"}
                {selectedRole === 'mp' && "Parliamentary Level (MP)"}
                {selectedRole === 'state' && "State Level (SNA)"}
                {selectedRole === 'ministry' && "Union Level (Apex)"}
              </span>
            </div>

            {selectedRole === 'district' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      1. Filter by State / UT:
                    </label>
                    <select
                      value={districtStateFilter}
                      onChange={(e) => {
                        setDistrictStateFilter(e.target.value);
                        setSelectedAuthId('');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                    >
                      <option value="">All States ({allStates.length})</option>
                      {allStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      2. Search District / Officer:
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by district name or officer..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    3. Select District Authority Account ({filteredDistrictAuths.length} available):
                  </label>
                  <select
                    value={currentDistrictAuth?.id || ''}
                    onChange={(e) => setSelectedAuthId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-indigo-950/20 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-950"
                  >
                    {filteredDistrictAuths.map(auth => (
                      <option key={auth.id || auth.username} value={auth.id || auth.username}>
                        {auth.district} ({auth.state}) — {auth.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedRole === 'mp' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      1. Filter by State / UT:
                    </label>
                    <select
                      value={mpStateFilter}
                      onChange={(e) => {
                        setMpStateFilter(e.target.value);
                        setSelectedMpId('');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                    >
                      <option value="">All States ({allStates.length})</option>
                      {allStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      2. Search MP / Constituency:
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search MP name or constituency..."
                        value={mpSearch}
                        onChange={(e) => setMpSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    3. Select Member of Parliament ({filteredMps.length} MPs):
                  </label>
                  <select
                    value={currentMpAuth?.id || ''}
                    onChange={(e) => setSelectedMpId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-indigo-950/20 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-950"
                  >
                    {filteredMps.map(mp => (
                      <option key={mp.id} value={mp.id}>
                        {mp.name} — {mp.constituency} ({mp.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedRole === 'state' && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Select State Jurisdiction:
                </label>
                <select
                  value={selectedNodalState}
                  onChange={(e) => setSelectedNodalState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-indigo-950/20 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-950"
                >
                  <option value="All India">National Oversight (All India)</option>
                  {allStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
                  {selectedRole === 'district' ? (
                    <MapPin size={22} />
                  ) : (
                    <User size={22} />
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-950 block">
                    {selectedRole === 'district' ? "DISTRICT MAGISTRATE (DM)" : selectedRole === 'mp' ? "MEMBER OF PARLIAMENT (MP)" : selectedRole === 'state' ? "STATE NODAL AUTHORITY (SNA)" : "CENTRAL MINISTRY OVERSIGHT"}
                  </span>
                  <h3 className="text-base font-black text-slate-950">
                    {selectedRole === 'district' ? currentDistrictAuth.name : selectedRole === 'mp' ? currentMpAuth.name : selectedRole === 'state' ? `Principal Secretary (${selectedNodalState})` : "Secretary, MoSPI"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedRole === 'district' 
                      ? currentDistrictAuth.office || `Office of the District Collector, ${currentDistrictAuth.district}, ${currentDistrictAuth.state}`
                      : selectedRole === 'mp' 
                      ? `${currentMpAuth.constituency || currentMpAuth.district} Constituency, ${currentMpAuth.state}`
                      : selectedRole === 'state' 
                      ? `Department of Planning & Development, Government of ${selectedNodalState}`
                      : "Ministry of Statistics & Programme Implementation, New Delhi"}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Clearance Ready</span>
              </span>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Designated Authority Username
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      value={
                        selectedRole === 'district' 
                          ? currentDistrictAuth.username 
                          : selectedRole === 'mp' 
                          ? `mp_${currentMpAuth.id.toLowerCase()}` 
                          : selectedRole === 'state'
                          ? `nodal_${selectedNodalState.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}`
                          : "mospi_sec"
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      readOnly
                      value="••••••••••••"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-950 hover:bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 border border-indigo-900 mt-2"
              >
                <Lock size={16} className="text-amber-400" />
                <span>
                  Authorize & Log In as {selectedRole === 'district' ? `District Magistrate (${currentDistrictAuth.district})` : selectedRole === 'mp' ? `Member of Parliament (${currentMpAuth.constituency || currentMpAuth.district})` : selectedRole === 'state' ? `State Nodal Officer (${selectedNodalState})` : "MoSPI Administrator"}
                </span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}