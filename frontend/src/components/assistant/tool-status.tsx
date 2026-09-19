import { AssistantIcon } from '@/components/assistant/assistant-icon';
import {
  TOOL_LABELS,
  type AssistantToolName,
} from '@/lib/assistant/tools/names';

/** The states a tool part goes through, as the SDK names them. */
type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

/**
 * One line per data read: what Nexo consulted, whether it is still reading
 * and whether the read failed. The figures themselves never show here; they
 * appear in the prose the model writes from them.
 *
 * @param props - Tool name, SDK state and the public error text, if any.
 * @returns The status line.
 */
export function ToolStatus({
  name,
  state,
  errorText,
}: {
  name: AssistantToolName;
  state: ToolState;
  errorText?: string;
}) {
  const label = TOOL_LABELS[name];
  const done = state === 'output-available';
  const failed = state === 'output-error' || state === 'output-denied';
  return (
    <p
      role={done ? undefined : 'status'}
      className="flex items-center gap-1.5 text-[11px] leading-snug text-muted"
      data-tool={name}
      data-state={state}
    >
      <AssistantIcon
        name={failed ? 'close' : done ? 'check' : 'pulse'}
        className={`size-3 shrink-0 ${failed ? 'text-danger' : done ? '' : 'animate-pulse text-accent'}`}
      />
      <span>
        {failed
          ? `${label}: ${errorText ?? 'no se ha podido leer.'}`
          : done
            ? `${label} consultado`
            : `Consultando ${label.toLowerCase()}…`}
      </span>
    </p>
  );
}
