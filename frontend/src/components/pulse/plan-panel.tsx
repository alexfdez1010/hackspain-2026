import Link from 'next/link';

import { FactGrid } from '@/components/pulse/fact-grid';
import type { PulsePlanFigure } from '@/lib/pulse/plan-view';

interface PlanPanelProps {
  /** Value today, score, points at stake, cost and horizon of the measure. */
  figures: readonly PulsePlanFigure[];
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
 * The plan of one variable: the five figures of the month, why it is the one,
 * the three moves, and where to go if the operating measure is not enough.
 *
 * Everything reads top to bottom on the page itself — figures, reason, moves,
 * ways out — with no panel around it, so the page holds no boxed surface at
 * all. Only the strip of figures carries hairlines, because there two
 * readings meet; the steps are separated by space, and the footer by space
 * alone.
 *
 * The steps are numbered because they are ordered — the calendar before the
 * cushion, the cushion before the renegotiation — and they carry no bullet,
 * no icon and no colour: the number is the only mark they need.
 *
 * @param props - The figures, the reason, the steps and the two routes out.
 * @returns The body of the recommendation page.
 */
export function PulsePlanPanel({
  figures,
  why,
  steps,
  actionHref,
  advisorHref,
}: PlanPanelProps) {
  return (
    <div>
      <FactGrid items={figures} columns="auto" />
      <p className="text-ink-secondary mt-8 max-w-[720px] text-[17px] leading-[1.6]">
        {why}
      </p>
      <h3 className="mt-8 mb-4 text-[20px] leading-[1.35] font-semibold">
        Qué hacer
      </h3>
      <ol>
        {steps.map((step, index) => (
          <li
            key={step}
            className="grid grid-cols-[24px_minmax(0,1fr)] items-baseline gap-4 pb-4.5"
          >
            <b className="text-ink-secondary text-[17px] leading-[1.6] font-semibold tabular-nums">
              {index + 1}.
            </b>
            <span className="max-w-[720px] text-[17px] leading-[1.6]">
              {step}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-5">
        <Link
          href={actionHref}
          className="text-ink-secondary hover:text-ink text-[15px] leading-none font-medium"
        >
          ← Volver a Acción
        </Link>
        <Link
          href={advisorHref}
          className="hover:text-link-accent text-[15px] leading-none font-medium md:text-[17px]"
        >
          Si necesitas financiación →
        </Link>
      </div>
    </div>
  );
}
