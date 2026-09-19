import Link from 'next/link';

import { formatNumber } from '@/lib/format';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type {
  PulseVariablePeer,
  PulseVariableStanding,
} from '@/lib/pulse/variable-peers';
import { companyVariableRoute } from '@/lib/routes';
import { SCORE_GUIDES, scoreColor } from '@/lib/score';

/** Opacity of the bars of the other variables, so the read one stands out. */
const PEER_OPACITY = 0.55;

/**
 * Draws the 0-100 track of one variable with the band guides on it.
 *
 * @param props - The peer to draw.
 * @returns The track, filled up to the score when there is one.
 */
function PeerTrack({ peer }: { peer: PulseVariablePeer }) {
  return (
    <span className="relative block h-2.5 rounded-sm bg-surface-secondary">
      {peer.score !== null && (
        <span
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            width: `${Math.min(Math.max(peer.score, 0), 100)}%`,
            backgroundColor: scoreColor(peer.score),
            opacity: peer.current ? 1 : PEER_OPACITY,
          }}
        />
      )}
      {SCORE_GUIDES.map((guide) => (
        <span
          key={guide}
          aria-hidden
          className="absolute inset-y-0 w-px bg-separator"
          style={{ left: `${guide}%` }}
        />
      ))}
    </span>
  );
}

/**
 * Names one variable and, unless it is the one being read, links to its page.
 *
 * @param props - The peer and the company whose pages are linked.
 * @returns The label cell of a row.
 */
function PeerLabel({
  peer,
  companyId,
}: {
  peer: PulseVariablePeer;
  companyId: string;
}) {
  const name = peer.current ? (
    <span className="block truncate font-semibold">{peer.label}</span>
  ) : (
    <Link
      href={companyVariableRoute(companyId, peer.key)}
      className="block truncate underline-offset-4 hover:underline"
    >
      {peer.label}
    </Link>
  );
  return (
    <span className="min-w-0">
      {name}
      <span className="block truncate text-xs text-muted">
        {peer.pillarLabel}
      </span>
    </span>
  );
}

interface VariableStandingBarsProps {
  /** The eleven variables of the last close, already ranked. */
  standing: PulseVariableStanding;
  /** Company whose variable pages the other rows link to. */
  companyId: string;
}

/**
 * Places the variable among the other ten of the same month.
 *
 * Every variable is drawn on the same 0-100 track with the band guides, so
 * the position of the one being read is a distance, not an adjective. The
 * others are links: the comparison is also the way to move between variables.
 *
 * @param props - The ranked standing and the company of the page.
 * @returns The list of bars, or an empty state without variables.
 */
export function VariableStandingBars({
  standing,
  companyId,
}: VariableStandingBarsProps) {
  if (standing.peers.length === 0) {
    return (
      <p className="text-sm text-muted">Sin variables publicadas este mes.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {standing.peers.map((peer) => (
        <li
          key={peer.key}
          className="grid grid-cols-[11rem_1fr_3.5rem] items-center gap-3 text-sm max-sm:grid-cols-[8rem_1fr_3rem]"
        >
          <PeerLabel peer={peer} companyId={companyId} />
          <PeerTrack peer={peer} />
          <span
            className={`text-right tabular-nums ${peer.current ? 'font-semibold' : ''}`}
          >
            {peer.score === null ? (
              <span className="text-xs text-muted">{UNKNOWN_TEXT}</span>
            ) : (
              formatNumber(peer.score, 1)
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
