import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Landmark, ShieldCheck, User, Key, Lock, ArrowRight, ArrowLeft,
  MapPin, Building2, CheckCircle2, ChevronRight, Shield, Layers, Compass,
  RotateCcw, Volume2, VolumeX, Search
} from 'lucide-react';

import { MP_PROFILES } from '../data/mpMaster';
import { AUTH_USERS } from '../data/authUsers';
import { isSoundMuted, setSoundMuted, playCue } from '../utils/sound';

import parliamentBg from '../assets/parliament.png';
import nationalEmblem from '../assets/Government-Jobs-In-India-for-2013.jpg';

// Role definitions -- role identity ONLY. No fabricated officer names,
// clearance levels, or invented designations belong on this screen; those
// come from the real AUTH_USERS / MP_PROFILES records once a specific
// account is chosen further down the flow.
const ROLES = [
  {
    id: 'district',
    icon: Building2,
    label: 'District Authority',
    tag: 'District Level (IDA)',
    tagClass: 'bg-amber-100 text-amber-950 border-amber-300',
    desc: 'Statutory implementation authority: work sanction review, verification triage, and district-level monitoring.',
  },
  {
    id: 'mp',
    icon: Landmark,
    label: 'Member of Parliament',
    tag: 'Parliamentary Seat',
    tagClass: 'bg-indigo-100 text-indigo-950 border-indigo-200',
    desc: 'Constituency fund allocation, project tracking, and an AI audit assistant for your parliamentary seat.',
  },
  {
    id: 'state',
    icon: Compass,
    label: 'State Authority',
    tag: 'State Level (SNA)',
    tagClass: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Statewide risk overview, cross-district coordination, and treasury allocation flow.',
  },
  {
    id: 'ministry',
    icon: Layers,
    label: 'Ministry / MoSPI',
    tag: 'Union Level',
    tagClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    desc: 'National monitoring, quota fulfillment tracking, and policy compliance across India.',
  },
];

function prefersReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}

