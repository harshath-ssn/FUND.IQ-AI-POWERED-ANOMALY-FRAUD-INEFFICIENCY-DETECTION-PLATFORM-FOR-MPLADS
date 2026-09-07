import React, { useMemo } from 'react';
import { Building2, Users } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { buildConcentration, ConcentrationPanel } from '../shared/agencyConcentration';

const LEVEL_KEYS = {
  high: 'district.agencyIntel.highConcentration',
  moderate: 'district.agencyIntel.moderateConcentration',
  distributed: 'district.agencyIntel.distributed',
  single: 'district.agencyIntel.singleEntity',
};

// Agency & Risk Intelligence (Session C, C4). Built only from real vendor /
// agency / payment fields already present on each work record -- no
// fabricated agency IDs (AG001-style), no "syndicate" framing. Concentration
// language only: a district where a small number of vendors or agencies
// account for a disproportionate share of sanctioned outlay is surfaced as
// a signal that warrants review, not as an allegation.
export default function DistrictAgencyIntel({ districtWorks }) {
  const { t } = useTranslation();

  const vendorRows = useMemo(
    () => buildConcentration(districtWorks, (w) => w.vendorName && w.vendorName.trim()),
    [districtWorks]
  );
  const agencyRows = useMemo(
    () => buildConcentration(districtWorks, (w) => w.agency || w.implementingAgency),
    [districtWorks]
  );

  const labels = {
    works: t('district.agencyIntel.worksCount'),
    sanctioned: t('district.agencyIntel.sanctionedTotal'),
    share: t('district.agencyIntel.shareOfDistrict'),
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('district.agencyIntel.title')}</h2>
        <p className="text-sm text-slate-600 max-w-3xl mt-1">{t('district.agencyIntel.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConcentrationPanel
          title={t('district.agencyIntel.vendorConcentration')}
          rows={vendorRows}
          emptyMessage={t('district.agencyIntel.noVendorData')}
          icon={Users}
          t={t}
          i18nKeys={LEVEL_KEYS}
          labels={labels}
        />
        <ConcentrationPanel
          title={t('district.agencyIntel.agencyConcentration')}
          rows={agencyRows}
          emptyMessage={t('district.agencyIntel.noAgencyData')}
          icon={Building2}
          t={t}
          i18nKeys={LEVEL_KEYS}
          labels={labels}
        />
      </div>
    </div>
  );
}
