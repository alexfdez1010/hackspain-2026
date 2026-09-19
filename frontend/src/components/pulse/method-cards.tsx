import Link from 'next/link';

import { MethodFormulaPanel } from '@/components/method/formula-panel';
import { MethodModelCard } from '@/components/method/model-card';
import { Panel } from '@/components/ui/panel';
import { buildModelFacts } from '@/lib/pulse/model-facts';
import type { PulseCompany, PulseMeta } from '@/lib/pulse/types';
import { companyRoutes } from '@/lib/routes';

interface PulseMethodCardsProps {
  meta: PulseMeta;
  company: PulseCompany;
}

/**
 * Closes the page with the arithmetic: the three formulas that build the
 * score, and the card of the model that produced this company's numbers.
 *
 * It sits last because it is the answer to a question the reader only asks
 * after seeing the figures — and because every number above it can be
 * reconstructed by hand from these three lines. The two blocks are the ones
 * the method page uses, so the formula is written once in the product; only
 * the facts are narrowed to the company being read.
 *
 * @param props - Published metadata and the company being read.
 * @returns The formula panel and the model card.
 */
export function PulseMethodCards({ meta, company }: PulseMethodCardsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <MethodFormulaPanel variables={meta.variables.length} />
      </Panel>
      <Panel>
        <MethodModelCard facts={buildModelFacts(meta, company)} />
        <Link
          href={companyRoutes(company.companyId).method}
          className="group mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink"
        >
          Cómo se calcula
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </Panel>
    </div>
  );
}
