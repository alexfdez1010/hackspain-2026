/**
 * The product footer: what Pulse measures on the left, who made it on the
 * right, over a hairline.
 *
 * It repeats the width and the side inset of {@link PageShell} so the rule
 * lines up with the content above it. There is no navigation here: every
 * destination of the product already lives in the nav.
 *
 * @returns The page footer.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1240px] px-4 pb-10 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-hairline pt-6 text-[13px] leading-[1.45] text-ink-secondary">
        <span>Pulse · 11 variables en 4 pilares</span>
        <span>By humans for humans.</span>
      </div>
    </footer>
  );
}
