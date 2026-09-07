import React, { useState } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text, children, icon = true }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      {children || (icon && <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />)}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-64 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-lg leading-snug">
          {text}
        </span>
      )}
    </span>
  );
}
