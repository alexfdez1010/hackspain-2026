'use client';

import { CloseIcon, Drawer } from '@heroui/react';
import { useEffect, useState } from 'react';

import { CompanySearch } from '@/components/layout/company-search';
import {
  NavSectionLinks,
  type NavSection,
} from '@/components/layout/nav-section-links';
import type { CompanyOption } from '@/lib/company/options';
import type { CompanySection } from '@/lib/routes';

interface MobileNavProps {
  companies: readonly CompanyOption[];
  companyId: string;
  sections: readonly NavSection[];
  current: CompanySection;
  /** Current pathname; a change closes the menu. */
  pathname: string;
  /** Called with the identifier of the chosen company. */
  onSelectCompany: (companyId: string) => void;
}

/** Three hairlines, the one icon HeroUI does not ship. */
function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

const TRIGGER_CLASS =
  'flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * The phone menu: one button in the bar opens a drawer from the right with
 * the company search on top and the six sections as a list underneath.
 *
 * Below `lg` six tabs, a search and the mark do not fit one row, and a second
 * row of scrolling tabs read as clutter. The drawer keeps the bar to the mark
 * and one button, and gives every destination a 48 px target. Choosing a
 * section or a company closes it, because the route changes underneath.
 *
 * @param props - Companies, company in context, sections and the handlers.
 * @returns The trigger button and its drawer.
 */
export function MobileNav({
  companies,
  companyId,
  sections,
  current,
  pathname,
  onSelectCompany,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Drawer isOpen={open} onOpenChange={setOpen}>
      <Drawer.Trigger aria-label="Abrir menú" className={TRIGGER_CLASS}>
        <MenuIcon />
      </Drawer.Trigger>
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-[2px]">
        <Drawer.Content placement="right">
          <Drawer.Dialog
            aria-label="Menú de secciones"
            className="flex h-full w-[min(360px,88vw)] max-w-none flex-col gap-0 bg-surface p-0"
          >
            <div className="flex h-14 items-center px-4">
              <p className="text-[13px] leading-none font-medium tracking-[0.12em] text-ink-secondary uppercase">
                Menú
              </p>
              <Drawer.CloseTrigger aria-label="Cerrar menú">
                <CloseIcon className="size-5" />
              </Drawer.CloseTrigger>
            </div>
            <Drawer.Body className="flex flex-col gap-5 px-4 pb-6">
              <CompanySearch
                key={companyId}
                companies={companies}
                selectedId={companyId}
                onSelect={onSelectCompany}
              />
              <NavSectionLinks
                sections={sections}
                current={current}
                layout="column"
                onNavigate={() => setOpen(false)}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
