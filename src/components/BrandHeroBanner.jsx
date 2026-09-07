import React from 'react';
import backgroundBanner from '../assets/notextbackground.png';

// Fixed masthead for every workspace: the text-free backdrop image plus a
// real (not baked into the image) "FUND·IQ" heading, so the wording can be
// styled/updated independently of the artwork. `fixed` anchors it to the
// viewport itself (not to any particular scroll container), so it cannot
// drift, lag, or "drag" as the page scrolls -- it simply never moves.
// App.jsx gives `<main>` matching top padding so page content starts below
// it instead of underneath it.
export default function BrandHeroBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 w-full overflow-hidden z-40 shadow-md" style={{ height: '128px' }}>
      <img
        src={backgroundBanner}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover object-top select-none pointer-events-none"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
          FUND&middot;IQ
        </h1>
        <p className="hidden sm:block text-[11px] sm:text-xs font-mono uppercase tracking-widest text-slate-100/90 mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          AI-Powered Anomaly, Fraud &amp; Inefficiency Detection Platform for MPLADS
        </p>
      </div>
    </div>
  );
}
