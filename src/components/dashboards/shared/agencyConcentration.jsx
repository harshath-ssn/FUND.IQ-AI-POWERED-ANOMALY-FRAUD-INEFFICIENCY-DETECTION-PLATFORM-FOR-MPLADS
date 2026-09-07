import React from 'react';
import { EmptyState } from '../../ui';
import { formatINR } from '../../../utils/format';

// Shared vendor/agency concentration calculation, used by District (C4),
// State (D5) and Ministry (E9) so the three roles never compute this
// signal slightly differently. Built only from real vendor/agency/payment
// fields already on each work record -- no fabricated IDs, no "syndicate"
// framing, just a concentration statistic that may warrant review.
export function buildConcentration(works, keyFn) {
  const groups = new Map();
  let totalSanctioned = 0;

  works.forEach((w) => {
    const key = keyFn(w);
    if (!key) return;
    const sanctioned = Number(w.sanctionedAmount) || 0;
    totalSanctioned += sanctioned;
    if (!groups.has(key)) groups.set(key, { name: key, works: 0, sanctioned: 0, flagged: 0 });
    const g = groups.get(key);
    g.works += 1;
    g.sanctioned += sanctioned;
    if (w.isNegative || w.riskScore >= 70) g.flagged += 1;
  });

  return Array.from(groups.values())
    .map((g) => ({ ...g, sharePct: totalSanctioned > 0 ? (g.sanctioned / totalSanctioned) * 100 : 0 }))
    .sort((a, b) => b.sharePct - a.sharePct);
}

// A share % is only an informative concentration signal when more than one
// entity actually competed for the outlay in scope. A single agency
// (common where one authority is the sole IDA channel) will always show
// 100% -- that's a structural fact, not a review-worthy signal.
export function concentrationLevel(sharePct, totalEntities) {
  if (totalEntities <= 1) return 'single';
  if (sharePct >= 40) return 'high';
  if (sharePct >= 20) return 'moderate';
  return 'distributed';
}

// i18nKeys: { high, moderate, distributed, single } -- full translation
// keys (e.g. 'district.agencyIntel.highConcentration'), since the same
// panel is reused under different namespaces per role.
export function ConcentrationPanel({ title, rows, emptyMessage, icon: Icon, t, i18nKeys, labels }) {
  const levelCls = {
    high: 'bg-red-50 text-red-700 border-red-200',
    moderate: 'bg-amber-50 text-amber-800 border-amber-200',
    distributed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    single: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        {Icon && <Icon size={18} className="text-indigo-800" />}
        {title}
      </h3>
      {rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {rows.slice(0, 12).map((row) => {
            const level = concentrationLevel(row.sharePct, rows.length);
            return (
              <div key={row.name} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 line-clamp-1">{row.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${levelCls[level]}`}>
                    {t(i18nKeys[level])}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <span>{labels.works}: <strong className="text-slate-900">{row.works}</strong></span>
                  <span>{labels.sanctioned}: <strong className="text-slate-900">{formatINR(row.sanctioned)}</strong></span>
                  <span>{labels.share}: <strong className="text-slate-900">{row.sharePct.toFixed(1)}%</strong></span>
                </div>
                {row.flagged > 0 && (
                  <p className="text-xs text-red-700 font-semibold">{row.flagged} {t('risk.requiresReview')}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
