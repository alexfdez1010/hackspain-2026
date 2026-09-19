'use client';

import { useMemo, useState } from 'react';

import { MethodVariableDetail } from '@/components/method/variable-detail';
import { MethodWeightRows } from '@/components/method/weight-rows';
import { MethodWeightTreemap } from '@/components/method/weight-treemap';
import { buildWeightMap, stackWeightMap } from '@/lib/method/weights';
import { HEAT_MAP_SIZE } from '@/lib/pulse/heat-map';
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
 * contradict the specification the backend applies. Wide screens get the
 * pillars as columns; under `md` the same cells are laid out as rows, so the
 * map fits a phone without scrolling sideways.
 *
 * @param props - Pillar and variable metadata from the export.
 * @returns The treemap over its detail panel.
 */
export function MethodWeightMap({ pillars, variables }: MethodWeightMapProps) {
  const map = useMemo(
    () => buildWeightMap(pillars, variables, HEAT_MAP_SIZE),
    [pillars, variables],
  );
  const stacked = useMemo(() => stackWeightMap(map), [map]);
  const [selected, setSelected] = useState(map.segments[0]?.key ?? '');
  const active =
    map.segments.find((segment) => segment.key === selected) ??
    map.segments[0] ??
    null;

  if (!active) {
    return (
      <p className="text-[15px] leading-[1.55] text-ink-secondary">
        El export no publica las variables del score.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[48rem] lg:min-w-0">
          <MethodWeightTreemap
            map={map}
            selectedKey={active.key}
            onSelect={setSelected}
          />
        </div>
      </div>
      <div className="md:hidden">
        <MethodWeightRows
          map={stacked}
          selectedKey={active.key}
          onSelect={setSelected}
        />
      </div>
      <MethodVariableDetail segment={active} total={map.totalWeight} />
    </div>
  );
}
