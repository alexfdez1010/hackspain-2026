"""Accumulates what each cleaning step removed or nulled, for the audit trail."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class Step:
    """One cleaning action and its footprint."""

    table: str
    rule: str
    affected: int
    total: int
    note: str = ""

    @property
    def share(self) -> float:
        return self.affected / self.total if self.total else 0.0


@dataclass
class CleaningReport:
    """Ordered list of cleaning steps plus free-form summary values."""

    steps: list[Step] = field(default_factory=list)
    facts: dict[str, float | int | str] = field(default_factory=dict)

    def add(
        self, table: str, rule: str, affected: int, total: int, note: str = ""
    ) -> None:
        self.steps.append(Step(table, rule, int(affected), int(total), note))

    def to_dict(self) -> dict:
        return {
            "steps": [
                {
                    "table": s.table,
                    "rule": s.rule,
                    "affected": s.affected,
                    "total": s.total,
                    "share": round(s.share, 5),
                    "note": s.note,
                }
                for s in self.steps
            ],
            "facts": self.facts,
        }

    def to_markdown(self) -> str:
        lines = [
            "| table | rule | affected | of | share | note |",
            "|---|---|---|---|---|---|",
        ]
        for s in self.steps:
            lines.append(
                f"| {s.table} | {s.rule} | {s.affected:,} | {s.total:,} | {s.share:.2%} | {s.note} |"
            )
        if self.facts:
            lines += ["", "| fact | value |", "|---|---|"]
            lines += [f"| {k} | {v} |" for k, v in self.facts.items()]
        return "\n".join(lines)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=1, ensure_ascii=False))
        path.with_suffix(".md").write_text(self.to_markdown())
