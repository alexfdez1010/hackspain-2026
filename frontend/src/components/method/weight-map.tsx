'use client';

import { useMemo, useState } from 'react';

import { MethodVariableDetail } from '@/components/method/variable-detail';
import { MethodWeightTreemap } from '@/components/method/weight-treemap';
import { buildWeightMap } from '@/lib/method/weights';
import type { PulsePillarMeta, PulseVariableMeta } from '@/lib/pulse/types';

interface MethodWeightMapProps {
  pillars: readonly PulsePillarMeta[];
  variables: readonly PulseVariableMeta[];
}

/**
 * The anatomy of the 100 points: a treemap of the four pillars and the eleven
 * variables, with the detail of whichever one the reader is pointing at.
 *
 * Weights come from the export, never from this page, so the drawing cannot
 * contradict the specification the backend applies.
 *
 * @param props - Pillar and variable metadata from the export.
 * @returns The treemap next to its detail panel.
 */
export function MethodWeightMap({ pillars, variables }: MethodWeightMapProps) {
  const map = useMemo(
    () =>
      buildWeightMap(pillars, variables, {
        width: 720,
        height: 300,
        columnGap: 6,
        rowGap: 4,
      }),
    [pillars, variables],
  );
  const [selected, setSelected] = useState(map.segments[0]?.key ?? '');
  const active =
    map.segments.find((segment) => segment.key === selected) ??
    map.segments[0] ??
    null;

  if (!active) {
    return (
      <p className="text-sm text-muted">
        El export no publica las variables del score.
      </p>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-10">
      <div className="overflow-x-auto">
        <div className="min-w-[32rem]">
          <MethodWeightTreemap
            map={map}
            selectedKey={active.key}
            onSelect={setSelected}
          />
        </div>
      </div>
      <MethodVariableDetail segment={active} total={map.totalWeight} />
    </div>
  );
}
