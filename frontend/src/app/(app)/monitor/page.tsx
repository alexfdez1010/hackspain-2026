import type { Metadata } from 'next';

import { PageShell, Section } from '@/components/layout/page-shell';
import { AlertFacets, type FacetLink } from '@/components/monitor/alert-facets';
import { AlertList } from '@/components/monitor/alert-list';
import { AnticipationPanel } from '@/components/monitor/anticipation-panel';
import { RuleList } from '@/components/monitor/rule-list';
import { getDataSource } from '@/lib/xray/data';
import type { Alert } from '@/lib/xray/types';

export const metadata: Metadata = {
  title: 'Monitor de alertas · Embat Pulse',
};

/** Alerts rendered at once; the feed is a sample, not an inbox. */
const FEED_SIZE = 50;

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Informativas',
  warning: 'Atención',
  critical: 'Críticas',
};

interface MonitorPageProps {
  searchParams: Promise<{ tipo?: string; severidad?: string }>;
}

/**
 * Builds the facet options of a field, with `todas` first.
 *
 * @param alerts - Alerts to count.
 * @param pick - Field to group by.
 * @param labels - Optional display labels per value.
 * @returns Facet links ordered by descending count.
 */
function facetsOf(
  alerts: readonly Alert[],
  pick: (alert: Alert) => string,
  labels: Record<string, string> = {},
): FacetLink[] {
  const counts = new Map<string, number>();
  for (const alert of alerts) {
    const key = pick(alert);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [
    { id: 'todas', label: 'Todas', count: alerts.length },
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, label: labels[id] ?? id, count })),
  ];
}

/**
 * Alert monitor: what changed this month and how early the score saw it.
 *
 * @param props - Search parameters carrying the type and severity filters.
 * @returns The alert feed, its facets and the anticipation evidence.
 */
export default async function MonitorPage({ searchParams }: MonitorPageProps) {
  const { tipo, severidad } = await searchParams;
  const source = getDataSource();
  const [all, anticipation] = await Promise.all([
    source.getAlerts(),
    source.getAnticipation(),
  ]);

  const activeType = tipo ?? 'todas';
  const activeSeverity = severidad ?? 'todas';
  const filtered = all.filter(
    (alert) =>
      (activeType === 'todas' || alert.type === activeType) &&
      (activeSeverity === 'todas' || alert.severity === activeSeverity),
  );

  const typeFacets = facetsOf(all, (alert) => alert.type);
  const severityFacets = facetsOf(
    all,
    (alert) => alert.severity,
    SEVERITY_LABELS,
  );
  const feed = filtered.slice(0, FEED_SIZE);

  return (
    <PageShell
      title="Monitor"
      lead="Lo que el score ha detectado este mes, con las reglas que lo disparan y la evidencia de cuánto se adelanta al evento."
    >
      <Section
        title="Reglas del monitor"
        note="Se evalúan cada mes sobre las 1.286 empresas"
      >
        <RuleList />
      </Section>

      <Section
        title="Feed de alertas"
        note={`${feed.length} de ${filtered.length.toLocaleString('es-ES')} alertas del último corte`}
      >
        <div className="flex flex-col gap-5">
          {all.length > 0 && (
            <div className="flex flex-col gap-2">
              <AlertFacets
                label="Tipo de alerta"
                param="tipo"
                options={typeFacets}
                active={activeType}
                keep={
                  activeSeverity === 'todas'
                    ? ''
                    : `severidad=${activeSeverity}`
                }
              />
              <AlertFacets
                label="Severidad"
                param="severidad"
                options={severityFacets}
                active={activeSeverity}
                keep={activeType === 'todas' ? '' : `tipo=${activeType}`}
              />
            </div>
          )}
          <AlertList
            alerts={feed}
            emptyText={
              all.length === 0
                ? 'El servicio todavía no ha publicado alertas. Las reglas de arriba son las que se evaluarán en cuanto el feed esté disponible.'
                : 'Ninguna alerta cumple estos filtros.'
            }
          />
        </div>
      </Section>

      <Section
        title="Anticipación"
        note="Cuántos meses antes del evento se mueve el score"
      >
        <AnticipationPanel anticipation={anticipation} />
      </Section>
    </PageShell>
  );
}
