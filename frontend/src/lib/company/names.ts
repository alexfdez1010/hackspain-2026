import { COMPANY_NAMES, GROUP_NAMES } from '@/lib/company/catalogues';

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
 * Picks the name of a catalogue that an identifier hashes to.
 *
 * @param id - Anonymous identifier from the export.
 * @param catalogue - Names to choose from; must not be empty.
 * @returns The chosen name, or the identifier itself when it is blank or the
 * catalogue is empty.
 */
export function hashedName(id: string, catalogue: readonly string[]): string {
  const trimmed = id.trim();
  if (!trimmed || catalogue.length === 0) return id;
  return catalogue[fnv1a(trimmed) % catalogue.length];
}

/**
 * Names a company after a famous brand, deterministically.
 *
 * The export only carries `COMP_xxxx` identifiers; the name makes the demo
 * readable without pretending the data belongs to that brand.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns A famous company name.
 */
export function companyName(companyId: string): string {
  return hashedName(companyId, COMPANY_NAMES);
}

/**
 * Names a validation group after a famous corporate group, deterministically.
 *
 * @param groupId - Identifier such as `GROUP_0147`; blank when unknown.
 * @returns A famous group name, or the identifier when it is blank.
 */
export function groupName(groupId: string): string {
  return hashedName(groupId, GROUP_NAMES);
}
