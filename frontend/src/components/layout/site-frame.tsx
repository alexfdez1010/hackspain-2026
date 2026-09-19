import type { ReactNode } from 'react';

interface SiteFrameProps {
  children: ReactNode;
  /** Vertical axis between the two inner columns. Hidden below `lg`. */
  split?: boolean;
  /** Slow highlight traveling the right gutter line. Landing only. */
  pulse?: boolean;
}

/**
 * Full-page column frame: outer gutters and an optional center axis.
 *
 * The 1px lines are structural (they define the indent and the split). They
 * are not card chrome. Overlay is `absolute` and `z-10` so content cannot
 * cover the columns; pointer events stay off. `pulse` paints a traveling
 * tick on the existing right line; it does not add a second rule.
 *
 * @param props - Page content, center split, and optional gutter pulse.
 * @returns The framed page.
 */
export function SiteFrame({
  children,
  split = false,
  pulse = false,
}: SiteFrameProps) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-separator" />
        <div className="absolute inset-y-0 left-[var(--site-gutter)] w-px bg-separator" />
        {split ? (
          <div className="absolute inset-y-0 left-1/2 hidden w-px bg-separator lg:block" />
        ) : null}
        <div className="absolute inset-y-0 right-[var(--site-gutter)] w-px overflow-hidden bg-separator">
          {pulse ? (
            <span className="gutter-pulse absolute inset-x-0 top-0 h-16 bg-linear-to-b from-transparent via-foreground/35 to-transparent" />
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
