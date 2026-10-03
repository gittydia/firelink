"""Separate genuine multi-price detection artifacts from pre-existing label collapse.

A conflict is only a DEFECT of the new row x column emission if both colliding
entries come from the SAME table: that means the extractor invented two price
columns where the deck has one. Conflicts spread across tables are the deck
reusing a label for distinct real products -> a pre-existing identity limit,
not a regression.
"""
import csv
from collections import defaultdict
from pathlib import Path

NEW = Path("pricelist_cleaned/normalized/pricelist_entries.csv")
OLD = Path(r"C:\Users\Admin\AppData\Local\Temp\opencode\pricelist_baseline\pricelist_entries.csv")


def load(p):
    with p.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


new, old = load(NEW), load(OLD)


def conflicts(rows, keyf):
    g = defaultdict(list)
    for r in rows:
        g[keyf(r)].append(r)
    return {k: rs for k, rs in g.items() if len({x["unit_price"] for x in rs}) > 1}


# Comparable basis: the baseline has no series/source_column columns at all.
k2 = lambda r: (r["product"], r["size"])
c_old, c_new = conflicts(old, k2), conflicts(new, k2)

print("=" * 70)
print("A) MULTI-PRICE REGRESSION TEST  (key = product + size, both runs)")
print("=" * 70)
print(f"baseline : {len(old)} rows, {len(c_old)} conflicting keys")
print(f"current  : {len(new)} rows, {len(c_new)} conflicting keys")
print(f"conflicts present now but NOT in baseline : {len(set(c_new) - set(c_old))}")
print(f"conflicts present in baseline but gone now : {len(set(c_old) - set(c_new))}")

# A key is "newly conflicting" only if it was single-priced or absent before.
old_price = {}
for r in old:
    old_price.setdefault(k2(r), set()).add(r["unit_price"])

truly_new = {}
for k, rs in c_new.items():
    prev = old_price.get(k, set())
    if not (prev & {x["unit_price"] for x in rs}):
        truly_new[k] = rs

print(f"keys that gained a CONTRADICTORY price vs baseline: {len(truly_new)}")

# B) within-table collisions = real detection artifacts
k3 = lambda r: (r["product"], r["size"], r["series"])
within = {}
for k, rs in conflicts(new, k3).items():
    if len({(x["source_slide"], x["source_table"]) for x in rs}) == 1:
        within[k] = rs

print()
print("=" * 70)
print(f"B) WITHIN-TABLE COLLISIONS (invented price columns): {len(within)}")
print("=" * 70)
for k, rs in sorted(within.items(), key=lambda kv: (kv[0][0], kv[0][1])):
    tbl = {(x["source_slide"], x["source_table"]) for x in rs}
    t = next(iter(tbl))
    cols = sorted({int(x["source_column"]) for x in rs})
    print(f"  S{t[0]}-T{t[1]}  product={k[0][:38]!r} size={k[1]!r} series={k[2]!r}")
    print(f"      cols={cols}  prices={[x['unit_price'] for x in rs]}")
    print(f"      rows={sorted(int(x['source_row']) for x in rs)}")

# C) columns in one table sharing a series label -> repeated header block
print()
print("=" * 70)
print("C) TABLES WHERE ONE SERIES LABEL APPEARS IN 2+ COLUMNS")
print("=" * 70)
tab = defaultdict(lambda: defaultdict(set))
for r in new:
    if r["series"]:
        tab[(r["source_slide"], r["source_table"])][r["series"]].add(int(r["source_column"]))
dupes = {t: s for t, s in tab.items() if any(len(c) > 1 for c in s.values())}
for t in sorted(dupes, key=lambda x: (int(x[0]), int(x[1]))):
    bad = {s: sorted(c) for s, c in dupes[t].items() if len(c) > 1}
    print(f"  S{t[0]}-T{t[1]}: {bad}")
print(f"  total tables with a repeated series label: {len(dupes)}")

# D) series that is actually a product name / non-series header
print()
print("=" * 70)
print("D) SERIES LABELS THAT EQUAL THE PRODUCT LABEL")
print("=" * 70)
same = {(r["source_slide"], r["source_table"], r["series"]) for r in new
        if r["series"] and r["series"].strip() == r["product"].strip()}
for s in sorted(same, key=lambda x: (int(x[0]), int(x[1]))):
    print(f"  S{s[0]}-T{s[1]}: series==product=={s[2]!r}")
print(f"  total: {len(same)}")
