import { fitPercent } from '@/lib/advisor/view';
import { formatNumber } from '@/lib/format';

interface FitBarProps {
  /** Fit of the offer, 0-100; products are offered from 40 upwards. */
  fit: number | null;
  /** Fit from which the product is offered, drawn as a guide. */
  threshold?: number;
}

/**
 * Draws the fit of an offer on a 0-100 scale with the offer threshold marked.
 *
 * The fit is not a score: it never uses the PULSE colour scale, so the two
 * numbers are never confused on the same page.
 *
 * @param props - The fit and the threshold from which a product is offered.
 * @returns The fit figure over its bar.
 */
export function FitBar({ fit, threshold = 40 }: FitBarProps) {
  const width = fitPercent(fit);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted">Encaje</p>
      <p className="text-sm font-medium tabular-nums">
        {formatNumber(fit, 0)}/100
      </p>
      <span className="relative block h-1.5 w-full max-w-40 bg-surface-secondary">
        <span
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${width}%` }}
        />
        <span
          className="absolute inset-y-0 w-px bg-separator"
          style={{ left: `${threshold}%` }}
          aria-hidden="true"
        />
      </span>
      <p className="text-xs text-muted">Se ofrece desde {threshold}</p>
    </div>
  );
}
