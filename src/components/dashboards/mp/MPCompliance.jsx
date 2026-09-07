import React, { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import MPSectionHeader from './MPSectionHeader';
import { complianceChecks } from './mpDerive';

const STATUS_STYLES = {
  met: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', labelKey: 'mp.compliance.statusMet' },
  below: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-800 border-amber-200', labelKey: 'mp.compliance.statusBelow' },
  review: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-800 border-amber-200', labelKey: 'mp.compliance.statusReview' },
  nominal: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', labelKey: 'mp.compliance.statusNominal' },
  info: { icon: Info, cls: 'bg-blue-50 text-blue-700 border-blue-200', labelKey: 'mp.compliance.statusInfo' },
  unavailable: { icon: HelpCircle, cls: 'bg-slate-50 text-slate-500 border-slate-200', labelKey: 'mp.compliance.statusUnavailable' },
};

export default function MPCompliance({ currentMp, mpWorks }) {
  const { t } = useTranslation();
  const checks = useMemo(() => complianceChecks(currentMp, mpWorks), [currentMp, mpWorks]);

  return (
    <div className="space-y-4">
      <MPSectionHeader
        title={t('mp.compliance.title')}
        subtitle="Only checks actually supported by fields present in this dataset are shown below. No unverified statutory claims are made."
      />

      <div className="space-y-3">
        {checks.map((check) => {
          const style = STATUS_STYLES[check.status] || STATUS_STYLES.info;
          const Icon = style.icon;
          return (
            <div key={check.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900">{check.title}</h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${style.cls}`}>
                  <Icon size={14} /> {t(style.labelKey)}
                </span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">{t('mp.compliance.measuredValue')}</dt>
                  <dd className="text-slate-800 font-semibold mt-1 leading-relaxed">{check.measured}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">{t('mp.compliance.thresholdMethodology')}</dt>
                  <dd className="text-slate-600 mt-1 leading-relaxed">{check.threshold}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">{t('mp.compliance.dataSource')}</dt>
                  <dd className="text-slate-600 mt-1 leading-relaxed">{check.source}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
