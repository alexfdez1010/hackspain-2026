import {
  EXTRA_CONTRIBUTION_LABELS,
  type PulseContributionItem,
} from '@/lib/pulse/company-view';
import { formatSigned } from '@/lib/format';

/* The bars are the only place where the feedback colours are used as a
   surface rather than as ink, so they are softened to 65 % against the page:
   at full strength a column of eleven saturated bars reads as an alert, and a
   decomposition is not one. The zero line stays at full contrast, because it
   is the only line the reader has to find. */
const NEGATIVE_FILL =
  'color-mix(in oklab, var(--feedback-danger) 65%, transparent)';

const POSITIVE_FILL =
  'color-mix(in oklab, var(--feedback-success) 65%, transparent)';

interface ForecastDriversProps {
  /** Decomposition of one horizon, largest absolute driver first. */
  items: readonly PulseContributionItem[];
}

/**
 * The drivers of a predicted change, positive to the right of the centre line
 * and negative to its left.
 *
 * Every key the model published is drawn, the two that are not a variable
 * included, because only the whole set adds up to the predicted change; the
 * variables are inked and the model's own terms recede, so the reader sees at
 * once how much of the move is the company and how much is the model.
 *
 * Nothing is drawn between rows: the zero line already runs down the block and
 * the bars hang off it, so a hairline per row would only compete with it.
 *
 * @param props - The decomposition of the selected horizon.
 * @returns One diverging bar per driver.
 */
export function ForecastDrivers({ items }: ForecastDriversProps) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 0.01);
  return (
    <ul>
      {items.map((item) => {
        const positive = item.value >= 0;
        const width = `${(Math.abs(item.value) / max) * 100}%`;
        const extra = item.key in EXTRA_CONTRIBUTION_LABELS;
        return (
          <li
            key={item.key}
            className="grid grid-cols-[minmax(0,1fr)_minmax(200px,1.4fr)_64px] items-center gap-6 py-2.5"
          >
            <b
              className={`min-w-0 text-sm leading-snug ${extra ? 'font-normal text-ink-secondary' : 'font-medium text-ink'}`}
            >
              {item.label}
            </b>
            <span aria-hidden className="flex h-3 items-center">
              <span className="flex flex-1 justify-end">
                <span
                  className="h-2.5 rounded"
                  style={{
                    width: positive ? 0 : width,
                    background: NEGATIVE_FILL,
                  }}
                />
              </span>
              <span className="h-3 w-px shrink-0 bg-hairline-strong" />
              <span className="flex-1">
                <span
                  className="block h-2.5 rounded"
                  style={{
                    width: positive ? width : 0,
                    background: POSITIVE_FILL,
                  }}
                />
              </span>
            </span>
            <b className="whitespace-nowrap text-right text-sm font-medium tabular-nums">
              {formatSigned(item.value, 2)}
            </b>
          </li>
        );
      })}
    </ul>
  );
}
