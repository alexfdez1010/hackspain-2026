import { Fragment } from 'react';
import { AssistantChart } from '@/components/assistant/charts/assistant-chart';
import { MessageContent } from '@/components/assistant/message-content';
import { ToolStatus } from '@/components/assistant/tool-status';
import { toolNameOf } from '@/lib/assistant/tools/names';
import {
  isAssistantToolPart,
  type AssistantMessage,
  type AssistantPart,
} from '@/lib/assistant/types';

/** Consecutive text parts render as one block; tools keep their place in the flow. */
type Block =
  | { kind: 'text'; key: string; text: string }
  | {
      kind: 'tool';
      key: string;
      part: Extract<AssistantPart, { type: `tool-${string}` }>;
    };

/**
 * Groups the parts of a reply into renderable blocks, in the order the model
 * produced them: prose, then a chart, then the reading of the chart.
 *
 * @param parts - Parts of an assistant message.
 * @returns The blocks to render.
 */
export function groupParts(parts: readonly AssistantPart[]): Block[] {
  const blocks: Block[] = [];
  parts.forEach((part, index) => {
    if (part.type === 'text') {
      const last = blocks.at(-1);
      if (last?.kind === 'text') last.text += part.text;
      else blocks.push({ kind: 'text', key: `text-${index}`, text: part.text });
    } else if (isAssistantToolPart(part)) {
      blocks.push({ kind: 'tool', key: part.toolCallId, part });
    }
  });
  return blocks.filter((block) => block.kind !== 'text' || block.text.trim());
}

/**
 * Renders the parts of a reply: safe Markdown for the prose, a status line
 * for every data tool and an interactive chart for every drawn chart.
 *
 * @param props - The message and the navigation callback of chart links.
 * @returns The rendered blocks.
 */
export function MessageParts({
  message,
  onNavigate,
}: {
  message: AssistantMessage;
  onNavigate: () => void;
}) {
  const blocks = groupParts(message.parts);
  const tools = blocks.filter((block) => block.kind === 'tool');
  const pending = tools.filter(
    (block) =>
      block.kind === 'tool' &&
      block.part.type !== 'tool-show_chart' &&
      block.part.state !== 'output-available' &&
      block.part.state !== 'output-error',
  ).length;
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block) => {
        if (block.kind === 'text')
          return <MessageContent key={block.key} text={block.text} />;
        const { part } = block;
        if (part.type === 'tool-show_chart')
          return (
            <Fragment key={block.key}>
              <AssistantChart part={part} onNavigate={onNavigate} />
            </Fragment>
          );
        return (
          <ToolStatus
            key={block.key}
            name={toolNameOf(part.type)}
            state={part.state}
            errorText={'errorText' in part ? part.errorText : undefined}
          />
        );
      })}
      {pending > 0 ? (
        <span className="sr-only">Consultando los datos…</span>
      ) : null}
    </div>
  );
}
