'use client';

import { ListBox, Select } from '@heroui/react';
import type { Key } from 'react-aria-components';

/** One option of a facet filter. */
export interface FacetOption {
  id: string;
  label: string;
}

interface FacetSelectProps {
  /** Accessible name; the trigger shows the selected option, not a label. */
  label: string;
  options: readonly FacetOption[];
  selected: string;
  onSelect: (value: string) => void;
  /** Trigger width class, so the control row aligns. */
  className?: string;
}

/**
 * Renders one facet of the portfolio filters as a HeroUI select.
 *
 * The first option always clears the facet, so filtering never becomes a
 * one-way door.
 *
 * @param props - Accessible name, options, selection and change handler.
 * @returns A single-selection dropdown.
 */
export function FacetSelect({
  label,
  options,
  selected,
  onSelect,
  className = 'w-44',
}: FacetSelectProps) {
  const handleChange = (key: Key | null) => onSelect(String(key ?? 'all'));
  return (
    <Select
      aria-label={label}
      selectedKey={selected}
      onSelectionChange={handleChange}
    >
      <Select.Trigger className={className}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.id}
              id={option.id}
              textValue={option.label}
            >
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
