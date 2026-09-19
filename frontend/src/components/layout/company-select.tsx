'use client';

import { ListBox, Select } from '@heroui/react';
import type { Key } from 'react-aria-components';

import type { CompanyOption } from '@/lib/company/options';

interface CompanySelectProps {
  /** Every company of the export, sorted by name. */
  companies: readonly CompanyOption[];
  /** Identifier of the company in context. */
  selectedId: string;
  /** Called with the identifier of the chosen company. */
  onSelect: (companyId: string) => void;
}

/**
 * Lets the reader switch the company in context from the navigation.
 *
 * Options read as the famous name the identifier hashes to, with the
 * identifier underneath so two companies with the same name stay apart.
 *
 * @param props - Options, selection and change handler.
 * @returns A single-selection dropdown.
 */
export function CompanySelect({
  companies,
  selectedId,
  onSelect,
}: CompanySelectProps) {
  const handleChange = (key: Key | null) => {
    if (key !== null && key !== selectedId) onSelect(String(key));
  };
  return (
    <Select
      aria-label="Empresa"
      selectedKey={selectedId}
      onSelectionChange={handleChange}
    >
      <Select.Trigger className="w-56">
        <Select.Value>{({ selectedText }) => selectedText}</Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox items={companies}>
          {(company) => (
            <ListBox.Item id={company.id} textValue={company.name}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{company.name}</span>
                <span className="font-mono text-xs text-muted">
                  {company.id}
                </span>
              </span>
            </ListBox.Item>
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
