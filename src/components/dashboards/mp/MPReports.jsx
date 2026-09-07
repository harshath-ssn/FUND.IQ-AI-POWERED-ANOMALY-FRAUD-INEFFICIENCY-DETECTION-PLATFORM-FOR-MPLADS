import React, { useEffect, useMemo, useState } from 'react';
import { FileText, ShieldAlert, ClipboardList, Printer } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatINR, formatINRAggregate } from '../../../utils/format';
import MPSectionHeader from './MPSectionHeader';
import { computeFinancials, riskDistribution, stageDistribution, complianceChecks } from './mpDerive';

// MP-scoped report/export surface (Part 3, Rule 20). No PDF backend exists in
// this build, so "export" means a clean, print-ready summary the browser's
// native print/save-as-PDF handles -- never labelled as an official audit
// certificate.
export default function MPReports({ currentMp, mpWorks }) {
  const { t } = useTranslation();
  const [quality, setQuality] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/data_quality.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setQuality(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const financials = useMemo(() => computeFinancials(currentMp, mpWorks), [currentMp, mpWorks]);
  const riskDist = useMemo(() => riskDistribution(mpWorks), [mpWorks]);
  const stageDist = useMemo(() => stageDistribution(mpWorks), [mpWorks]);
  const checks = useMemo(() => complianceChecks(currentMp, mpWorks), [currentMp, mpWorks]);

  const scopeLabel = `${currentMp?.name || 'Member of Parliament'} — ${currentMp?.constituency || currentMp?.district || ''} (${currentMp?.state || ''})`;

  const reports = [
    {
      id: 'work-portfolio',
      title: t('mp.reports.workPortfolioReport'),
      icon: ClipboardList,
      body: (
        <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
          <li>{mpWorks.length} total works on file</li>
          {stageDist.map((s) => <li key={s.key}>{t(s.key)}: {s.count}</li>)}
        </ul>
      ),
    },
    {
      id: 'risk-review',
      title: t('mp.reports.riskReviewSummary'),
      icon: ShieldAlert,
      body: (
        <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
          <li>High risk: {riskDist.high} &middot; Medium risk: {riskDist.medium} &middot; Low risk: {riskDist.low} &middot; Nominal: {riskDist.nominal}</li>
          <li>{checks.find((c) => c.id === 'payment-stage')?.measured}</li>
          <li>{checks.find((c) => c.id === 'evidence-gap')?.measured}</li>
        </ul>
      ),
    },
    {
      id: 'monitoring',
      title: t('mp.reports.monitoringReport'),
      icon: FileText,
      body: (
        <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
          <li>Entitlement: {financials.entitlement != null ? formatINRAggregate(financials.entitlement) : t('mp.kpi.notAvailable')}</li>
          <li>Sanctioned: {financials.sanctioned != null ? formatINRAggregate(financials.sanctioned) : t('mp.kpi.notAvailable')}</li>
          <li>Expenditure: {financials.expenditure != null ? formatINRAggregate(financials.expenditure) : t('mp.kpi.notAvailable')}</li>
          <li>Payment Released (works on file): {formatINR(financials.paymentReleasedTotal)}</li>
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-4 print:space-y-2">
      <MPSectionHeader title={t('mp.reports.title')} subtitle={t('mp.reports.notCertificate')} />

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs font-bold uppercase text-slate-400">{t('mp.reports.scope')}</div>
          <div className="font-bold text-slate-900 mt-1">{scopeLabel}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-400">{t('mp.reports.dataCoverage')}</div>
          <div className="font-semibold text-slate-700 mt-1 leading-relaxed">{mpWorks.length} works currently on file for this constituency.</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-400">{t('mp.reports.dataProvenance')}</div>
          <div className="font-semibold text-slate-700 mt-1 leading-relaxed">
            Real eSAKSHI-derived work records.
            {quality?.workflowLayer && ' Any workflow events shown elsewhere may include prototype workflow data — see the Prototype Workflow Data badge.'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Icon size={17} className="text-indigo-800" /> {r.title}</h4>
              </div>
              {r.body}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer print:hidden"
              >
                <Printer size={14} /> {t('mp.reports.download')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