export default function LoginPage({ onLogin }) {
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const [showCinematicIntro, setShowCinematicIntro] = useState(!reducedMotion);
  const [introPhase, setIntroPhase] = useState(0);
  const [muted, setMuted] = useState(() => isSoundMuted());

  // Wizard steps: 'role' -> 'state' -> 'entity' -> 'confirm'
  // ('entity' is skipped for ministry, since that role has no further scope)
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState(null);

  const [stateSearch, setStateSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const [entitySearch, setEntitySearch] = useState('');
  const [selectedAuthId, setSelectedAuthId] = useState('');
  const [selectedMpId, setSelectedMpId] = useState('');

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const allStates = useMemo(() => {
    const states = new Set();
    if (AUTH_USERS) AUTH_USERS.forEach((u) => u.state && states.add(u.state.trim()));
    if (MP_PROFILES) MP_PROFILES.forEach((m) => m.state && states.add(m.state.trim()));
    return Array.from(states).sort();
  }, []);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return allStates;
    const q = stateSearch.trim().toLowerCase();
    return allStates.filter((s) => s.toLowerCase().includes(q));
  }, [allStates, stateSearch]);

  const districtAuthsInState = useMemo(() => {
    if (!AUTH_USERS || !selectedState) return [];
    return AUTH_USERS.filter((u) => u.state?.toLowerCase() === selectedState.toLowerCase());
  }, [selectedState]);

  const mpsInState = useMemo(() => {
    if (!MP_PROFILES || !selectedState) return [];
    return MP_PROFILES.filter((m) => m.state?.toLowerCase() === selectedState.toLowerCase());
  }, [selectedState]);

  const filteredDistrictAuths = useMemo(() => {
    if (!entitySearch.trim()) return districtAuthsInState;
    const q = entitySearch.trim().toLowerCase();
    return districtAuthsInState.filter((u) => u.district?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q));
  }, [districtAuthsInState, entitySearch]);

  const filteredMps = useMemo(() => {
    if (!entitySearch.trim()) return mpsInState;
    const q = entitySearch.trim().toLowerCase();
    return mpsInState.filter((m) => m.constituency?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q));
  }, [mpsInState, entitySearch]);

  const currentDistrictAuth = useMemo(
    () => AUTH_USERS?.find((u) => u.id === selectedAuthId) || filteredDistrictAuths[0] || null,
    [selectedAuthId, filteredDistrictAuths]
  );
  const currentMpAuth = useMemo(
    () => MP_PROFILES?.find((m) => m.id === selectedMpId) || filteredMps[0] || null,
    [selectedMpId, filteredMps]
  );

  const playCinematicImpact = () => {
    if (isSoundMuted()) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const t0 = ctx.currentTime;

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

      const bufferSize = ctx.sampleRate * 1.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
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

      [130.81, 196.0, 261.63].forEach((freq) => {
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
      console.warn('Audio error:', err);
    }
  };

  useEffect(() => {
    if (!showCinematicIntro) return;
    const t0 = setTimeout(() => { setIntroPhase(1); playCinematicImpact(); }, 400);
    const t1 = setTimeout(() => setIntroPhase(2), 1400);
    const t2 = setTimeout(() => setIntroPhase(3), 2800);
    const t3 = setTimeout(() => setShowCinematicIntro(false), 3400);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [showCinematicIntro]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
  };
  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setSelectedState('');
    setSelectedAuthId('');
    setSelectedMpId('');
    setStateSearch('');
    setEntitySearch('');
    if (roleId === 'ministry') {
      setStep('confirm');
    } else {
      setStep('state');
    }
  };

  const handleSelectState = (st) => {
    setSelectedState(st);
    setEntitySearch('');
    if (selectedRole === 'state') {
      setStep('confirm');
    } else {
      setStep('entity');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep(selectedRole === 'ministry' ? 'role' : selectedRole === 'state' ? 'state' : 'entity');
    } else if (step === 'entity') {
      setStep('state');
    } else if (step === 'state') {
      setStep('role');
      setSelectedRole(null);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    playCue('loginSuccess');

    if (selectedRole === 'district' && currentDistrictAuth) {
      onLogin({ ...currentDistrictAuth, role: 'district' });
    } else if (selectedRole === 'mp' && currentMpAuth) {
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
        office: `Constituency Office, ${currentMpAuth.constituency || currentMpAuth.district}, ${currentMpAuth.state}`,
      });
    } else if (selectedRole === 'state') {
      const stateJurisdiction = selectedState || 'All India';
      onLogin({
        id: `STATE_${stateJurisdiction.toUpperCase().slice(0, 3)}`,
        username: `state_${stateJurisdiction.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}`,
        name: `State Nodal Authority, ${stateJurisdiction}`,
        role: 'state',
        state: stateJurisdiction,
        district: 'ALL',
        title: 'State Nodal Officer (SNA)',
        office: `Planning & Development Department, Government of ${stateJurisdiction}`,
      });
    } else {
      onLogin({
        id: 'MIN001',
        username: 'mospi_admin',
        name: 'Ministry Administrator, MoSPI',
        role: 'ministry',
        state: 'ALL',
        district: 'ALL',
        title: 'Central MoSPI Administrator',
        office: 'Ministry of Statistics & Programme Implementation, New Delhi',
      });
    }
  };

  const roleMeta = ROLES.find((r) => r.id === selectedRole);

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-y-auto select-none text-slate-100 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 11, 20, 0.85), rgba(9, 11, 20, 0.95)), url(${parliamentBg})` }}
    >
      {showCinematicIntro && (
        <div className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${introPhase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute top-0 left-0 right-0 h-14 sm:h-20 bg-black border-b border-white/5 z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 bg-black border-t border-white/5 z-20 flex items-center justify-between px-8">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">FUND·IQ • MoSPI eSAKSHI Data Sync</span>
            <button type="button" onClick={() => setShowCinematicIntro(false)} className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-amber-400 border border-white/10 transition cursor-pointer">
              Skip Intro &rarr;
            </button>
          </div>
          <div className={`absolute w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-all duration-1000 ${introPhase >= 1 ? 'scale-x-100 opacity-80' : 'scale-x-0 opacity-0'}`} />
          <div className={`absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/30 via-emerald-600/30 to-indigo-600/20 blur-3xl transition-all duration-1000 ${introPhase >= 1 ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`} />
          <div className="relative z-10 flex flex-col items-center text-center space-y-6 px-4">
            <div className={`relative transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${introPhase === 0 ? 'scale-0 opacity-0 blur-xl rotate-12' : introPhase === 1 ? 'scale-110 sm:scale-125 opacity-100 blur-0 rotate-0' : 'scale-100 opacity-100'}`}>
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-4 border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.6)] flex items-center justify-center relative overflow-hidden group bg-slate-900">
                <img src={nationalEmblem} alt="National Emblem of India" className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite] z-10" />
              </div>
              <span className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 text-white border-2 border-black flex items-center justify-center shadow-lg z-20">
                <ShieldCheck size={20} />
              </span>
            </div>
            <div className={`space-y-1.5 transition-all duration-1000 transform ${introPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="flex items-center justify-center gap-3">
                <div className="h-0.5 w-8 bg-amber-400" />
                <span className="text-xs font-mono font-black uppercase tracking-[0.35em] text-amber-400 drop-shadow-sm">Government of India</span>
                <div className="h-0.5 w-8 bg-amber-400" />
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                FUND·IQ
              </h1>
              <p className="text-xs sm:text-sm font-mono tracking-widest text-indigo-300 uppercase max-w-xl mx-auto">
                AI-Powered Anomaly, Fraud &amp; Inefficiency Detection Platform for MPLADS
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
          onClick={() => { setShowCinematicIntro(true); setIntroPhase(0); }}
          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
          title="Replay Opening Sequence"
        >
          <RotateCcw size={13} className="text-amber-400" />
          <span>Replay Intro</span>
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer backdrop-blur-md"
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
        </button>
      </div>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: `perspective(1000px) rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg)` }}
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar bg-[#faf6ef] text-slate-900 rounded-3xl border border-[#e2d9c8] shadow-[0_25px_70px_rgba(0,0,0,0.6)] relative z-10 transition-transform duration-200 ease-out backdrop-blur-sm"
      >
        <div className="h-1.5 flex w-full shadow-xs shrink-0">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950 text-amber-400 text-xs font-mono font-bold shadow-xs border border-indigo-900">
              <Shield size={14} />
              <span>eSAKSHI Cryptographic Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {step === 'role' && 'Select Administrative Role'}
              {step === 'state' && `Select State / UT — ${roleMeta?.label}`}
              {step === 'entity' && (selectedRole === 'mp' ? `Select Constituency — ${selectedState}` : `Select District — ${selectedState}`)}
              {step === 'confirm' && 'Confirm & Sign In'}
            </h1>
          </div>

          {/* Step indicator */}
          {selectedRole && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-slate-400">
              {['role', selectedRole === 'ministry' ? null : 'state', selectedRole === 'ministry' || selectedRole === 'state' ? null : 'entity', 'confirm']
                .filter(Boolean)
                .map((s, idx, arr) => (
                  <React.Fragment key={s}>
                    <span className={step === s ? 'text-indigo-950' : arr.indexOf(step) > idx ? 'text-emerald-600' : ''}>{idx + 1}</span>
                    {idx < arr.length - 1 && <ChevronRight size={10} />}
                  </React.Fragment>
                ))}
            </div>
          )}

          {/* STEP: Role selection */}
          {step === 'role' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className="group h-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-950 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                        <Icon size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${role.tagClass}`}>{role.tag}</span>
                    </div>
                    <div className="flex-1 mb-4">
                      <h3 className="text-xl font-black text-slate-950 group-hover:text-indigo-950 transition-colors">{role.label}</h3>
                    </div>
                    <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-sm font-bold text-indigo-950">
                      <span>Continue</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP: State/UT selection */}
          {step === 'state' && (
            <div className="space-y-4">
              <button type="button" onClick={handleBack} className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold text-xs cursor-pointer transition-colors">
                <ArrowLeft size={16} />
                <span>Choose Different Role</span>
              </button>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search State / UT..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                />
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                {filteredStates.length === 0 && (
                  <div className="p-4 text-xs text-slate-400 text-center">No matching State / UT.</div>
                )}
                {filteredStates.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSelectState(st)}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{st}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: District / Constituency selection */}
          {step === 'entity' && (
            <div className="space-y-4">
              <button type="button" onClick={handleBack} className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold text-xs cursor-pointer transition-colors">
                <ArrowLeft size={16} />
                <span>Back to State / UT</span>
              </button>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder={selectedRole === 'mp' ? 'Search constituency or MP name...' : 'Search district or officer...'}
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                />
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                {selectedRole === 'district' && filteredDistrictAuths.map((auth) => (
                  <button
                    key={auth.id}
                    type="button"
                    onClick={() => { setSelectedAuthId(auth.id); setStep('confirm'); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800">{auth.district}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                ))}
                {selectedRole === 'mp' && filteredMps.map((mp) => (
                  <button
                    key={mp.id}
                    type="button"
                    onClick={() => { setSelectedMpId(mp.id); setStep('confirm'); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800">{mp.constituency || mp.district}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                ))}
                {((selectedRole === 'district' && filteredDistrictAuths.length === 0) || (selectedRole === 'mp' && filteredMps.length === 0)) && (
                  <div className="p-4 text-xs text-slate-400 text-center">No matching records in this state.</div>
                )}
              </div>
            </div>
          )}

          {/* STEP: Confirm & sign in */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <button type="button" onClick={handleBack} className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold text-xs cursor-pointer transition-colors">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
                    {selectedRole === 'district' ? <MapPin size={22} /> : <User size={22} />}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-950 block">{roleMeta?.label}</span>
                    <h3 className="text-base font-black text-slate-950">
                      {selectedRole === 'district' && (currentDistrictAuth?.name || 'District Authority')}
                      {selectedRole === 'mp' && (currentMpAuth?.name || 'Member of Parliament')}
                      {selectedRole === 'state' && `State Nodal Authority (${selectedState})`}
                      {selectedRole === 'ministry' && 'Ministry Administrator, MoSPI'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedRole === 'district' && (currentDistrictAuth?.office || `Office of the District Collector, ${currentDistrictAuth?.district}, ${selectedState}`)}
                      {selectedRole === 'mp' && `${currentMpAuth?.constituency || currentMpAuth?.district} Constituency, ${selectedState}`}
                      {selectedRole === 'state' && `Department of Planning & Development, Government of ${selectedState}`}
                      {selectedRole === 'ministry' && 'Ministry of Statistics & Programme Implementation, New Delhi'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Ready to Sign In</span>
                </span>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Designated Authority Username</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        readOnly
                        value={
                          selectedRole === 'district' ? (currentDistrictAuth?.username || '') :
                          selectedRole === 'mp' ? `mp_${(currentMpAuth?.id || '').toLowerCase()}` :
                          selectedRole === 'state' ? `nodal_${selectedState.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}` :
                          'mospi_admin'
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Security Passcode</label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input type="password" readOnly value="••••••••••••" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none tracking-widest" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-indigo-950 hover:bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 border border-indigo-900 mt-2"
                >
                  <Lock size={16} className="text-amber-400" />
                  <span>Authorize &amp; Log In</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
