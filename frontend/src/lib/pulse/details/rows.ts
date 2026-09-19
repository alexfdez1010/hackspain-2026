import {
  asRecord,
  toArray,
  toNumberOrNull,
  toText,
  toTextOrNull,
} from '@/lib/parse-primitives';
import type { DetailMonth } from '@/lib/pulse/details/types';

/** How one field of an exported row is read. */
export type FieldKind = 'number' | 'text' | 'textOrNull' | 'boolean';

/** Snake-case key of the export and how to read it, per camel-case field. */
export type RowSpec<Row> = {
  [Key in keyof Row]: readonly [source: string, kind: FieldKind];
};

/**
 * Reads one field of an exported row.
 *
 * @param value - Raw value.
 * @param kind - How to read it.
 * @returns The typed value; unknown numbers become `null`, unknown text `''`.
 */
function readField(value: unknown, kind: FieldKind): unknown {
  if (kind === 'number') return toNumberOrNull(value);
  if (kind === 'text') return toText(value);
  if (kind === 'textOrNull') return toTextOrNull(value);
  return value === true;
}

/**
 * Converts the rows of one exported list to their typed shape.
 *
 * Entries that are not objects are dropped; every declared field is always
 * present in the result, so a view can read it without checks.
 *
 * @param value - Candidate array from the export.
 * @param spec - Field mapping of the row.
 * @returns The typed rows, in the order of the export.
 */
export function parseRows<Row extends object>(
  value: unknown,
  spec: RowSpec<Row>,
): Row[] {
  const rows: Row[] = [];
  for (const item of toArray(value)) {
    const record = asRecord(item);
    if (!record) continue;
    const row: Record<string, unknown> = {};
    for (const [field, [source, kind]] of Object.entries(spec) as [
      string,
      readonly [string, FieldKind],
    ][]) {
      row[field] = readField(record[source], kind);
    }
    rows.push(row as Row);
  }
  return rows;
}

/**
 * Converts the `months` list of a block: one row per month with every other
 * column read as a number, keyed in camel case under `values`.
 *
 * @param value - Candidate array from the export.
 * @returns The months that carry a key, ascending.
 */
export function parseMonths(value: unknown): DetailMonth[] {
  const months: DetailMonth[] = [];
  for (const item of toArray(value)) {
    const record = asRecord(item);
    const month = toText(record?.month);
    if (!record || !month) continue;
    const values: Record<string, number | null> = {};
    for (const [key, raw] of Object.entries(record)) {
      if (key === 'month') continue;
      values[camelCase(key)] = toNumberOrNull(raw);
    }
    months.push({ month, values });
  }
  return months.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Turns a snake_case key of the export into the camelCase the views read.
 *
 * @param key - Key such as `cash_end` or `over_90`.
 * @returns The key such as `cashEnd` or `over90`.
 */
export function camelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}
