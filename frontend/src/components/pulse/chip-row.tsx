'use client';

/** One chip of a {@link ChipRow}. */
export interface ChipOption {
  id: string;
  label: string;
}

interface ChipRowProps {
  /** Accessible name of the group, such as `Mes observado`. */
  label: string;
  options: readonly ChipOption[];
  /** Id of the chip currently pressed. */
  selected: string;
  onSelect: (id: string) => void;
}

/**
 * A row of chips that picks one of a short, fixed list.
 *
 * Every option is visible at once, which is what a select cannot do: the
 * reader sees how many months or horizons exist before choosing one, and the
 * pressed state is carried by `aria-pressed`, not only by colour.
 *
 * @param props - Group name, options, the selected id and the handler.
 * @returns The chip row.
 */
export function ChipRow({ label, options, selected, onSelect }: ChipRowProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = option.id === selected;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(option.id)}
            className={`whitespace-nowrap rounded-md border px-3.5 py-2.5 text-sm font-medium leading-none ${
              on
                ? 'border-[var(--brand-blue,var(--accent))] bg-brand-subtle text-[var(--brand-blue,var(--accent))]'
                : 'border-hairline-strong text-ink-secondary hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
