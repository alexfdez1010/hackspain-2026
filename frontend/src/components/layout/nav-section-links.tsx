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
  row: 'flex items-end gap-7',
  column: 'flex flex-col gap-1',
} as const;

const LINK_CLASS = {
  row: '-mb-px flex items-center border-b-2 pb-3.5 text-[16px] font-medium leading-none whitespace-nowrap transition-colors',
  column:
    'flex min-h-12 items-center rounded-lg px-4 text-[17px] font-medium leading-none transition-colors',
} as const;

const STATE_CLASS = {
  row: {
    active: 'border-accent text-ink',
    idle: 'border-transparent text-ink-secondary hover:text-ink',
  },
  column: {
    active: 'text-link-accent bg-brand-subtle',
    idle: 'text-ink-secondary hover:text-ink',
  },
} as const;

/**
 * The seven sections of a company as the tabs of the prototype: text on a
 * shared hairline, the current one in ink with a 2 px rule in brand blue
 * sitting on that line, the rest in secondary ink.
 *
 * They stay `next/link` anchors with `aria-current`, so every section keeps
 * its own URL and can be opened in a new tab. The same list serves the wide
 * bar as a row and the phone menu as a column with 48 px targets, where the
 * current one is marked on `brand-subtle` because there is no line to sit on.
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
                active ? STATE_CLASS[layout].active : STATE_CLASS[layout].idle
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
