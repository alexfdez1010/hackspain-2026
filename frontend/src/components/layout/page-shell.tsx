import type { ReactNode } from 'react';

interface PageShellProps {
  /** Page title, rendered as the only `h1` of the route. */
  title: string;
  /** What the page answers; one sentence, never a restatement of the title. */
  lead: string;
  /** Optional figures rendered next to the title. */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * Applies the page-level rhythm: one container width, one heading block and a
 * consistent vertical gap between sections.
 *
 * @param props - Title, lead sentence, optional aside and the page sections.
 * @returns The page main element.
 */
export function PageShell({ title, lead, aside, children }: PageShellProps) {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-10 px-5 pb-20 pt-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted">{lead}</p>
        </div>
        {aside}
      </div>
      {children}
    </main>
  );
}

interface SectionProps {
  /** Section heading, rendered as `h2`. */
  title: string;
  /** Optional one-line note that adds information the heading cannot carry. */
  note?: string;
  /** Optional controls aligned with the heading. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Groups related content under a heading with the shared spacing scale.
 *
 * @param props - Heading, optional note, optional action and the content.
 * @returns A titled section.
 */
export function Section({ title, note, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-display text-lg font-bold tracking-tight">
          {title}
        </h2>
        {note && <p className="text-sm text-muted">{note}</p>}
        {action}
      </div>
      {children}
    </section>
  );
}
