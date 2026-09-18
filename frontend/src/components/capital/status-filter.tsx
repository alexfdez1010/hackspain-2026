import Link from 'next/link';

import { formatNumber } from '@/lib/xray/format';
import type { OfferStatus } from '@/lib/xray/offer';

/** Every marketplace filter, `todas` included. */
export const STATUS_FILTERS: readonly (OfferStatus | 'todas')[] = [
  'todas',
  'preaprobada',
  'en vigilancia',
  'cerrada',
];

interface StatusFilterProps {
  /** Filter currently applied. */
  active: OfferStatus | 'todas';
  /** Number of lines per status, used to label each option. */
  counts: Record<string, number>;
}

/**
 * Filters the marketplace by commercial state, as plain links so the selection
 * survives a reload and can be shared during the demo.
 *
 * @param props - The active filter and the per-status counts.
 * @returns A row of filter links.
 */
export function StatusFilter({ active, counts }: StatusFilterProps) {
  return (
    <nav
      aria-label="Estado de la línea"
      className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
    >
      {STATUS_FILTERS.map((status) => {
        const selected = status === active;
        const count = status === 'todas' ? counts.todas : (counts[status] ?? 0);
        return (
          <Link
            key={status}
            href={
              status === 'todas'
                ? '/capital'
                : `/capital?estado=${encodeURIComponent(status)}`
            }
            aria-current={selected ? 'true' : undefined}
            className={
              selected
                ? 'text-foreground underline decoration-2 underline-offset-8'
                : 'text-muted transition-colors hover:text-foreground'
            }
          >
            {status} ({formatNumber(count)})
          </Link>
        );
      })}
    </nav>
  );
}
