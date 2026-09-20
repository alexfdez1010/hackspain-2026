import { OutOfScopeList } from '@/components/advisor/out-of-scope';
import { Panel } from '@/components/ui/panel';
import type { AdvisorDeclined } from '@/lib/advisor/types';

interface OutOfScopePanelProps {
  declined: readonly AdvisorDeclined[];
  /** What the whole proposal is worth, in the words of the export. */
  disclaimer: string;
}

/**
 * What the rules left out today, and the small print of the whole proposal.
 *
 * A refusal is a different reading from an offer, so it gets its own surface
 * instead of a line inside the catalogue: the reader who is buying never has
 * to scroll past it, and the reader who is auditing finds every rule in one
 * place. The disclaimer closes the page because it qualifies both readings.
 *
 * @param props - The products left out and the disclaimer of the export.
 * @returns The panel that answers «¿por qué no me lo ofrecéis?».
 */
export function OutOfScopePanel({
  declined,
  disclaimer,
}: OutOfScopePanelProps) {
  return (
    <Panel>
      <h3 className="mb-1 text-[20px] leading-[1.35] font-semibold">
        Fuera de alcance hoy
      </h3>
      <p className="text-ink-secondary mb-2 text-[15px] leading-[1.55]">
        Abre cualquiera para ver la regla que lo deja fuera.
      </p>
      <OutOfScopeList declined={declined} />
      <p className="text-ink-secondary mt-6 max-w-[720px] text-[13px] leading-[1.45]">
        {disclaimer}
      </p>
    </Panel>
  );
}
