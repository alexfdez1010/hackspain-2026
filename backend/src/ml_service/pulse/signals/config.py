"""Thresholds of the signal detector and the persistence model."""

from __future__ import annotations

# Months averaged to build the baseline a month is compared against.
BASELINE_MONTHS = 3
# Points of PULSE away from the baseline that count as a real move.
MIN_MOVE = 6.0
# Points a pillar must move, in the same direction, to count towards breadth.
PILLAR_MOVE = 3.0
# Pillars that must move together; one pillar alone is treated as noise.
MIN_BREADTH = 2
# Months of follow-up needed to call the episode persistent or transitory.
FOLLOW_UP_MONTHS = 3
# Points of tolerance when checking whether the score came back to its baseline.
RECOVERY_TOLERANCE = 3.0
# Probability of persistence from which a fall is called «caída» (else «bache»).
PERSISTENT_THRESHOLD = 0.5
# Anticipation curve: furthest horizon and the share of companies an alert flags.
MAX_HORIZON = 6
ALERT_SHARE = 0.2
# Clean months: no stress in this many months up to and including the month scored.
CLEAN_MONTHS = 3
