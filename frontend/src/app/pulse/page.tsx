import type { Metadata } from 'next';

import { PageShell, Section } from '@/components/layout/page-shell';
import { PulsePortfolioTable } from '@/components/pulse/portfolio-table';
import { ScoreLegend } from '@/components/pulse/score-legend';
import { StatGrid, type StatItem } from '@/components/xray/stat-grid';
import { getPulseDataSource } from '@/lib/pulse/data';
import { pulsePortfolioStats } from '@/lib/pulse/selectors';
import { formatMonth, formatNumber } from '@/lib/xray/format';

export const metadata: Metadata = {
  title: 'PULSE — salud financiera y previsión a 6 meses · Embat Pulse',
  description:
    'Score PULSE 0-100 con 11 variables en 4 pilares, historia mensual y previsión +1 a +6 meses con banda p10-p90.',
};

/**
 * Portfolio view of PULSE: every company with its score, its movement, the
 * share of the score backed by data and the six-month forecast.
 *
 * @returns The ranked portfolio and the published weights of the score.
 */
export default async function PulsePage() {
  const { meta, companies } = await getPulseDataSource().getSummary();
  const stats = pulsePortfolioStats(companies);
  const items: StatItem[] = [
    {
      key: 'count',
      label: 'Empresas puntuadas',
      value: formatNumber(stats.count),
      hint: meta.lastMonth ? `Cierre ${formatMonth(meta.lastMonth)}` : '',
    },
    {
      key: 'median',
      label: 'PULSE mediano',
      value: formatNumber(stats.median, 1),
      hint: 'La mitad de la cartera queda por debajo',
    },
    {
      key: 'watch',
      label: 'Por debajo de 50',
      value: formatNumber(stats.belowWatch),
      hint: 'Umbral de vigilancia de la escala',
    },
    {
      key: 'deteriorating',
      label: 'Previsión a la baja',
      value: formatNumber(stats.deteriorating),
      hint: 'Previsión +6 m por debajo del score de hoy',
    },
  ];

  return (
    <PageShell
      title={meta.scoreName || 'PULSE'}
      lead={`${meta.scoreExpansion}: 11 variables en 4 pilares, 100 puntos, historia mensual y previsión a ${formatNumber(meta.horizons[meta.horizons.length - 1] ?? 6)} meses con banda p10-p90.`}
    >
      <StatGrid items={items} columns={4} />

      <Section
        title="Cartera"
        note="Ordena por nivel, por movimiento del mes o por el cambio previsto"
      >
        {companies.length === 0 ? (
          <p className="text-sm text-muted">
            No hay export de PULSE disponible. Genera{' '}
            <code>src/data/pulse</code> o apunta <code>XRAY_API_URL</code> al
            servicio.
          </p>
        ) : (
          <PulsePortfolioTable rows={companies} />
        )}
      </Section>

      <Section
        title="Cómo se reparten los 100 puntos"
        note="Pesos fijos y publicados: el score se puede reconstruir a mano"
      >
        <ScoreLegend pillars={meta.pillars} variables={meta.variables} />
      </Section>
    </PageShell>
  );
}
