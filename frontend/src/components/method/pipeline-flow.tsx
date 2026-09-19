import { METHOD_PIPELINE } from '@/lib/method/pipeline';
import { formatNumber } from '@/lib/format';

/**
 * Lists the steps that turn bank statements and invoices into a published
 * score, in the order the backend runs them.
 *
 * @returns The numbered steps, in one column on mobile and four on desktop.
 */
export function MethodPipelineFlow() {
  return (
    <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {METHOD_PIPELINE.map((step) => (
        <li
          key={step.number}
          className="flex flex-col gap-2 border-t border-hairline pt-4"
        >
          <span className="text-[13px] font-medium leading-[1.2] tabular-nums text-ink-muted">
            {formatNumber(step.number)}
          </span>
          <h3 className="text-[17px] font-semibold leading-[1.35]">
            {step.title}
          </h3>
          <p className="text-[15px] leading-[1.55] text-ink-secondary">
            {step.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
