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
    <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
      {METHOD_PIPELINE.map((step) => (
        <li key={step.number} className="flex flex-col gap-1">
          <span className="font-mono text-xs tabular-nums text-muted">
            {formatNumber(step.number)}
          </span>
          <h3 className="text-sm font-semibold">{step.title}</h3>
          <p className="text-sm text-muted">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
