import Link from 'next/link';

import type { ActionLink } from '@/lib/actions/links';

interface ActionArrowProps {
  link: ActionLink;
  /** Extra utilities, normally the top margin of the action it closes. */
  className?: string;
}

/**
 * The section link of the brand: ink with an arrow, never a blue button. The
 * arrow steps forward on hover and the label turns sky, so the movement says
 * «this goes somewhere» without adding a second colour to the block.
 *
 * @param props - The verified link and optional utilities.
 * @returns An arrow link over navy.
 */
export function ActionArrow({ link, className = '' }: ActionArrowProps) {
  return (
    <Link
      href={link.href}
      data-arrow
      className={`group hover:text-sky inline-flex items-center gap-2 text-[15px] leading-none font-medium text-white transition-colors ${className}`.trim()}
    >
      {link.label}
      <span
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
