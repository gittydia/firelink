"""Integrity gate for Option B: can (product, size, series) key a variant?

A repeated header inside one grid makes the extractor see N columns where the
deck really stacks a second table. That yields two entries with identical
(product, size, series) but different prices -> no unique sku.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

NEW = Path("pricelist_cleaned/normalized")

rows = list(csv.DictReader((NEW / "pricelist_entries.csv").open(encoding="utf-8")))

key = defaultdict(list)
for r in rows:
    k = (r["product"], r["size"], r["series"])
    key[k].append(r)

conflicts = {}
for k, rs in key.items():
    prices = {x["unit_price"] for x in rs}
    if len(prices) > 1:
        conflicts[k] = rs

print("=" * 74)
print(f"total entries                 : {len(rows)}")
print(f"distinct (product,size,series): {len(key)}")
print(f"KEYS WITH CONFLICTING PRICES  : {len(conflicts)}")
print("=" * 74)

by_table = defaultdict(int)
for k, rs in conflicts.items():
    for x in rs:
        by_table[(x["source_slide"], x["source_table"])] += 1

print("affected tables:")
for t in sorted(by_table, key=lambda x: (int(x[0]), int(x[1]))):
    print(f"   S{t[0]}-T{t[1]}: {by_table[t] / 2:.0f} conflicting keys")

print()
print("=" * 74)
print("ALL CONFLICTING KEYS (a variant cannot be priced from these)")
print("=" * 74)
for k, rs in sorted(conflicts.items(), key=lambda kv: kv[0][0]):
    prices = [x["unit_price"] for x in rs]
    locs = [f"S{x['source_slide']}-T{x['source_table']}:c{x['source_column']}" for x in rs]
    print(f"  {k[0][:44]!r} size={k[1]!r} series={k[2]!r}")
    print(f"      prices={prices}  at={locs}")

# Same size+series, same price, duplicated -> harmless duplicate rows, not
# a pricing contradiction, but still breaks a unique-sku import.
harmless = 0
for k, rs in key.items():
    if len(rs) > 1 and k not in conflicts:
        harmless += 1
print()
print(f"duplicate keys with IDENTICAL price (redundant, not contradictory): {harmless}")
