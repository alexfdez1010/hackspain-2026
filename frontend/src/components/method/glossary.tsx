import { METHOD_GLOSSARY } from '@/lib/method/glossary';

/**
 * The words of finance the page uses, each with its everyday meaning, in two
 * columns on a desktop.
 *
 * @returns The definition list.
 */
export function MethodGlossary() {
  return (
    <dl className="grid gap-x-10 sm:grid-cols-2">
      {METHOD_GLOSSARY.map((entry) => (
        <div
          key={entry.term}
          className="flex flex-col gap-0.5 border-b border-hairline py-3 text-[15px] leading-[1.55] last:border-0 sm:[&:nth-last-child(-n+2)]:border-0"
        >
          <dt className="font-medium">{entry.term}</dt>
          <dd className="text-ink-secondary">{entry.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}
