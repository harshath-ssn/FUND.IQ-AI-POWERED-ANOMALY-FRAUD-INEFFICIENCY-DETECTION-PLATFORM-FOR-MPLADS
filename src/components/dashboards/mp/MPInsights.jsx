import React, { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import { RiskBadge, EmptyState } from '../../ui';
import MPSectionHeader from './MPSectionHeader';
import {
  riskDistribution, stageDistribution, breakdownBy, hasEvidenceGap, hasPaymentStageSignal,
} from './mpDerive';

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      {children}
    </div>
  );
}

function Bar({ label, count, total, tone = 'bg-indigo-900' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-semibold text-slate-700 truncate max-w-[65%]">{label}</span>
        <span className="font-mono font-bold text-slate-900">{count} ({pct}%)</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${label}: ${count} of ${total}, ${pct} percent`}>
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MPInsights({ mpWorks, onSelectWork }) {
  const { t } = useTranslation();
  const total = mpWorks.length;

  const riskDist = useMemo(() => riskDistribution(mpWorks), [mpWorks]);
  const stageDist = useMemo(() => stageDistribution(mpWorks), [mpWorks]);
  const byCategory = useMemo(() => breakdownBy(mpWorks, (w) => w.category).slice(0, 6), [mpWorks]);
  const byAgency = useMemo(() => breakdownBy(mpWorks, (w) => w.implementingAgency).slice(0, 6), [mpWorks]);
  const byVendor = useMemo(() => breakdownBy(mpWorks, (w) => w.vendorName).slice(0, 6), [mpWorks]);

  const evidenceGapWorks = useMemo(() => mpWorks.filter(hasEvidenceGap), [mpWorks]);
  const paymentStageWorks = useMemo(() => mpWorks.filter(hasPaymentStageSignal), [mpWorks]);

  if (total === 0) {
    return (
      <div className="space-y-4">
        <MPSectionHeader title={t('mp.insights.title')} />
        <EmptyState message={t('empty.noWorks')} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MPSectionHeader title={t('mp.insights.title')} subtitle={`Derived from ${total} works on file for this constituency.`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={t('mp.insights.riskDistribution')}>
          {['high', 'medium', 'low', 'nominal'].map((level) => (
            <div key={level} className="flex items-center gap-3">
              <RiskBadge level={level} size="sm" className="shrink-0 w-32 justify-center" />
              <div className="flex-1">
                <Bar label="" count={riskDist[level]} total={total} tone={level === 'high' ? 'bg-red-600' : level === 'medium' ? 'bg-amber-500' : level === 'low' ? 'bg-blue-600' : 'bg-slate-400'} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel title={t('mp.insights.stageDistribution')}>
          {stageDist.map((s) => (
            <Bar key={s.key} label={t(s.key)} count={s.count} total={total} />
          ))}
        </Panel>

        <Panel title={t('mp.insights.categoryConcentration')}>
          {byCategory.map((c) => <Bar key={c.key} label={c.key} count={c.count} total={total} />)}
        </Panel>

        <Panel title={t('mp.insights.agencyConcentration')}>
          {byAgency.length === 0 ? <p className="text-sm text-slate-400">{t('mp.works.notAvailable')}</p> : byAgency.map((a) => <Bar key={a.key} label={a.key} count={a.count} total={total} />)}
        </Panel>

        <Panel title={t('mp.insights.vendorConcentration')}>
          {byVendor.length === 0 ? <p className="text-sm text-slate-400">{t('mp.works.notAvailable')}</p> : byVendor.map((v) => <Bar key={v.key} label={v.key} count={v.count} total={total} />)}
        </Panel>

        <Panel title={t('mp.insights.evidenceGaps')}>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {evidenceGapWorks.length} of {mpWorks.filter((w) => w.workStage === 'Work Completed').length} completed works have no photo evidence on file.
          </p>
          <div className="space-y-1.5">
            {evidenceGapWorks.slice(0, 5).map((w) => (
              <button key={w.id} type="button" onClick={() => onSelectWork(w.id)} className="w-full text-left text-sm font-semibold text-indigo-800 hover:underline cursor-pointer">
                {w.id} — {w.title}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={t('mp.insights.paymentStageSignals')}>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {paymentStageWorks.length} works show payment released ahead of their recorded execution stage.
          </p>
          <div className="space-y-1.5">
            {paymentStageWorks.slice(0, 5).map((w) => (
              <button key={w.id} type="button" onClick={() => onSelectWork(w.id)} className="w-full text-left text-sm font-semibold text-indigo-800 hover:underline cursor-pointer">
                {w.id} — {w.title} ({formatINR(w.paymentReleased)} released, stage: {w.workStage})
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
