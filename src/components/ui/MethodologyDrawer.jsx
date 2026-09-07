import React from 'react';
import Drawer from './Drawer';
import { useTranslation } from '../../i18n';

// Reusable panel for the "how was this number/flag produced" explanation
// every workspace needs (A4.6). Content is passed in per-context; this just
// provides the consistent shell, section headings and honesty framing.
export default function MethodologyDrawer({ open, onClose, dataSource, limitations, children }) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onClose={onClose} title={t('methodology.title')}>
      <div className="space-y-5 text-sm text-slate-700">
        {dataSource && (
          <section>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">
              {t('methodology.dataSource')}
            </h4>
            <p className="leading-relaxed">{dataSource}</p>
          </section>
        )}
        {limitations && (
          <section>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">
              {t('methodology.limitations')}
            </h4>
            {Array.isArray(limitations) ? (
              <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                {limitations.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            ) : (
              <p className="leading-relaxed">{limitations}</p>
            )}
          </section>
        )}
        {children}
      </div>
    </Drawer>
  );
}
