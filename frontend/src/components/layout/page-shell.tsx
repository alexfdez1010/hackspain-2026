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
 * Applies the page-level rhythm of the Embat grid: 1240 px of content, 32 px
 * of side inset (16 on a phone) and 48 px between sections. The bottom padding
 * leaves room for the floating assistant, which is taller than the gutter on a
 * phone.
 *
 * The title is the brand `h1`: 40/1.15/600 with −0.015em of tracking, stepped
 * down to 30 px where the line would otherwise break mid-name.
 *
 * @param props - Title, lead sentence, optional aside and the page sections.
 * @returns The page main element.
 */
export function PageShell({ title, lead, aside, children }: PageShellProps) {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-12 px-4 pb-24 pt-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[40px]">
            {title}
          </h1>
          <p className="text-[15px] leading-[1.55] text-ink-secondary">
            {lead}
          </p>
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
 * The heading is an overline — 13 px, uppercase, 600, 0.06em — so a section
 * title never competes with the figures inside it; the note sits on the same
 * baseline in secondary ink.
 *
 * @param props - Heading, optional note, optional action and the content.
 * @returns A titled section.
 */
export function Section({ title, note, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-ink">
          {title}
        </h2>
        {note && (
          <p className="text-[13px] leading-[1.45] text-ink-secondary">
            {note}
          </p>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}
