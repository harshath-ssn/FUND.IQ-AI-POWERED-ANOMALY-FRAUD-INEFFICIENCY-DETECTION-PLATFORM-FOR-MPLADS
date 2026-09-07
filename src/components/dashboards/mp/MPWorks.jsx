import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';
import { DataTable, RiskBadge, StageTracker } from '../../ui';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import { LIFECYCLE_STAGES } from '../../ui/StageTracker';
import MPSectionHeader from './MPSectionHeader';
import { hasPaymentStageSignal, hasEvidenceGap, stageKeyForWork } from './mpDerive';

function uniqueValues(works, key) {
  return [...new Set(works.map((w) => w[key]).filter(Boolean))].sort();
}

export default function MPWorks({ mpWorks, onSelectWork, presetFilter, presetNonce }) {
  const { t } = useTranslation();

  const [riskFilter, setRiskFilter] = useState('ALL');
  const [stageIndex, setStageIndex] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [agency, setAgency] = useState('ALL');
  const [vendor, setVendor] = useState('ALL');
  const [payment, setPayment] = useState('ALL');
  const [evidence, setEvidence] = useState('ALL');
  const [attentionOnly, setAttentionOnly] = useState(false);

  useEffect(() => {
    if (!presetFilter) return;
    if (presetFilter.risk) setRiskFilter(presetFilter.risk.toUpperCase());
    if (presetFilter.stageIndex !== undefined) setStageIndex(presetFilter.stageIndex);
    if (presetFilter.category) setCategory(presetFilter.category);
    if (presetFilter.agency) setAgency(presetFilter.agency);
    if (presetFilter.vendor) setVendor(presetFilter.vendor);
    if (presetFilter.payment) setPayment(presetFilter.payment);
    if (presetFilter.evidence) setEvidence(presetFilter.evidence);
    if (presetFilter.attentionOnly) setAttentionOnly(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetNonce]);

  const categories = useMemo(() => uniqueValues(mpWorks, 'category'), [mpWorks]);
  const agencies = useMemo(() => uniqueValues(mpWorks, 'implementingAgency'), [mpWorks]);
  const vendors = useMemo(() => uniqueValues(mpWorks, 'vendorName'), [mpWorks]);

  const filtered = useMemo(() => {
    return mpWorks.filter((w) => {
      if (riskFilter !== 'ALL') {
        const level = w.riskLevel || (w.riskScore >= 70 ? 'HIGH' : w.riskScore >= 40 ? 'MEDIUM' : w.riskScore > 0 ? 'LOW' : 'NOMINAL');
        if (String(level).toUpperCase() !== riskFilter) return false;
      }
      if (stageIndex !== 'ALL' && w.workStageIndex !== stageIndex) return false;
      if (category !== 'ALL' && w.category !== category) return false;
      if (agency !== 'ALL' && w.implementingAgency !== agency) return false;
      if (vendor !== 'ALL' && w.vendorName !== vendor) return false;
      if (payment !== 'ALL' && w.paymentStatus !== payment) return false;
      if (evidence !== 'ALL' && w.photoEvidence !== evidence) return false;
      if (attentionOnly && !(hasPaymentStageSignal(w) || hasEvidenceGap(w) || w.isNegative || (w.riskScore || 0) >= 70)) return false;
      return true;
    });
  }, [mpWorks, riskFilter, stageIndex, category, agency, vendor, payment, evidence, attentionOnly]);

  const columns = [
    {
      key: 'id',
      header: t('table.workId'),
      render: (w) => (
        <div className="min-w-0">
          <span className="font-mono text-xs font-bold text-indigo-950 block">{w.id}</span>
          <span className="text-sm font-semibold text-slate-900 line-clamp-1">{w.title}</span>
        </div>
      ),
    },
    { key: 'category', header: t('table.category') },
    { key: 'district', header: t('table.district') },
    {
      key: 'implementingAgency',
      header: t('table.agency'),
      render: (w) => w.implementingAgency || <span className="text-slate-400 italic">{t('mp.works.notAvailable')}</span>,
    },
    {
      key: 'vendorName',
      header: t('table.vendor'),
      render: (w) => w.vendorName || <span className="text-slate-400 italic">{t('mp.works.notAvailable')}</span>,
    },
    {
      key: 'sanctionedAmount',
      header: t('table.sanctioned'),
      render: (w) => <span className="font-mono font-bold">{formatINR(w.sanctionedAmount)}</span>,
    },
    {
      key: 'paymentReleased',
      header: t('mp.fund.paymentReleased'),
      render: (w) => (
        <div>
          <span className="font-mono font-bold text-blue-700">{formatINR(w.paymentReleased)}</span>
          {w.paymentStatus && <span className="block text-xs text-slate-500">{w.paymentStatus}</span>}
        </div>
      ),
    },
    {
      key: 'workStageIndex',
      header: t('table.progress'),
      render: (w) => <StageTracker currentStage={stageKeyForWork(w)} compact showCaption={false} />,
    },
    {
      key: 'riskScore',
      header: t('table.risk'),
      render: (w) => <RiskBadge score={w.riskScore} size="sm" />,
    },
    {
      key: 'photoEvidence',
      header: t('mp.works.filterEvidence'),
      render: (w) => {
        if (w.photoEvidence === 'present') return <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold"><Camera size={13} /> {t('mp.works.evidencePresent')}</span>;
        if (w.photoEvidence === 'absent') return <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold"><CameraOff size={13} /> {t('mp.works.evidenceMissing')}</span>;
        return <span className="text-slate-400 text-xs">{t('mp.works.evidenceNotApplicable')}</span>;
      },
    },
    {
      key: 'action',
      header: t('table.actions'),
      align: 'right',
      sortable: false,
      render: (w) => (
        <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-950 text-sm font-semibold inline-flex items-center gap-1">
          {t('buttons.view')}
          {(hasPaymentStageSignal(w) || hasEvidenceGap(w)) && <AlertTriangle size={12} className="text-amber-600" />}
        </span>
      ),
    },
  ];

  const selectCls = 'px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer';

  return (
    <div className="space-y-4">
      <MPSectionHeader
        title={t('mp.works.title')}
        subtitle={`${filtered.length} of ${mpWorks.length} works shown for this constituency.`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <select className={selectCls} value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="ALL">{t('filters.riskLevel')}: {t('filters.all')}</option>
          <option value="HIGH">{t('risk.high')}</option>
          <option value="MEDIUM">{t('risk.medium')}</option>
          <option value="LOW">{t('risk.low')}</option>
          <option value="NOMINAL">{t('risk.nominal')}</option>
        </select>

        <select className={selectCls} value={stageIndex} onChange={(e) => setStageIndex(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}>
          <option value="ALL">{t('mp.works.filterStage')}: {t('filters.all')}</option>
          {LIFECYCLE_STAGES.map((key, idx) => <option key={key} value={idx}>{t(key)}</option>)}
        </select>

        <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">{t('filters.category')}: {t('filters.all')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className={selectCls} value={agency} onChange={(e) => setAgency(e.target.value)}>
          <option value="ALL">{t('table.agency')}: {t('filters.all')}</option>
          {agencies.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select className={selectCls} value={vendor} onChange={(e) => setVendor(e.target.value)}>
          <option value="ALL">{t('table.vendor')}: {t('filters.all')}</option>
          {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        <select className={selectCls} value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="ALL">{t('mp.works.filterPayment')}: {t('filters.all')}</option>
          <option value="Success">{t('mp.works.paymentSuccess')}</option>
          <option value="In-Progress">{t('mp.works.paymentInProgress')}</option>
          <option value="No Disbursement Recorded">{t('mp.works.paymentNoDisbursement')}</option>
        </select>

        <select className={selectCls} value={evidence} onChange={(e) => setEvidence(e.target.value)}>
          <option value="ALL">{t('mp.works.filterEvidence')}: {t('filters.all')}</option>
          <option value="present">{t('mp.works.evidencePresent')}</option>
          <option value="absent">{t('mp.works.evidenceMissing')}</option>
          <option value="not_applicable">{t('mp.works.evidenceNotApplicable')}</option>
        </select>

        <button
          type="button"
          onClick={() => setAttentionOnly((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${
            attentionOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          {t('mp.works.filterAttention')}: {t('mp.works.attentionOnly')}
        </button>

        {(riskFilter !== 'ALL' || stageIndex !== 'ALL' || category !== 'ALL' || agency !== 'ALL' || vendor !== 'ALL' || payment !== 'ALL' || evidence !== 'ALL' || attentionOnly) && (
          <button
            type="button"
            onClick={() => { setRiskFilter('ALL'); setStageIndex('ALL'); setCategory('ALL'); setAgency('ALL'); setVendor('ALL'); setPayment('ALL'); setEvidence('ALL'); setAttentionOnly(false); }}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {t('filters.clear')}
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(w) => onSelectWork(w.id)}
        pageSize={12}
        searchable
        searchPlaceholder={t('mp.works.searchPlaceholder')}
        searchKeys={['id', 'title', 'implementingAgency', 'vendorName', 'category']}
        emptyMessage={t('empty.noWorks')}
      />
    </div>
  );
}
