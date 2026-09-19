import { ActionArrow } from '@/components/actions/action-arrow';
import {
  ON_NAVY_HAIRLINE,
  ON_NAVY_SECONDARY,
} from '@/components/actions/actions-block';
import { actionLink } from '@/lib/actions/links';
import type { CompanyAction } from '@/lib/actions/types';
import { formatNumber } from '@/lib/format';
import type { CompanySection } from '@/lib/routes';

interface ActionColumnProps {
  action: CompanyAction;
  /** Position of the action in the priority order, from two upwards. */
  numeral: number;
  companyId: string;
  current: CompanySection;
}

/**
 * One of the two actions that follow the headline: the numeral carries the
 * priority, the title the imperative and the sentence the figure.
 *
 * @param props - The action, its position, the company and the section.
 * @returns A column of the lower row.
 */
function ActionColumn({
  action,
  numeral,
  companyId,
  current,
}: ActionColumnProps) {
  const link = actionLink(action.target, companyId, current);
  return (
    <div className="flex flex-col items-start gap-2">
      <span
        aria-hidden="true"
        className="text-[13px] leading-none font-medium tabular-nums"
        style={{ color: ON_NAVY_SECONDARY }}
      >
        {formatNumber(numeral)}
      </span>
      <p className="text-[20px] leading-[1.35] font-semibold text-white">
        {action.title}
      </p>
      <p
        className="text-[15px] leading-[1.55]"
        style={{ color: ON_NAVY_SECONDARY }}
      >
        {action.detail}
      </p>
      {link && <ActionArrow link={link} className="mt-1" />}
    </div>
  );
}

interface CompanyActionsListProps {
  actions: readonly CompanyAction[];
  companyId: string;
  /** Section the reader is on; actions that execute here carry no link. */
  current: CompanySection;
}

/**
 * The answer to «¿y ahora qué?»: the first action is the headline of the
 * page, because it is the one thing worth doing this month; the other two
 * sit under a hairline, smaller, in the order they matter.
 *
 * @param props - Actions, company in context and current section.
 * @returns The content of the navy block.
 */
export function CompanyActionsList({
  actions,
  companyId,
  current,
}: CompanyActionsListProps) {
  const [lead, ...rest] = actions;
  if (!lead) {
    return (
      <p
        className="mx-auto mt-5 max-w-[720px] text-[17px] leading-[1.6]"
        style={{ color: ON_NAVY_SECONDARY }}
      >
        Nada urgente este mes: ningún producto, señal ni palanca cambia la
        situación.
      </p>
    );
  }
  const leadLink = actionLink(lead.target, companyId, current);
  return (
    <>
      <h2 className="mx-auto mt-5 max-w-[720px] text-[26px] leading-[1.25] font-semibold tracking-[-0.01em] text-balance text-white sm:text-[34px] sm:leading-[1.2]">
        {lead.title}
      </h2>
      <p
        className="mx-auto mt-5 max-w-[720px] text-[17px] leading-[1.6]"
        style={{ color: ON_NAVY_SECONDARY }}
      >
        {lead.detail}
      </p>
      {leadLink && <ActionArrow link={leadLink} className="mt-8" />}
      {rest.length > 0 && (
        <div
          className="mx-auto mt-8 grid max-w-[840px] gap-x-0 gap-y-8 border-t pt-7 text-left sm:grid-cols-2"
          style={{ borderColor: ON_NAVY_HAIRLINE }}
        >
          {rest.map((action, index) => (
            <div
              key={action.title}
              className={index > 0 ? 'sm:border-l sm:pl-8' : 'sm:pr-8'}
              style={index > 0 ? { borderColor: ON_NAVY_HAIRLINE } : undefined}
            >
              <ActionColumn
                action={action}
                numeral={index + 2}
                companyId={companyId}
                current={current}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
