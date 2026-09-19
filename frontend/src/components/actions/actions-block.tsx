import type { ReactNode } from 'react';

/** Secondary text over navy, from the brand palette. */
export const ON_NAVY_SECONDARY = '#C3CADA';

/** Hairline over navy: white at 12 %. */
export const ON_NAVY_HAIRLINE = '#FFFFFF1F';

/** Control outline over navy: white at 32 %. */
export const ON_NAVY_OUTLINE = '#FFFFFF52';

/** The overline labels the block, so the block needs no heading of its own. */
export const ACTIONS_LABEL_ID = 'company-actions-title';

interface ActionsBlockProps {
  /** Overline of the block, the only name the reader needs. */
  title: string;
  /** One line saying which close the actions read. */
  note?: string;
  /** `true` when no model wrote them; flagged like a Nexo demo answer. */
  demo?: boolean;
  children: ReactNode;
}

/**
 * The navy block that opens every company page: one thing to do, written
 * large, with the rest of the month's work under a hairline.
 *
 * @param props - Overline, note, demo flag and the actions themselves.
 * @returns The block as its own labelled section.
 */
export function ActionsBlock({
  title,
  note,
  demo = false,
  children,
}: ActionsBlockProps) {
  return (
    <section
      aria-labelledby={ACTIONS_LABEL_ID}
      className="bg-gradient-hero rounded-2xl px-5 py-7 text-center text-white sm:p-10"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <p
          id={ACTIONS_LABEL_ID}
          className="text-[13px] leading-none font-medium tracking-[0.12em] text-white/70 uppercase"
        >
          {title}
        </p>
        {demo && (
          <span
            className="rounded-md border px-2 py-1 text-[13px] leading-none text-white/70"
            style={{ borderColor: ON_NAVY_OUTLINE }}
          >
            DEMO
          </span>
        )}
      </div>
      {note && (
        <p
          className="mt-3 text-[13px] leading-[1.45]"
          style={{ color: ON_NAVY_SECONDARY }}
        >
          {note}
        </p>
      )}
      {children}
    </section>
  );
}
