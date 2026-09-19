import { Chip } from '@heroui/react';

import {
  DIRECTION_LABELS,
  REGIME_HINTS,
  REGIME_LABELS,
  directionColor,
  regimeColor,
} from '@/lib/xray/score';
import type { Direction, Regime } from '@/lib/xray/types';

interface DirectionTagProps {
  direction: Direction;
}

/**
 * Shows the six-month trajectory of a company.
 *
 * @param props - The detected direction.
 * @returns A coloured chip with the Spanish label.
 */
export function DirectionTag({ direction }: DirectionTagProps) {
  return (
    <Chip color={directionColor(direction)} variant="soft" size="sm">
      <Chip.Label>{DIRECTION_LABELS[direction]}</Chip.Label>
    </Chip>
  );
}

interface RegimeTagProps {
  regime: Regime;
}

/**
 * Shows whether a movement is a passing dip or a structural change of level.
 *
 * @param props - The detected regime.
 * @returns A coloured chip whose tooltip explains the regime.
 */
export function RegimeTag({ regime }: RegimeTagProps) {
  return (
    <Chip
      color={regimeColor(regime)}
      variant="soft"
      size="sm"
      title={REGIME_HINTS[regime]}
    >
      <Chip.Label>{REGIME_LABELS[regime]}</Chip.Label>
    </Chip>
  );
}
