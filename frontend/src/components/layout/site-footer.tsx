/**
 * The product footer: the signature, centred over a hairline.
 *
 * It repeats the width and the side inset of {@link PageShell} so the rule
 * lines up with the content above it. What Pulse measures is already written
 * on the method page, and there is no navigation here either: every
 * destination of the product already lives in the nav.
 *
 * @returns The page footer.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1240px] px-4 pb-10 sm:px-8">
      <div className="border-hairline text-ink-secondary flex flex-wrap items-baseline justify-center gap-x-6 gap-y-2 border-t pt-6 text-[13px] leading-[1.45]">
        <span>By humans for humans.</span>
      </div>
    </footer>
  );
}
