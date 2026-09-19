import { groupName } from '@/lib/company/names';

interface GroupPillProps {
  /** Group identifier of the company, possibly empty. */
  groupId: string;
}

/**
 * Names the group the company belongs to, beside the page title, as the
 * prototype does: a hairline pill, no colour.
 *
 * @param props - Group identifier.
 * @returns The pill, or `null` when the company has no group.
 */
export function GroupPill({ groupId }: GroupPillProps) {
  if (!groupId) return null;
  return (
    <span className="whitespace-nowrap rounded-full border border-hairline px-3 py-1.5 text-sm font-medium text-ink-secondary">
      {groupName(groupId)}
    </span>
  );
}
