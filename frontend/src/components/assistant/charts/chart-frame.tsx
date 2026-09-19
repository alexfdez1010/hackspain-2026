import Link from 'next/link';
import type { ReactNode } from 'react';
import { AssistantIcon } from '@/components/assistant/assistant-icon';
import type { ChartSpec } from '@/lib/assistant/charts/types';
import { formatMonth } from '@/lib/format';

/**
 * The figure every chart of a reply sits in: who and when above, the chart,
 * and the page of the app where the same reading lives below. Separation is
 * one hairline, as everywhere else in the product.
 *
 * @param props - The chart specification, its drawing and the navigation callback.
 * @returns The framed figure.
 */
export function ChartFrame({
  spec,
  children,
  onNavigate,
}: {
  spec: ChartSpec;
  children: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <figure
      className="flex flex-col gap-3 border-y border-hairline py-3"
      aria-label={`${spec.title}, ${spec.company}, ${formatMonth(spec.month)}`}
      data-chart={spec.kind}
    >
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold tracking-[0.06em] text-muted uppercase">
          {spec.company} · {formatMonth(spec.month)}
        </span>
        <span className="text-sm leading-snug font-semibold text-foreground">
          {spec.title}
        </span>
      </figcaption>
      <div className="min-w-0">{children}</div>
      <Link
        href={spec.href}
        onClick={onNavigate}
        className="inline-flex w-fit items-center gap-0.5 text-[11px] text-muted underline decoration-muted/40 underline-offset-3 hover:text-foreground"
      >
        Abrir en la aplicación
        <AssistantIcon name="chevron" className="size-2.5" />
      </Link>
    </figure>
  );
}
