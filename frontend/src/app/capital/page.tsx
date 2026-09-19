import type { Metadata } from 'next';

import { BusinessModel } from '@/components/capital/business-model';
import { OfferList } from '@/components/capital/offer-list';
import {
  StatusFilter,
  STATUS_FILTERS,
} from '@/components/capital/status-filter';
import { PageShell, Section } from '@/components/layout/page-shell';
import { StatGrid } from '@/components/xray/stat-grid';
import { getDataSource } from '@/lib/xray/data';
import { formatEuro, formatNumber, formatPercent } from '@/lib/xray/format';
import type { OfferStatus } from '@/lib/xray/offer';
import type { OfferDetail, OfferRow } from '@/lib/xray/source/types';

export const metadata: Metadata = {
  title: 'Embat Capital — línea de circulante dinámica · Embat Pulse',
};

/** Companies shown with their limit history, to keep the page fast. */
const SHOWN = 12;

interface CapitalPageProps {
  searchParams: Promise<{ estado?: string }>;
}

/**
 * Counts the lines per commercial state, plus the overall total.
 *
 * @param rows - Every priced line.
 * @returns Counts keyed by status and by `todas`.
 */
function countByStatus(rows: readonly OfferRow[]): Record<string, number> {
  const counts: Record<string, number> = { todas: rows.length };
  for (const row of rows) {
    counts[row.offer.status] = (counts[row.offer.status] ?? 0) + 1;
  }
  return counts;
}

/**
 * Embat Capital: the revolving working-capital line priced from the score.
 *
 * @param props - Search parameters carrying the status filter.
 * @returns The marketplace, its totals and the business model behind it.
 */
export default async function CapitalPage({ searchParams }: CapitalPageProps) {
  const { estado } = await searchParams;
  const active = (
    STATUS_FILTERS.includes(estado as OfferStatus) ? estado : 'todas'
  ) as OfferStatus | 'todas';

  const source = getDataSource();
  const all = await source.getOffers();
  const counts = countByStatus(all);
  const deployable = all
    .filter((row) => row.offer.status !== 'cerrada')
    .reduce((total, row) => total + row.offer.limit, 0);
  const preapproved = all.filter((row) => row.offer.status === 'preaprobada');
  const avgSpread =
    preapproved.length === 0
      ? 0
      : preapproved.reduce((total, row) => total + row.offer.spread_bps, 0) /
        preapproved.length;

  const visible = (
    active === 'todas' ? all : all.filter((row) => row.offer.status === active)
  ).slice(0, SHOWN);
  const details = (
    await Promise.all(visible.map((row) => source.getOffer(row.id)))
  ).filter((detail): detail is OfferDetail => detail !== null);

  return (
    <PageShell
      title="Embat Capital"
      lead="Línea de circulante revolvente preaprobada cuyo límite y precio se recalculan cada mes con el score X-Ray."
    >
      <StatGrid
        columns={4}
        items={[
          {
            key: 'deployable',
            label: 'Capital desplegable',
            value: formatEuro(deployable),
            hint: 'Suma de límites vivos, excluye líneas cerradas',
          },
          {
            key: 'preapproved',
            label: 'Empresas preaprobadas',
            value: formatNumber(preapproved.length),
            hint: `${formatPercent(preapproved.length / Math.max(all.length, 1), 1)} de la cartera`,
          },
          {
            key: 'watch',
            label: 'En vigilancia',
            value: formatNumber(counts['en vigilancia'] ?? 0),
            hint: 'Revisión mensual, sin ampliaciones',
          },
          {
            key: 'spread',
            label: 'Diferencial medio preaprobado',
            value: `${formatNumber(avgSpread)} pb`,
            hint: 'Sobre índice de referencia',
          },
        ]}
      />

      <Section title="Quién paga la línea">
        <BusinessModel />
      </Section>

      <Section
        title="Cartera de líneas"
        note={`Las ${SHOWN} mayores por límite, con su evolución de 12 meses`}
      >
        <div className="flex flex-col gap-6">
          <StatusFilter active={active} counts={counts} />
          <OfferList offers={details} />
        </div>
      </Section>
    </PageShell>
  );
}
