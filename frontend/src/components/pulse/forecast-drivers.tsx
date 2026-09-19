import {
  EXTRA_CONTRIBUTION_LABELS,
  type PulseContributionItem,
} from '@/lib/pulse/company-view';
import { formatSigned } from '@/lib/format';

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
            className="grid grid-cols-[minmax(0,1fr)_minmax(200px,1.4fr)_64px] items-center gap-6 border-b border-hairline py-2.5 last:border-b-0"
          >
            <b
              className={`min-w-0 text-sm leading-snug ${extra ? 'font-normal text-ink-secondary' : 'font-medium text-ink'}`}
            >
              {item.label}
            </b>
            <span aria-hidden className="flex h-3 items-center">
              <span className="flex flex-1 justify-end">
                <span
                  className="h-2.5 rounded bg-feedback-danger"
                  style={{ width: positive ? 0 : width }}
                />
              </span>
              <span className="h-3 w-px shrink-0 bg-hairline-strong" />
              <span className="flex-1">
                <span
                  className="block h-2.5 rounded bg-feedback-success"
                  style={{ width: positive ? width : 0 }}
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
