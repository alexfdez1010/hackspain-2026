import { SIGNAL_KINDS } from '@/lib/pulse/signals';

/**
 * Names the four kinds of signal with their colour, so the chips and the
 * chart triangles read the same everywhere.
 *
 * @returns A compact legend, one line per kind.
 */
export function PulseSignalKindLegend() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
      {Object.values(SIGNAL_KINDS).map((kind) => (
        <div key={kind.label} className="flex items-baseline gap-2">
          <dt className="flex items-center gap-1.5 font-medium">
            <span
              aria-hidden
              className="inline-block size-2 rounded-full"
              style={{ background: kind.color }}
            />
            {kind.label}
          </dt>
          <dd className="text-muted">{kind.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}
