import React from 'react';

export default function LoadingSkeleton({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded-md bg-slate-100" style={{ width: `${85 - (i % 3) * 12}%` }} />
      ))}
    </div>
  );
}
