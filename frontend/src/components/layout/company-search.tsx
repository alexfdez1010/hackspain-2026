'use client';

import { ComboBox, Input, ListBox } from '@heroui/react';
import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';

import {
  filterCompanyOptions,
  type CompanyOption,
} from '@/lib/company/options';

interface CompanySearchProps {
  /** Every company of the export, sorted by name. */
  companies: readonly CompanyOption[];
  /** Identifier of the company in context. */
  selectedId: string;
  /** Called with the identifier of the chosen company. */
  onSelect: (companyId: string) => void;
}

/**
 * Lets the reader find and switch the company in context by typing its name.
 *
 * Only a capped slice of matches is rendered, so opening the list is cheap
 * even with the whole export loaded. Identifiers are matched but never shown.
 *
 * @param props - Options, selection and change handler.
 * @returns A searchable combo box.
 */
export function CompanySearch({
  companies,
  selectedId,
  onSelect,
}: CompanySearchProps) {
  const selectedName =
    companies.find((company) => company.id === selectedId)?.name ?? '';
  const [query, setQuery] = useState(selectedName);
  const items = useMemo(
    () => filterCompanyOptions(companies, query, selectedId),
    [companies, query, selectedId],
  );
  const handleChange = (key: Key | null) => {
    if (key !== null && key !== selectedId) onSelect(String(key));
  };
  return (
    <ComboBox
      aria-label="Empresa"
      items={items}
      selectedKey={selectedId}
      inputValue={query}
      onInputChange={setQuery}
      onSelectionChange={handleChange}
      menuTrigger="focus"
      allowsEmptyCollection
      className="w-64"
    >
      <ComboBox.InputGroup>
        <Input
          placeholder="Buscar empresa"
          autoComplete="off"
          spellCheck={false}
        />
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
          {(company: CompanyOption) => (
            <ListBox.Item id={company.id} textValue={company.name}>
              {company.name}
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
