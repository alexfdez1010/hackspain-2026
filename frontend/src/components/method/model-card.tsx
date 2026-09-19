import type { MethodFact } from '@/lib/method/facts';

interface MethodModelCardProps {
  facts: readonly MethodFact[];
}

/**
 * The model card: facts, not commentary. One hairline row per fact, the
 * figure right-aligned so the column can be read on its own.
 *
 * @param props - The rows of the card.
 * @returns The key and value list.
 */
export function MethodModelCard({ facts }: MethodModelCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium leading-[1.2] text-ink-secondary">
        Ficha del modelo
      </h3>
      <dl>
        {facts.map((fact) => (
          <div
            key={fact.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-5 border-b border-hairline py-3 text-[15px] leading-[1.55] last:border-0 last:pb-0"
          >
            <dt className="text-ink-secondary">{fact.label}</dt>
            <dd className="text-right font-medium tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
