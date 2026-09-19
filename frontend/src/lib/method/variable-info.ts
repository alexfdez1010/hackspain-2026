import { directionText, methodVariableDoc } from '@/lib/method/variables';

/** The short explanation of a variable, ready to be shown next to its cell. */
export interface VariableInfo {
  /** Accessible name of the button that opens the explanation. */
  buttonLabel: string;
  title: string;
  /** What the variable measures, in one sentence. */
  measures: string;
  /** Which way it reads, as `Más alto, más sano`. */
  direction: string;
  /** Where the evidence comes from. */
  source: string;
  /** What replaces the ERP when it is missing; `null` when nothing does. */
  proxy: string | null;
}

/**
 * Builds the explanation a reader gets from the info button of a variable.
 *
 * The label and the weight come from the export; the wording of what the
 * variable measures comes from the method documentation, so both maps and the
 * method page say exactly the same thing.
 *
 * @param key - Variable key of the export, such as `cash_days`.
 * @param label - Spanish label of the variable from the export.
 * @param weight - Points of the 100 owned by the variable.
 * @returns The explanation, or `null` when the variable is undocumented.
 */
export function variableInfo(
  key: string,
  label: string,
  weight: number,
): VariableInfo | null {
  const doc = methodVariableDoc(key);
  if (!doc) return null;
  return {
    buttonLabel: `Qué mide ${label}`,
    title: `${label} · ${weight} de 100 puntos`,
    measures: doc.measures,
    direction: directionText(doc.better),
    source: doc.source,
    proxy: doc.proxy,
  };
}
