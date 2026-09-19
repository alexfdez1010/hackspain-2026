import {
  ActionsBlock,
  ON_NAVY_SECONDARY,
} from '@/components/actions/actions-block';
import { CompanyActionsList } from '@/components/actions/company-actions-list';
import type { CompanyActions } from '@/lib/actions/types';
import { formatMonth } from '@/lib/format';
import type { CompanySection } from '@/lib/routes';

/** Overline every page uses for the actions, so the reader finds them by name. */
export const ACTIONS_TITLE = 'Qué hacer ahora';

/**
 * Says which close the actions were written for. Where they came from is not
 * a sentence: demo mode carries its own tag.
 *
 * @param result - Actions of the company.
 * @returns The line under the overline.
 */
export function actionsNote(result: CompanyActions | null): string {
  if (!result) return 'Sin datos de la empresa';
  return `Sobre el cierre de ${formatMonth(result.month)}`;
}

interface CompanyActionsViewProps {
  /** Actions of the company, or `null` when it is unknown. */
  result: CompanyActions | null;
  companyId: string;
  current: CompanySection;
}

/**
 * The block with its actions already in hand; knows nothing about where they
 * came from, so the server and the browser render it the same way.
 *
 * @param props - The result, the company and the section.
 * @returns The actions block.
 */
export function CompanyActionsView({
  result,
  companyId,
  current,
}: CompanyActionsViewProps) {
  return (
    <ActionsBlock
      title={ACTIONS_TITLE}
      note={actionsNote(result)}
      demo={result?.mode === 'mock'}
    >
      <CompanyActionsList
        actions={result?.actions ?? []}
        companyId={companyId}
        current={current}
      />
    </ActionsBlock>
  );
}

/**
 * What the page shows while the actions are being written: the same block in
 * the same place, so the layout never jumps when they arrive.
 *
 * @returns The pending block.
 */
export function CompanyActionsPending() {
  return (
    <ActionsBlock title={ACTIONS_TITLE}>
      <p
        aria-live="polite"
        className="mx-auto mt-5 max-w-[720px] text-[17px] leading-[1.6]"
        style={{ color: ON_NAVY_SECONDARY }}
      >
        Leyendo las cifras de la empresa…
      </p>
    </ActionsBlock>
  );
}
