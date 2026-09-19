'use client';

import { Button, ComboBox, Input, ListBox } from '@heroui/react';
import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';

import {
  filterCompanyOptions,
  VISIBLE_LIMIT,
  type CompanyOption,
} from '@/lib/company/options';
import { formatNumber } from '@/lib/format';

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
 * Only a page of matches is rendered, so opening the list is cheap even with
 * the whole export loaded; «cargar más» appends the next page and the count
 * says how many companies there are. Identifiers are matched but never shown.
 * The field fills its row on a phone and keeps a 16 px font there, so iOS does
 * not zoom the page when it gets the focus.
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
  const [limit, setLimit] = useState(VISIBLE_LIMIT);
  const { items, total } = useMemo(
    () => filterCompanyOptions(companies, query, selectedId, limit),
    [companies, query, selectedId, limit],
  );
  const shown = Math.min(limit, total);
  const changeQuery = (value: string) => {
    setQuery(value);
    setLimit(VISIBLE_LIMIT);
  };
  const handleChange = (key: Key | null) => {
    if (key !== null && key !== selectedId) onSelect(String(key));
  };
  return (
    <ComboBox
      aria-label="Empresa"
      items={items}
      selectedKey={selectedId}
      inputValue={query}
      onInputChange={changeQuery}
      onSelectionChange={handleChange}
      menuTrigger="focus"
      allowsEmptyCollection
      className="w-full min-w-0 sm:w-64"
    >
      <ComboBox.InputGroup>
        <Input
          placeholder="Buscar empresa"
          autoComplete="off"
          spellCheck={false}
          className="text-base sm:text-sm"
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
        {shown < total && (
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            className="mt-1"
            onPress={() => setLimit((current) => current + VISIBLE_LIMIT)}
          >
            Cargar más · {formatNumber(shown)} de {formatNumber(total)}
          </Button>
        )}
      </ComboBox.Popover>
    </ComboBox>
  );
}
