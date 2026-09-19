import { Fragment, type ReactNode } from 'react';

const BULLET = /^\s*[-•*]\s+/;
const NUMBERED = /^\s*\d{1,2}[.)]\s+/;
const HEADING = /^\s*#{1,6}\s+/;

/** Renders emphasis as React nodes; raw HTML and model-supplied links stay inert text. */
function inlineText(text: string): ReactNode[] {
  return text
    .replace(/`([^`\n]*)`/g, '$1')
    .split(/(\*\*[^*]+\*\*|(?<![*\w])\*[^*\n]+\*(?![*\w]))/g)
    .map((part, index) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
        return <em key={index}>{part.slice(1, -1)}</em>;
      return <Fragment key={index}>{part}</Fragment>;
    });
}

type Group =
  { kind: 'ul' | 'ol'; items: string[] } | { kind: 'p' | 'h'; lines: string[] };

/** Groups consecutive lines so a bold caption followed by bullets renders as text plus a list. */
function groupLines(block: string): Group[] {
  const groups: Group[] = [];
  for (const line of block.split('\n')) {
    if (!line.trim()) continue;
    const kind = BULLET.test(line)
      ? 'ul'
      : NUMBERED.test(line)
        ? 'ol'
        : HEADING.test(line)
          ? 'h'
          : 'p';
    const last = groups.at(-1);
    if (kind === 'ul' || kind === 'ol') {
      const item = line.replace(kind === 'ul' ? BULLET : NUMBERED, '');
      if (last?.kind === kind) last.items.push(item);
      else groups.push({ kind, items: [item] });
    } else if (kind === 'h') {
      groups.push({ kind, lines: [line.replace(HEADING, '')] });
    } else if (last?.kind === 'p') {
      last.lines.push(line);
    } else groups.push({ kind, lines: [line] });
  }
  return groups;
}

/** Renders one grouped run of lines as a list, heading or paragraph. */
function GroupView({ group }: { group: Group }) {
  if ('items' in group) {
    const List = group.kind;
    return (
      <List
        className={`space-y-1 marker:text-muted ${group.kind === 'ul' ? 'list-disc pl-4' : 'list-decimal pl-5'}`}
      >
        {group.items.map((item, i) => (
          <li key={i}>{inlineText(item)}</li>
        ))}
      </List>
    );
  }
  if (group.kind === 'h')
    return (
      <p className="font-semibold text-foreground">
        {inlineText(group.lines[0])}
      </p>
    );
  return (
    <p className="whitespace-pre-wrap">{inlineText(group.lines.join('\n'))}</p>
  );
}

/** Displays short paragraphs and lists safely, including incomplete streamed Markdown. */
export function MessageContent({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[13px] leading-[1.7] break-words [overflow-wrap:anywhere]">
      {text
        .split(/\n\s*\n/)
        .flatMap((block, b) =>
          groupLines(block).map((group, g) => (
            <GroupView key={`${b}-${g}`} group={group} />
          )),
        )}
    </div>
  );
}
