/** Shape of any JSON object before validation. */
export type RawRecord = Record<string, unknown>;

/**
 * Narrows an unknown value to a plain JSON object.
 *
 * @param value - Candidate value coming from `JSON.parse`.
 * @returns The value as a record, or `null` when it is not an object.
 */
export function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

/**
 * Reads a finite number, tolerating `null`, strings and missing keys.
 *
 * @param value - Candidate value.
 * @returns The number, or `null` when it cannot be represented.
 */
export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Reads a finite number falling back to a default.
 *
 * @param value - Candidate value.
 * @param fallback - Value returned when the candidate is unusable.
 * @returns A finite number.
 */
export function toNumber(value: unknown, fallback = 0): number {
  return toNumberOrNull(value) ?? fallback;
}

/**
 * Reads a non-empty string.
 *
 * @param value - Candidate value.
 * @param fallback - Value returned when the candidate is unusable.
 * @returns A string.
 */
export function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value !== '' ? value : fallback;
}

/**
 * Reads an optional string, preserving `null` for absent values.
 *
 * @param value - Candidate value.
 * @returns The string, or `null`.
 */
export function toTextOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Reads an array of unknown items.
 *
 * @param value - Candidate value.
 * @returns The array, or an empty array when the value is not a list.
 */
export function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Reads a list of strings, dropping anything that is not one.
 *
 * @param value - Candidate value.
 * @returns The strings found in the list.
 */
export function toStringList(value: unknown): string[] {
  return toArray(value).filter(
    (item): item is string => typeof item === 'string' && item !== '',
  );
}

/**
 * Reads a dictionary of strings, used for label maps.
 *
 * @param value - Candidate value.
 * @returns A record with only string values.
 */
export function toStringMap(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === 'string') result[key] = item;
  }
  return result;
}

/**
 * Reads a dictionary of numbers, keeping `null` entries out.
 *
 * @param value - Candidate value.
 * @returns A record with only finite numeric values.
 */
export function toNumberMap(value: unknown): Record<string, number> {
  const record = asRecord(value);
  if (!record) return {};
  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(record)) {
    const parsed = toNumberOrNull(item);
    if (parsed !== null) result[key] = parsed;
  }
  return result;
}
