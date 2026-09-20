import { Disclosure } from '@heroui/react';

import type { AdvisorDeclined } from '@/lib/advisor/types';

interface OutOfScopeListProps {
  declined: readonly AdvisorDeclined[];
}

/**
 * The products the rules left out, one collapsed line each. The name is all
 * the page shows until the reader opens it; the rule that stopped it waits
 * inside, so a refusal is auditable without taking room from the decision.
 *
 * The hairline above each row is the only line drawn, because it is the only
 * place two readings meet; the open rule is set apart by its wash alone.
 *
 * @param props - Products left out with their reasons.
 * @returns The collapsible list.
 */
export function OutOfScopeList({ declined }: OutOfScopeListProps) {
  if (declined.length === 0) {
    return (
      <p className="text-ink-secondary text-[15px] leading-[1.55]">
        Ningún producto del catálogo queda fuera.
      </p>
    );
  }
  return (
    <div>
      {declined.map((item) => (
        <div key={item.product} className="border-hairline border-t">
          <Disclosure>
            <Disclosure.Trigger className="flex w-full items-center justify-between gap-5 py-[13px] text-left text-[15px] leading-[1.55] font-medium">
              {item.label}
              <Disclosure.Indicator className="text-ink-secondary shrink-0" />
            </Disclosure.Trigger>
            <Disclosure.Content>
              <Disclosure.Body className="bg-deep text-ink-secondary mb-3.5 flex max-w-[720px] flex-col gap-1 rounded-lg px-4 py-3.5 text-[15px] leading-[1.55]">
                {item.reasons.map((reason) => (
                  <span key={reason}>{reason}</span>
                ))}
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        </div>
      ))}
    </div>
  );
}
