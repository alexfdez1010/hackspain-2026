import type {
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';

/** One of the eleven variables of a month, seen next to the one being read. */
export interface PulseVariablePeer {
  key: string;
  label: string;
  pillarKey: string;
  pillarLabel: string;
  weight: number;
  score: number | null;
  contribution: number | null;
  known: boolean;
  /** `true` for the variable whose page is open. */
  current: boolean;
}

/** Where the variable stands among the others this month. */
export interface PulseVariableStanding {
  /** Every variable of the month, highest score first, unknowns last. */
  peers: PulseVariablePeer[];
  /** Position of the variable by score among the known ones, 1 first. */
  rankByScore: number | null;
  /** Position by points contributed among the known ones, 1 first. */
  rankByContribution: number | null;
  /** Variables with evidence this month. */
  knownCount: number;
}

/**
 * Ranks the variables of one month and locates the one being read.
 *
 * Variables without evidence sink to the bottom and take no rank: they are
 * unmeasured, not the weakest.
 *
 * @param variables - Variable metadata from the export.
 * @param pillars - Pillar metadata from the export.
 * @param point - Month to read; `null` renders every variable as unknown.
 * @param variableKey - Variable whose page is open.
 * @returns The ranked peers and the two ranks of the variable.
 */
export function buildVariableStanding(
  variables: readonly PulseVariableMeta[],
  pillars: readonly PulsePillarMeta[],
  point: PulseSeriesPoint | null,
  variableKey: string,
): PulseVariableStanding {
  const pillarLabels = new Map(pillars.map((item) => [item.key, item.label]));
  const peers: PulseVariablePeer[] = variables
    .map((variable) => {
      const value = point?.variables[variable.key];
      const known = value?.known === true && value.score !== null;
      return {
        key: variable.key,
        label: variable.label,
        pillarKey: variable.pillar,
        pillarLabel: pillarLabels.get(variable.pillar) ?? variable.pillar,
        weight: variable.weight,
        score: known ? value.score : null,
        contribution: known
          ? (point?.contributions[variable.key] ?? null)
          : null,
        known,
        current: variable.key === variableKey,
      };
    })
    .sort((a, b) => {
      if (a.known !== b.known) return a.known ? -1 : 1;
      return (b.score ?? 0) - (a.score ?? 0) || b.weight - a.weight;
    });
  const known = peers.filter((peer) => peer.known);
  const byContribution = [...known].sort(
    (a, b) => (b.contribution ?? 0) - (a.contribution ?? 0),
  );
  const scoreIndex = known.findIndex((peer) => peer.current);
  const pointsIndex = byContribution.findIndex((peer) => peer.current);
  return {
    peers,
    rankByScore: scoreIndex === -1 ? null : scoreIndex + 1,
    rankByContribution: pointsIndex === -1 ? null : pointsIndex + 1,
    knownCount: known.length,
  };
}
