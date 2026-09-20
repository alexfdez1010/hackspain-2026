import { VariableInfoButton } from '@/components/charts/variable-info-button';
import { variableInfo } from '@/lib/method/variable-info';

interface VariableInfoMarkProps {
  /** Variable key of the export, such as `cash_days`. */
  variableKey: string;
  /** Spanish label of the variable, as printed beside the mark. */
  label: string;
  /** Points of the 100 owned by the variable. */
  weight: number;
  /** Extra utilities, such as the place of the mark inside a card. */
  className?: string;
}

/**
 * The info button of one of the eleven variables, wherever the variable is
 * named: a 20 px icon that opens the card with what it measures, which way
 * it reads and where the evidence comes from, on hover and on press.
 *
 * It wraps {@link VariableInfoButton} with the lookup of the method's
 * documentation, so a mosaic cell, a ranking row or a contribution row all
 * explain a variable with the same words as the method page. A key the
 * method does not document renders nothing rather than an empty card.
 *
 * @param props - Key, label and weight of the variable, plus classes.
 * @returns The button with its popover, or `null` for an undocumented key.
 */
export function VariableInfoMark({
  variableKey,
  label,
  weight,
  className = '',
}: VariableInfoMarkProps) {
  const info = variableInfo(variableKey, label, weight);
  if (!info) return null;
  return (
    <VariableInfoButton
      info={info}
      className={`size-5 min-w-0 shrink-0 rounded-full text-ink-muted hover:text-ink ${className}`.trim()}
    />
  );
}
