import React from 'react';
import { AlertTriangle, ShieldAlert, Eye, Info } from 'lucide-react';
import { useTranslation } from '../../i18n';

// Never renders "Fraud Confirmed" / "Verified Clean" / "Safe" -- Part 2
// Rule 4. Only the vocabulary below: Anomaly Detected, Risk Signal,
// Potential Fraud Indicator, Requires Review, High/Medium/Low Risk,
// Monitoring Signal, Nominal.
const LEVELS = {
  high: { key: 'risk.high', icon: ShieldAlert, className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { key: 'risk.medium', icon: AlertTriangle, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  low: { key: 'risk.low', icon: Eye, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  nominal: { key: 'risk.nominal', icon: Info, className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export function riskLevelFromScore(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return 'nominal';
  if (n >= 70) return 'high';
  if (n >= 40) return 'medium';
  if (n > 0) return 'low';
  return 'nominal';
}

export default function RiskBadge({ score, level, label, size = 'md', className = '' }) {
  const { t } = useTranslation();
  const resolvedLevel = level || riskLevelFromScore(score);
  const config = LEVELS[resolvedLevel] || LEVELS.nominal;
  const Icon = config.icon;
  const sizeCls = size === 'sm' ? 'text-xs px-2.5 py-1 gap-1' : 'text-sm px-3 py-1.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${sizeCls} ${config.className} ${className}`}
      title={typeof score === 'number' ? `Risk score: ${score}/100` : undefined}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{label || t(config.key)}{typeof score === 'number' ? ` (${score})` : ''}</span>
    </span>
  );
}
