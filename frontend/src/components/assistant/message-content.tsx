import { Fragment } from 'react';

/** Renders emphasis as React nodes; raw HTML and model-supplied links stay inert text. */
function inlineText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

/** Displays short paragraphs and lists safely, including incomplete streamed Markdown. */
export function MessageContent({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[13px] leading-[1.75] break-words [overflow-wrap:anywhere]">
      {text.split(/\n\s*\n/).map((block, index) => {
        const lines = block.split('\n');
        if (lines.every((line) => /^\s*[-•*]\s/.test(line)))
          return (
            <ul
              key={index}
              className="list-disc space-y-1 pl-4 marker:text-muted"
            >
              {lines.map((line, i) => (
                <li key={i}>{inlineText(line.replace(/^\s*[-•*]\s/, ''))}</li>
              ))}
            </ul>
          );
        return (
          <p key={index} className="whitespace-pre-wrap">
            {inlineText(block)}
          </p>
        );
      })}
    </div>
  );
}
