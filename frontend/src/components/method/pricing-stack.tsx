import type { MethodPriceStep } from '@/lib/method/pricing';

interface MethodPricingStackProps {
  /** Lines of the price, in the order they are added. */
  steps: readonly MethodPriceStep[];
}

/**
 * Stacks the lines that build the annual rate of an offer, from the reference
 * rate to the spread the score moves.
 *
 * Only two of the five lines depend on the company, and both are bounded: that
 * is why the price can be defended in front of a committee.
 *
 * @param props - The lines of the price.
 * @returns The price stack.
 */
export function MethodPricingStack({ steps }: MethodPricingStackProps) {
  return (
    <ol className="flex max-w-3xl flex-col gap-3">
      {steps.map((step) => (
        <li
          key={step.key}
          className={`grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 ${
            step.role === 'total' ? 'border-t border-separator pt-3' : ''
          }`}
        >
          <span aria-hidden className="font-mono text-sm text-muted">
            {step.role === 'add' ? '+' : step.role === 'total' ? '=' : ''}
          </span>
          <span className="font-medium">{step.label}</span>
          <span className="text-right text-sm tabular-nums">{step.amount}</span>
          <p className="col-span-2 col-start-2 text-sm text-muted">
            {step.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
