import {
  DefinitionList,
  type DefinitionItem,
} from '@/components/advisor/definition-list';
import { buildSizingRows } from '@/lib/advisor/sizing-view';
import type { AdvisorSizing } from '@/lib/advisor/types';

interface OfferSizingProps {
  sizing: AdvisorSizing;
}

/**
 * Shows how the amount was computed: the sentence of the formula and every
 * figure it multiplied.
 *
 * @param props - Formula and inputs of the offer.
 * @returns The amount block of an offer.
 */
export function OfferSizing({ sizing }: OfferSizingProps) {
  const items: DefinitionItem[] = buildSizingRows(sizing);
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-3xl text-sm">{sizing.formula}</p>
      <DefinitionList items={items} columns={3} />
    </div>
  );
}
