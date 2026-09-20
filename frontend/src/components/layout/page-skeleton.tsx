/** Utilities of one placeholder block: surface colour and the pulse. */
const BLOCK = 'rounded-md bg-surface-secondary motion-safe:animate-pulse';

interface LineProps {
  /** Width utility of the line, such as `w-64`. */
  width: string;
  /** Height utility of the line, such as `h-4`. */
  height?: string;
}

/**
 * One grey line standing in for a run of text or a figure.
 *
 * @param props - Width and height utilities.
 * @returns The placeholder line.
 */
function Line({ width, height = 'h-4' }: LineProps) {
  return <span aria-hidden className={`block ${height} ${width} ${BLOCK}`} />;
}

/**
 * The shape of a product page while its data is being read: the title and
 * the lead of `PageShell`, the four-cell KPI strip and one panel of rows,
 * in the same widths and rhythm, so the page does not jump when the real
 * content streams in.
 *
 * It says «Cargando» to assistive technology and nothing else on screen:
 * the grey blocks pulse (only when motion is allowed) so a slow read looks
 * like work in progress and not like a frozen screen. The strip and the
 * panel keep the product's hairlines because that is what will be drawn
 * there a moment later.
 *
 * @returns The skeleton of a product page.
 */
export function PageSkeleton() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex max-w-[1240px] flex-col gap-12 px-4 pt-6 pb-24 sm:px-8"
    >
      <span className="sr-only">Cargando la página…</span>
      <div className="flex flex-col gap-3">
        <Line width="w-64 sm:w-80" height="h-9 sm:h-11" />
        <Line width="w-40" height="h-7" />
        <Line width="w-full max-w-xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Line width="w-48" height="h-20 sm:h-24" />
        <Line width="w-full" height="h-6 self-end" />
      </div>
      <div className="overflow-hidden rounded-xl border border-hairline">
        <div className="-mt-px -ml-px grid grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border-t border-l border-hairline px-6 py-5"
            >
              <Line width="w-20" height="h-8" />
              <Line width="w-32" />
              <Line width="w-40" height="h-3" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Line width="w-32" height="h-3" />
        <div className="flex flex-col gap-4 rounded-xl border border-hairline p-6">
          <Line width="w-full" height="h-40" />
          <Line width="w-72" height="h-3" />
        </div>
      </div>
    </main>
  );
}
