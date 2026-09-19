import { COMPANY_NAMES, GROUP_NAMES } from '@/lib/company/catalogues';

/** Variants that multiply a catalogue so every company gets a distinct name. */
const COMPANY_SUFFIXES: readonly string[] = [
  '',
  'Iberia',
  'Europe',
  'Global',
  'Labs',
  'Group',
];

/** Variants that multiply the catalogue for customers and suppliers. */
const COUNTERPARTY_SUFFIXES: readonly string[] = [
  'S.L.',
  'S.A.',
  'Servicios',
  'Distribución',
  'Logística',
  'Comercial',
  'Industrial',
  'Ingeniería',
];

/** Variants that multiply the group catalogue. */
const GROUP_SUFFIXES: readonly string[] = ['', 'Holdings', 'International'];

/**
 * Multiplier of the multiplicative hash; a prime larger than any catalogue
 * product, so it is coprime with every modulus and the mapping is a bijection.
 */
const MULTIPLIER = 7919;

/** Shape of the identifiers of the export: a prefix and a sequence number. */
const SEQUENTIAL_ID = /^[A-Za-z]+_(\d+)$/;

/**
 * Hashes a string with 32-bit FNV-1a.
 *
 * Deterministic and dependency-free, so the same identifier always resolves
 * to the same name in the browser, on the server and in tests.
 *
 * @param value - Text to hash.
 * @returns An unsigned 32-bit integer.
 */
export function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Picks the name an identifier hashes to, out of a catalogue multiplied by a
 * list of suffixes.
 *
 * A sequential identifier such as `COMP_0051` goes through a multiplicative
 * hash that is a bijection on the slots, so any run of consecutive numbers no
 * longer than the number of slots gets distinct names. Any other identifier
 * falls back to FNV-1a, which is deterministic but may collide.
 *
 * @param id - Anonymous identifier from the export.
 * @param catalogue - Base names; must not be empty.
 * @param suffixes - Variants appended to a base name; `''` keeps it bare.
 * @returns The name, or the identifier itself when it is blank or the
 * catalogue is empty.
 */
export function hashedName(
  id: string,
  catalogue: readonly string[],
  suffixes: readonly string[] = [''],
): string {
  const trimmed = id.trim();
  if (!trimmed || catalogue.length === 0 || suffixes.length === 0) return id;
  const slots = catalogue.length * suffixes.length;
  const sequence = SEQUENTIAL_ID.exec(trimmed);
  const slot = sequence
    ? (Number(sequence[1]) * MULTIPLIER) % slots
    : fnv1a(trimmed) % slots;
  const base = catalogue[slot % catalogue.length];
  const suffix = suffixes[Math.floor(slot / catalogue.length)];
  return suffix ? `${base} ${suffix}` : base;
}

/**
 * Names a company after a famous brand, deterministically and without
 * repeats across the sequential identifiers of the export.
 *
 * The export only carries `COMP_xxxx` identifiers; the name makes the demo
 * readable without pretending the data belongs to that brand.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns A famous company name, possibly with a regional suffix.
 */
export function companyName(companyId: string): string {
  return hashedName(companyId, COMPANY_NAMES, COMPANY_SUFFIXES);
}

/**
 * Names a validation group after a famous corporate group, deterministically
 * and without repeats across the sequential identifiers of the export.
 *
 * @param groupId - Identifier such as `GROUP_0147`; blank when unknown.
 * @returns A famous group name, or the identifier when it is blank.
 */
export function groupName(groupId: string): string {
  return hashedName(groupId, GROUP_NAMES, GROUP_SUFFIXES);
}

/**
 * Names a customer or supplier after a famous company, deterministically.
 *
 * Counterparty identifiers are `COUNTERPARTY_xxxxx`, so the same hash serves
 * them; the suffixes are trade forms rather than regions, so a counterparty
 * never reads as one of the companies of the export.
 *
 * @param counterpartyId - Identifier such as `COUNTERPARTY_47797`.
 * @returns A readable trade name, or the identifier when it is blank.
 */
export function counterpartyName(counterpartyId: string): string {
  return hashedName(counterpartyId, COMPANY_NAMES, COUNTERPARTY_SUFFIXES);
}
