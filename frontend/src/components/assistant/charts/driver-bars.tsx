import { BarRow } from '@/components/assistant/charts/bar-row';
import { formatSigned } from '@/lib/format';
import {
  EXTRA_CONTRIBUTION_LABELS,
  type PulseContributionItem,
} from '@/lib/pulse/company-view';

/**
 * The drivers of a predicted change as diverging bars around a shared zero,
 * negative to the left, largest absolute driver first.
 *
 * The two terms that are not a variable, context and base, recede in muted
 * ink so the reader sees how much of the move is the company and how much
 * is the model; the whole set still adds up to the predicted change.
 *
 * @param props - The decomposition of one horizon.
 * @returns The bar list.
 */
export function DriverBars({
  items,
}: {
  items: readonly PulseContributionItem[];
}) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 0.01);
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const positive = item.value >= 0;
        const ratio = (Math.abs(item.value) / max) * 50;
        const extra = item.key in EXTRA_CONTRIBUTION_LABELS;
        return (
          <BarRow
            key={item.key}
            label={item.label}
            detail={extra ? 'término del modelo' : undefined}
            value={
              <span
                style={{
                  color: positive
                    ? 'var(--score-solid)'
                    : 'var(--score-critical)',
                }}
              >
                {formatSigned(item.value, 2)}
              </span>
            }
            ariaLabel={`${item.label}: ${formatSigned(item.value, 2)} puntos`}
          >
            <span className="relative block h-2.5">
              <span className="absolute inset-y-0 left-1/2 w-px bg-hairline-strong" />
              <span
                className="absolute inset-y-0 rounded-sm"
                style={{
                  width: `${ratio}%`,
                  left: positive ? '50%' : `${50 - ratio}%`,
                  backgroundColor: positive
                    ? 'var(--score-solid)'
                    : 'var(--score-critical)',
                  opacity: extra ? 0.45 : 1,
                }}
              />
            </span>
          </BarRow>
        );
      })}
    </ul>
  );
}
