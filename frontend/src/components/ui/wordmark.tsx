/**
 * The PULSE wordmark, drawn in the current text colour.
 *
 * The mark is a transparent PNG used as a CSS mask over the foreground
 * colour, so it follows the theme instead of carrying a baked-in colour and
 * background. The element is decorative: the link around it names the
 * product for assistive technology.
 *
 * @param props - Extra classes, mainly the height that sets its size.
 * @returns A block sized by its height and the ratio of the mark.
 */
export function PulseWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block aspect-[1147/301] bg-foreground [mask-image:url(/pulse-wordmark.png)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${className}`}
    />
  );
}
