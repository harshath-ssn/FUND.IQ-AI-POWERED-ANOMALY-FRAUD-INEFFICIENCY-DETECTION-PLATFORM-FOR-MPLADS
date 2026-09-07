import React, { useMemo, useState } from 'react';
import { Activity, ShieldAlert, Info, ArrowUpRight, MapPin, Clock } from 'lucide-react';
import { KpiCard, RiskBadge, MethodologyDrawer, EmptyState, StageTracker } from '../../ui';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import FundMap from '../../map/FundMap';
import MPSectionHeader from './MPSectionHeader';
import MPFundPositionCard from './MPFundPositionCard';
import {
  computeFinancials, stageDistribution, riskDistribution, topAttentionItems,
  scStComplianceStatus, hasPaymentStageSignal, hasEvidenceGap,
} from './mpDerive';

export default function MPOverview({ currentMp, mpWorks, onSelectWork, onNavigate }) {
  const { t } = useTranslation();
  const [scstMethodologyOpen, setScstMethodologyOpen] = useState(false);

  const financials = useMemo(() => computeFinancials(currentMp, mpWorks), [currentMp, mpWorks]);
  const stageDist = useMemo(() => stageDistribution(mpWorks), [mpWorks]);
  const riskDist = useMemo(() => riskDistribution(mpWorks), [mpWorks]);
  const attention = useMemo(() => topAttentionItems(mpWorks, 5), [mpWorks]);

  const highRiskCount = riskDist.high;
  const monitoredCount = mpWorks.filter((w) => w.isNegative || (w.riskScore || 0) > 0).length;
  const completedCount = mpWorks.filter((w) => w.workStage === 'Work Completed').length;
  const paymentStageSignals = mpWorks.filter(hasPaymentStageSignal).length;
  const evidenceGapCount = mpWorks.filter(hasEvidenceGap).length;

  const scstStatus = scStComplianceStatus(currentMp);
  const scPct = currentMp?.scAllocationPct;
  const stPct = currentMp?.stAllocationPct;

  const recentWorks = useMemo(
    () => [...mpWorks].sort((a, b) => (b.daysToSanction || 0) - (a.daysToSanction || 0)).slice(0, 6),
    [mpWorks]
  );

  return (
    <div className="space-y-6">
      <MPSectionHeader
        title={t('mp.sidebar.overview')}
        subtitle={`${currentMp?.constituency || currentMp?.district || ''} — ${mpWorks.length} works on file for this constituency.`}
      />

      {/* FOUR PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MPFundPositionCard financials={financials} compact onOpen={() => onNavigate('fund')} />

        <KpiCard
          label={t('mp.kpi.workPortfolio')}
          value={mpWorks.length}
          icon={Activity}
          onClick={() => onNavigate('works')}
          className="cursor-pointer hover:border-indigo-300 transition-colors"
          subtext={
            <span>
              <span className="text-emerald-700 font-bold">{completedCount} {t('status.workCompleted')}</span>
              {' · '}
              <span className="text-slate-500">{mpWorks.length - completedCount} {t('kpi.inProgress')}</span>
            </span>
          }
        />

        <div
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 cursor-pointer hover:border-red-300 transition-colors"
          onClick={() => onNavigate('risk', { risk: 'high' })}
          role="button"
          tabIndex={0}
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500 flex items-center justify-between">
            <span>{t('mp.kpi.riskMonitor')}</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950">
            {monitoredCount}
            <span className="text-sm font-semibold text-slate-400 ml-1.5 align-middle">{t('mp.kpi.monitoredWorks')}</span>
          </div>
          <div className="text-sm font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span className={highRiskCount > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'}>
              {highRiskCount} {t('mp.kpi.highRiskSignals')}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <div
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 cursor-pointer hover:border-indigo-300 transition-colors"
          onClick={() => onNavigate('compliance')}
          role="button"
          tabIndex={0}
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500 flex items-center justify-between">
            <span>{t('mp.kpi.scStMonitor')}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setScstMethodologyOpen(true); }}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              title={t('mp.kpi.viewMethodology')}
            >
              <Info className="w-4 h-4" />
            </button>
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-950">
            {scstStatus === 'unavailable' ? t('mp.kpi.notAvailable') : `${scPct}% SC / ${stPct}% ST`}
          </div>
          <div className="text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 inline-block w-fit">
            {t('mp.kpi.proxyIndicator')}
          </div>
        </div>
      </div>

      {/* MY ATTENTION REQUIRED */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('mp.attention.title')}</h3>
            <p className="text-sm text-slate-500 font-medium">{t('mp.attention.subtitle')}</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 w-fit">
            {t('mp.attention.formula')}
          </span>
        </div>

        {attention.length === 0 || attention.every((a) => a.priority === 0) ? (
          <EmptyState message={t('mp.attention.empty')} />
        ) : (
          <div className="space-y-2.5">
            {attention.map(({ work, riskNorm, reasons }) => (
              <button
                key={work.id}
                type="button"
                onClick={() => onSelectWork(work.id)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-950">{work.id}</span>
                    <RiskBadge score={work.riskScore} size="sm" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 truncate mt-1">{work.title}</p>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{reasons.join(' · ')}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 shrink-0 text-center sm:text-right">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">{t('table.risk')}</div>
                    <div className="text-sm font-mono font-bold text-slate-800">{Math.round(riskNorm * 100)}%</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">{t('mp.attention.financialExposure')}</div>
                    <div className="text-sm font-mono font-bold text-slate-800">{formatINR(work.sanctionedAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">{t('mp.attention.stage')}</div>
                    <div className="text-sm font-semibold text-slate-800 truncate max-w-24">{work.workStage}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RISK / WORK / FUND OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('mp.insights.riskDistribution')}</h4>
          {['high', 'medium', 'low', 'nominal'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onNavigate('risk', { risk: level })}
              className="w-full flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2"
            >
              <RiskBadge level={level} size="sm" />
              <span className="font-mono font-bold text-slate-800">{riskDist[level]}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('mp.sidebar.myWorks')}</h4>
          <StageTracker currentStage="status.workCompleted" compact showCaption={false} />
          <div className="grid grid-cols-3 gap-2 pt-1">
            {stageDist.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onNavigate('works', { stageIndex: idx })}
                className="text-left cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-1.5"
              >
                <div className="text-xs font-semibold uppercase text-slate-400 truncate">{t(s.key)}</div>
                <div className="text-base font-mono font-bold text-slate-900">{s.count}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('mp.sidebar.fundUtilisation')}</h4>
          <div className="text-sm space-y-1">
            <button type="button" onClick={() => onNavigate('fund')} className="w-full flex justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2">
              <span className="text-slate-500">{t('mp.fund.paymentReleased')}</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(financials.paymentReleasedTotal)}</span>
            </button>
            <button type="button" onClick={() => onNavigate('compliance')} className="w-full flex justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2">
              <span className="text-slate-500">{t('mp.compliance.title')}: {t('mp.insights.paymentStageSignals')}</span>
              <span className={`font-mono font-bold ${paymentStageSignals > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{paymentStageSignals}</span>
            </button>
            <button type="button" onClick={() => onNavigate('compliance')} className="w-full flex justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2">
              <span className="text-slate-500">{t('mp.insights.evidenceGaps')}</span>
              <span className={`font-mono font-bold ${evidenceGapCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{evidenceGapCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONSTITUENCY COVERAGE / MAP PREVIEW */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-700" /> {t('mp.map.title')}
          </h4>
          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="text-sm font-semibold text-indigo-700 hover:underline cursor-pointer"
          >
            {t('buttons.view')} &rarr;
          </button>
        </div>
        <FundMap
          level="district"
          districtName={currentMp?.constituency || currentMp?.district}
          works={mpWorks}
          onSelectWork={onSelectWork}
          height={320}
        />
      </div>

      {/* RECENT WORK ACTIVITY */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Recent Work Activity
          </h4>
          <button type="button" onClick={() => onNavigate('works')} className="text-sm font-semibold text-indigo-700 hover:underline cursor-pointer">
            {t('buttons.view')} &rarr;
          </button>
        </div>
        {recentWorks.length === 0 ? (
          <EmptyState message={t('empty.noWorks')} />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentWorks.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onSelectWork(w.id)}
                className="w-full flex items-center justify-between gap-3 py-3 text-left cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-500 mr-2">{w.id}</span>
                  <span className="text-sm font-semibold text-slate-900 truncate">{w.title}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 shrink-0">{w.workStage}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <MethodologyDrawer
        open={scstMethodologyOpen}
        onClose={() => setScstMethodologyOpen(false)}
        dataSource={currentMp?.scStProxyNote || 'Estimated from work-category/description keywords -- the eSAKSHI export has no official SC/ST-area field.'}
        limitations={[
          'This is a proxy indicator derived from keyword matching, not an official statutory compliance figure.',
          'A value of 0% may mean no matching keywords were found, not that no SC/ST-directed spending occurred.',
        ]}
      />
    </div>
  );
}
