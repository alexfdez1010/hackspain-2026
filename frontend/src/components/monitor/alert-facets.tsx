import Link from 'next/link';

import { formatNumber } from '@/lib/xray/format';

/** One selectable facet value with its match count. */
export interface FacetLink {
  id: string;
  label: string;
  count: number;
}

interface AlertFacetsProps {
  /** Accessible name of the facet group. */
  label: string;
  /** Query-string key this facet writes. */
  param: 'tipo' | 'severidad';
  options: readonly FacetLink[];
  active: string;
  /** Query string of the other facet, preserved when switching. */
  keep: string;
}

/**
 * Filters the alert feed with plain links, so a filtered view is shareable.
 *
 * @param props - Facet name, query key, options, selection and the other facet.
 * @returns A row of filter links.
 */
export function AlertFacets({
  label,
  param,
  options,
  active,
  keep,
}: AlertFacetsProps) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {options.map((option) => {
        const selected = option.id === active;
        const query = [
          option.id === 'todas'
            ? ''
            : `${param}=${encodeURIComponent(option.id)}`,
          keep,
        ]
          .filter(Boolean)
          .join('&');
        return (
          <Link
            key={option.id}
            href={query === '' ? '/monitor' : `/monitor?${query}`}
            aria-current={selected ? 'true' : undefined}
            className={
              selected
                ? 'text-foreground underline decoration-2 underline-offset-8'
                : 'text-muted transition-colors hover:text-foreground'
            }
          >
            {option.label} ({formatNumber(option.count)})
          </Link>
        );
      })}
    </nav>
  );
}
