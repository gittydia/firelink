"""Regenerate the evidence behind ADR-016's `BARE_INTEGER_SIZE_FLOOR = 30`.

The floor is a heuristic over one workbook, so its evidence belongs somewhere a
reviewer can re-run rather than in prose. This script re-runs the real extractor
once per candidate floor and reports what each floor would have done to the rows:

* how many rows are gained, lost, or repriced against the rule being off
* how many bare-integer prices survive in the output
* the distribution of bare-integer prices, with the coordinates of the smallest
* the named probe rows the decision rests on

Read-only openpyxl worksheets are single-pass streams, so each candidate floor
gets a fresh workbook handle.

Usage:
    python scripts/pricelist/measure_size_price_floor.py
    python scripts/pricelist/measure_size_price_floor.py --json
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import extract_pricelist as xp  # noqa: E402  (needs the path insert above)

BASELINE_FLOOR = 0
ACCEPTED_FLOOR = xp.BARE_INTEGER_SIZE_FLOOR
CANDIDATE_FLOORS = [0, 1, 2, 3, 5, 10, 20, 30, 31, 50, 100, 1000]

PROBES = [
    (53, 9, 1),
    (53, 10, 2),
    (53, 13, 3),
    (20, 7, 2),
    (51, 2, 1),
    (51, 2, 2),
    (51, 2, 3),
    (51, 2, 4),
    (51, 2, 5),
]


def bare_integer_price(text: str) -> Decimal | None:
    """Return a bare-integer money reading, or None if the text is not one.

    Mirrors the comma/decimal test in `xp.parse_money` minus the floor, so the
    population measured here is exactly the population the floor may act on.
    """
    candidate = xp.clean(text)
    match = xp.MONEY_RE.match(candidate)
    if not match:
        return None
    digits = match.group("num")
    if "," in digits or "." in digits:
        return None
    return Decimal(digits)


def run_floor(workbook: Path, floor: int) -> dict:
    """Re-extract the workbook at one candidate floor."""
    import openpyxl

    xp.BARE_INTEGER_SIZE_FLOOR = floor
    wb = openpyxl.load_workbook(workbook, data_only=True, read_only=True)
    try:
        entries, quarantine, _stats = xp.extract(wb)
    finally:
        wb.close()

    return {
        "floor": floor,
        "prices": {
            (e.source_slide, e.source_table, e.source_row): e.unit_price
            for e in entries
        },
        "quarantined": {(q.slide, q.table_index, q.row) for q in quarantine},
        "reasons": {(q.slide, q.table_index, q.row): q.reason for q in quarantine},
    }


def price_column_distribution(prices: dict) -> tuple[Counter, dict]:
    """Tally emitted bare-integer prices by value, and keep the first location.

    Derived from an extract run rather than a second pass over the workbook, so
    the measurement and the accepted output cannot drift apart.
    """
    tally: Counter = Counter()
    first_seen: dict = {}
    for key in sorted(prices):
        value = bare_integer_price(prices[key] or "")
        if value is None:
            continue
        tally[value] += 1
        first_seen.setdefault(value, key)
    return tally, first_seen


def surviving_false_prices(prices: dict) -> int:
    """Emitted prices that are bare integers below the accepted floor.

    These are the readings the rule exists to prevent: a dimension written into
    the price column. A value equal to the floor is treated as a price.
    """
    count = 0
    for price in prices.values():
        value = bare_integer_price(price or "")
        if value is not None and value < ACCEPTED_FLOOR:
            count += 1
    return count


def describe(result: dict, key: tuple) -> str:
    if key in result["prices"]:
        return f"price={result['prices'][key]}"
    if key in result["quarantined"]:
        return f"quar:{result['reasons'][key]}"
    return "absent"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbook", type=Path, default=xp.DEFAULT_WORKBOOK)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if not args.workbook.exists():
        raise SystemExit(f"workbook not found: {args.workbook}")

    results = [run_floor(args.workbook, floor) for floor in CANDIDATE_FLOORS]
    base = next(r for r in results if r["floor"] == BASELINE_FLOOR)
    base_keys = set(base["prices"])

    tally, first_seen = price_column_distribution(base["prices"])

    payload = {
        "workbook": str(args.workbook),
        "accepted_floor": ACCEPTED_FLOOR,
        "baseline_floor": BASELINE_FLOOR,
        "candidate_floors": CANDIDATE_FLOORS,
        "distribution": {
            "price_column_bare_integer_rows": sum(tally.values()),
            "distinct_values": len(tally),
            "rows_below_accepted_floor": sum(
                n for v, n in tally.items() if v < ACCEPTED_FLOOR
            ),
            "smallest": [
                {
                    "value": str(v),
                    "rows": tally[v],
                    "first_at": list(first_seen[v]),
                }
                for v in sorted(tally)[:10]
            ],
        },
        "candidates": [],
        "probes": [],
    }

    for result in results:
        floor = result["floor"]
        prices = result["prices"]
        keys = set(prices)
        gained = sorted(keys - base_keys)
        lost = sorted(base_keys - keys)
        repriced = sorted(k for k in keys & base_keys if prices[k] != base["prices"][k])
        payload["candidates"].append(
            {
                "floor": floor,
                "entries": len(prices),
                "quarantined": len(result["quarantined"]),
                "gained": len(gained),
                "lost": len(lost),
                "repriced": len(repriced),
                "false_bare_integer_prices": surviving_false_prices(prices),
                "price_column_rows_below_floor": sum(
                    n for v, n in tally.items() if v < floor
                ),
                "lost_rows": [list(k) for k in lost],
                "gained_rows": [list(k) for k in gained],
                "repriced_rows": [list(k) for k in repriced],
            }
        )

    for key in PROBES:
        payload["probes"].append(
            {
                "slide": key[0],
                "table": key[1],
                "row": key[2],
                "by_floor": {str(r["floor"]): describe(r, key) for r in results},
            }
        )

    if args.json:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    dist = payload["distribution"]
    print(f"workbook: {args.workbook}")
    print(f"baseline (floor {BASELINE_FLOOR}): {len(base['prices'])} entries")
    print(
        f"price-column bare-integer prices: {dist['price_column_bare_integer_rows']} "
        f"rows across {dist['distinct_values']} distinct values"
    )
    print(f"bare-integer prices below {ACCEPTED_FLOOR}: {dist['rows_below_accepted_floor']}")
    print("smallest bare-integer prices (value x rows @ first location):")
    for row in dist["smallest"]:
        slide, table, trow = row["first_at"]
        print(f"  {row['value']:>6} x{row['rows']:<4} S{slide} T{table} r{trow}")
    print()
    false_label = f"false<{ACCEPTED_FLOOR}"
    print(
        f"{'floor':>6} {'entries':>8} {'quar':>5} {'gained':>7} {'lost':>5} "
        f"{'repriced':>9} {false_label:>12} {'rows<floor':>11}"
    )
    for c in payload["candidates"]:
        print(
            f"{c['floor']:>6} {c['entries']:>8} {c['quarantined']:>5} "
            f"{c['gained']:>7} {c['lost']:>5} {c['repriced']:>9} "
            f"{c['false_bare_integer_prices']:>12} "
            f"{c['price_column_rows_below_floor']:>11}"
        )
    print()
    seen = sorted({r["floor"] for r in results})
    print(f"{'probe row':<16}" + "".join(f"{f:>34}" for f in seen))
    for probe in payload["probes"]:
        label = f"S{probe['slide']} T{probe['table']} r{probe['row']}"
        print(
            f"{label:<16}"
            + "".join(f"{probe['by_floor'][str(f)]:>34}" for f in seen)
        )


if __name__ == "__main__":
    main()
