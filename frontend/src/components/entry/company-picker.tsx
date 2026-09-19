'use client';

import { ComboBox, Input, ListBox } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';

import { companyRoutes } from '@/lib/routes';

/** Identifiers shown by the picker before the user types. */
const VISIBLE_LIMIT = 40;

interface CompanyPickerProps {
  /** Every company identifier available, sorted. */
  companyIds: readonly string[];
}

/**
 * Narrows the identifiers to those containing the typed text.
 *
 * The list is capped so the popover never mounts the whole portfolio; the
 * first characters of an identifier are enough to reach any company.
 *
 * @param companyIds - Every identifier.
 * @param query - Text typed by the user.
 * @returns At most {@link VISIBLE_LIMIT} matching identifiers.
 */
export function filterCompanyIds(
  companyIds: readonly string[],
  query: string,
): string[] {
  const needle = query.trim().toUpperCase();
  const matches = needle
    ? companyIds.filter((id) => id.toUpperCase().includes(needle))
    : companyIds;
  return matches.slice(0, VISIBLE_LIMIT);
}

/**
 * Lets the user type or pick the company whose PULSE they want to open.
 *
 * Selecting an identifier navigates to its PULSE page; nothing about the
 * companies is shown here beyond their identifiers.
 *
 * @param props - Every identifier of the export.
 * @returns A searchable combo box.
 */
export function CompanyPicker({ companyIds }: CompanyPickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const items = useMemo(
    () => filterCompanyIds(companyIds, query).map((id) => ({ id })),
    [companyIds, query],
  );

  const open = (key: Key | null) => {
    if (key === null) return;
    router.push(companyRoutes(String(key)).pulse);
  };

  return (
    <ComboBox
      aria-label="Identificador de la empresa"
      items={items}
      inputValue={query}
      onInputChange={setQuery}
      onSelectionChange={open}
      menuTrigger="focus"
      allowsEmptyCollection
      className="w-full max-w-sm"
    >
      <ComboBox.InputGroup>
        <Input placeholder="COMP_0001" autoComplete="off" spellCheck={false} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox
          renderEmptyState={() => (
            <span className="block px-3 py-2 text-sm text-muted">
              Ninguna empresa coincide.
            </span>
          )}
        >
          {(item: { id: string }) => (
            <ListBox.Item id={item.id} textValue={item.id}>
              <span className="font-mono text-sm">{item.id}</span>
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
