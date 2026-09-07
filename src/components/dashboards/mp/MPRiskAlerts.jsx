import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Camera, Landmark, TrendingUp, Clock } from 'lucide-react';
import { RiskBadge, EmptyState, riskLevelFromScore } from '../../ui';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import MPSectionHeader from './MPSectionHeader';
import {
  riskDistribution, normalizeRiskDrivers, hasPaymentStageSignal, hasEvidenceGap,
  costDeviationRatio, PAYMENT_STAGE_SIGNAL_THRESHOLD_PCT,
} from './mpDerive';

const SIGNAL_DEFS = {
  costDeviation: { label: 'Cost deviation vs peer median', icon: TrendingUp },
  paymentStage: { label: 'Payment vs execution-stage signal', icon: Clock },
  evidenceGap: { label: 'Completion without photographic evidence', icon: Camera },
  agencyConcentration: { label: 'Implementing agency concentration', icon: Landmark },
};

function signalsForWork(w) {
  const signals = [];
  const ratio = costDeviationRatio(w);
  if (ratio != null && ratio >= 1.5) signals.push('costDeviation');
  if (hasPaymentStageSignal(w)) signals.push('paymentStage');
  if (hasEvidenceGap(w)) signals.push('evidenceGap');
  if (w.agencyShareInDistrict && parseFloat(w.agencyShareInDistrict) >= 90) signals.push('agencyConcentration');
  return signals;
}

export default function MPRiskAlerts({ mpWorks, onSelectWork, presetFilter, presetNonce }) {
  const { t } = useTranslation();
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [signalFilter, setSignalFilter] = useState('ALL');

  useEffect(() => {
    if (!presetFilter) return;
    if (presetFilter.risk) setRiskFilter(presetFilter.risk);
    if (presetFilter.signal) setSignalFilter(presetFilter.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetNonce]);

  const dist = useMemo(() => riskDistribution(mpWorks), [mpWorks]);

  const alerts = useMemo(() => {
    return mpWorks
      .filter((w) => w.isNegative || (w.riskScore || 0) > 0)
      .map((w) => ({ work: w, signals: signalsForWork(w), level: riskLevelFromScore(w.riskScore) }))
      .filter((a) => riskFilter === 'ALL' || a.level === riskFilter)
      .filter((a) => signalFilter === 'ALL' || a.signals.includes(signalFilter))
      .sort((a, b) => (b.work.riskScore || 0) - (a.work.riskScore || 0));
  }, [mpWorks, riskFilter, signalFilter]);

  const chipCls = (active) => `px-3.5 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${
    active ? 'bg-indigo-950 text-amber-400 border-indigo-950' : 'bg-white text-slate-700 border-slate-200'
  }`;

  return (
    <div className="space-y-4">
      <MPSectionHeader
        title={t('mp.risk.title')}
        subtitle={`${alerts.length} works currently carry a risk or monitoring signal in this constituency.`}
      />

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">{t('mp.risk.distribution')}</h4>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chipCls(riskFilter === 'ALL')} onClick={() => setRiskFilter('ALL')}>
            {t('filters.all')} ({mpWorks.length})
          </button>
          {['high', 'medium', 'low', 'nominal'].map((level) => (
            <button key={level} type="button" className={chipCls(riskFilter === level)} onClick={() => setRiskFilter(level)}>
              <RiskBadge level={level} size="sm" /> <span className="ml-1 font-mono">({dist[level]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={chipCls(signalFilter === 'ALL')} onClick={() => setSignalFilter('ALL')}>
          All Signal Types
        </button>
        {Object.entries(SIGNAL_DEFS).map(([key, def]) => (
          <button key={key} type="button" className={chipCls(signalFilter === key)} onClick={() => setSignalFilter(key)}>
            {def.label}
          </button>
        ))}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8">
          <EmptyState message={t('mp.risk.noAlerts')} icon={ShieldAlert} />
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(({ work, signals, level }) => {
            const drivers = normalizeRiskDrivers(work.shapDrivers);
            return (
              <div key={work.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-950">{work.id}</span>
                      <RiskBadge score={work.riskScore} level={level} size="sm" />
                    </div>
                    <button type="button" onClick={() => onSelectWork(work.id)} className="text-base font-semibold text-slate-900 hover:text-indigo-800 hover:underline text-left cursor-pointer mt-0.5">
                      {work.title}
                    </button>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{work.district} · {formatINR(work.sanctionedAmount)} sanctioned</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectWork(work.id)}
                    className="px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-950 text-sm font-semibold cursor-pointer hover:bg-indigo-950 hover:text-white transition-colors shrink-0"
                  >
                    {t('buttons.view')} &rarr;
                  </button>
                </div>

                <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t('mp.risk.explainWhy')}</div>
                <ul className="space-y-1.5">
                  {(work.anomalyReasons || []).map((reason, i) => (
                    <li key={i} className="text-sm text-slate-700 font-medium flex items-start gap-1.5 leading-relaxed">
                      <span className="text-slate-400 font-mono">{i + 1}.</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Reason text is sourced verbatim from the eSAKSHI-derived record; any "statutory SLA" reference reflects the source dataset's own labeling, not an independently verified statutory deadline.
                </p>

                {signals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {signals.map((s) => {
                      const Def = SIGNAL_DEFS[s];
                      const Icon = Def.icon;
                      return (
                        <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                          <Icon size={13} /> {Def.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {drivers.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">
                      {t('mp.risk.contribution')}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {drivers.map((d, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-500 truncate">{d.factor}</div>
                          <div className="text-base font-mono font-bold text-slate-900">{d.pct}%</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('mp.risk.contributionNote')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pt-2 leading-relaxed">
        Signal threshold reference: payment-vs-stage signal triggers at &ge; {PAYMENT_STAGE_SIGNAL_THRESHOLD_PCT}% payment share before the Physical Inspection stage. All signals are platform-derived monitoring indicators, not findings of fraud.
      </p>
    </div>
  );
}
