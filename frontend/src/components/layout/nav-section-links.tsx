import Link from 'next/link';

import type { NavSection } from '@/lib/company/sections';
import type { CompanySection } from '@/lib/routes';

export type { NavSection } from '@/lib/company/sections';

interface NavSectionLinksProps {
  sections: readonly NavSection[];
  /** Section the reader is on; marked `aria-current`. */
  current: CompanySection;
  /** `row` is the tab strip of the wide bar; `column` the list of the phone menu. */
  layout: 'row' | 'column';
  /** Called when a section is chosen, so a menu can close itself. */
  onNavigate?: () => void;
}

const LIST_CLASS = {
  row: 'flex items-center gap-0.5',
  column: 'flex flex-col gap-1',
} as const;

const LINK_CLASS = {
  row: 'flex min-h-10 items-center rounded-lg px-2 py-[11px] text-[15px] font-medium leading-none whitespace-nowrap transition-colors xl:px-3',
  column:
    'flex min-h-12 items-center rounded-lg px-4 text-[17px] font-medium leading-none transition-colors',
} as const;

/**
 * The seven sections of a company as links that look like tabs: the current
 * one in link blue on `brand-subtle`, the rest in secondary ink.
 *
 * They stay `next/link` anchors with `aria-current`, so every section keeps
 * its own URL and can be opened in a new tab. The same list serves the wide
 * bar as a row and the phone menu as a column with 48 px targets.
 *
 * The row keeps 10 px of side padding up to `xl`: with seven tabs the strip
 * and the company search share one 1240 px row, and the brand inset of 12 px
 * only comes back where there is room for it.
 *
 * @param props - Sections, the current one, the layout and the close hook.
 * @returns The list of section links.
 */
export function NavSectionLinks({
  sections,
  current,
  layout,
  onNavigate,
}: NavSectionLinksProps) {
  return (
    <ul className={LIST_CLASS[layout]}>
      {sections.map((section) => {
        const active = section.key === current;
        return (
          <li key={section.key} className="shrink-0">
            <Link
              href={section.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={`${LINK_CLASS[layout]} ${
                active
                  ? 'text-link-accent bg-brand-subtle'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {section.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
