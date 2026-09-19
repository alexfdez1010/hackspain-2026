interface HeadlineTotalProps {
  /** The figure, already formatted in Spanish. */
  value: string;
  /** What the figure counts; one line, never a restatement of the title. */
  caption: string;
}

/**
 * The figure that answers the page title, aligned with the `h1`.
 *
 * It is the largest number of the product — 52 px against the 40 px of the
 * heading — because on the action pages the reader comes for the points, not
 * for the sentence: the caption underneath says what the points are.
 *
 * @param props - The formatted figure and its caption.
 * @returns The headline figure of a page header.
 */
export function PulseHeadlineTotal({ value, caption }: HeadlineTotalProps) {
  return (
    <p className="flex items-end gap-4">
      <b className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums sm:text-[52px]">
        {value}
      </b>
      <span className="max-w-[18ch] pb-2 text-[13px] leading-[1.45] text-ink-secondary">
        {caption}
      </span>
    </p>
  );
}
