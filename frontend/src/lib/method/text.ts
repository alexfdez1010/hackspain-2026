/**
 * Shortens a line so it fits the box, marking the cut with an ellipsis.
 *
 * @param line - Line to shorten.
 * @param maxChars - Characters that fit on one line.
 * @returns The line, cut when it does not fit.
 */
function clip(line: string, maxChars: number): string {
  if (line.length <= maxChars) return `${line}…`.slice(0, maxChars);
  return `${line.slice(0, Math.max(maxChars - 1, 1))}…`;
}

/**
 * Breaks a label into the lines that fit a box, without splitting a word.
 *
 * SVG has no text wrapping, so the cells of the treemap have to know their
 * lines before they are drawn. A label that does not fit is cut with an
 * ellipsis instead of overflowing into the neighbouring cell.
 *
 * @param text - Label to lay out.
 * @param maxChars - Characters that fit on one line of the box.
 * @param maxLines - Lines the box can hold.
 * @returns The lines, at most `maxLines` of them.
 */
export function wrapLabel(
  text: string,
  maxChars: number,
  maxLines = 2,
): string[] {
  if (maxChars <= 0 || maxLines <= 0) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let index = 0;
  while (index < words.length && lines.length < maxLines) {
    const word = words[index];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      index += 1;
      continue;
    }
    if (current) {
      lines.push(current);
      current = '';
      continue;
    }
    lines.push(clip(word, maxChars));
    index += 1;
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
    current = '';
  }
  const pending = index < words.length || current !== '';
  if (pending && lines.length > 0) {
    lines[lines.length - 1] = clip(lines[lines.length - 1], maxChars);
  }
  return lines;
}

/**
 * Estimates how many characters fit on one line of a box.
 *
 * @param width - Width of the box in viewBox units.
 * @param fontSize - Font size in the same units.
 * @returns The number of characters, never negative.
 */
export function charsPerLine(width: number, fontSize: number): number {
  if (fontSize <= 0) return 0;
  return Math.max(Math.floor(width / (fontSize * 0.55)), 0);
}
