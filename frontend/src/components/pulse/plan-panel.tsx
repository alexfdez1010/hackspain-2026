import Link from 'next/link';

interface PlanPanelProps {
  /** Why this variable holds the points, written from the month. */
  why: string;
  /** The three moves of the plan, in the order they are taken. */
  steps: readonly string[];
  /** Route back to the three next steps. */
  actionHref: string;
  /** Route to the financing catalogue of the company. */
  advisorHref: string;
}

/**
 * The plan of one variable: why it is the one, the three moves, and where to
 * go if the operating measure is not enough.
 *
 * The steps are numbered because they are ordered — the calendar before the
 * cushion, the cushion before the renegotiation — and they carry no bullet,
 * no icon and no colour: the number is the only mark they need.
 *
 * @param props - The reason, the steps and the two routes out of the page.
 * @returns The panel content of the recommendation page.
 */
export function PulsePlanPanel({
  why,
  steps,
  actionHref,
  advisorHref,
}: PlanPanelProps) {
  return (
    <div>
      <p className="max-w-[720px] text-[15px] leading-[1.55] text-ink-secondary">
        {why}
      </p>
      <ol className="mt-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="grid grid-cols-[28px_minmax(0,1fr)] items-baseline gap-4 border-t border-hairline py-3.5"
          >
            <b className="text-[15px] font-semibold leading-[1.55] text-ink-secondary tabular-nums">
              {index + 1}.
            </b>
            <span className="max-w-[720px] text-[17px] leading-[1.6]">
              {step}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-hairline pt-5">
        <Link
          href={actionHref}
          className="text-[15px] font-medium leading-none text-ink-secondary hover:text-ink"
        >
          ← Volver a Acción
        </Link>
        <Link
          href={advisorHref}
          className="text-[15px] font-medium leading-none hover:text-link-accent md:text-[17px]"
        >
          Si necesitas financiación →
        </Link>
      </div>
    </div>
  );
}
