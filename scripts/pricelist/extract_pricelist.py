"""Extract normalized price entries from the cleaned January 2026 pricelist workbook.

The deck is a wholesale list built as PowerPoint tables, not a data model, and no
single field is a reliable product key:

* A table's first cell is often the product family (slide 1 "Black Iron Pipe"),
  but just as often a bare rating (slides 30-50 are all "25 HP", "30 HP", ...) or
  a size (slide 12 "50 LBS").
* Slide titles are reliable for homogeneous slides (the pump specs) and actively
  wrong for mixed ones -- slide 5 is titled "Butterfly Valve with Tamper Switch"
  yet also sells hydrants.
* Roughly 25 tables carry no usable label and must inherit context.

So each table's product is *resolved*: use the table's own label when it is
descriptive, otherwise inherit the nearest descriptive label earlier on the same
slide, otherwise fall back to the slide title. Every fallback is recorded in
`product_source` so a reviewer can see exactly how weak an entry is. No product
label is ever invented -- the extractor only reads what the workbook contains.

Classification follows the same rule: an explicit per-table/per-slide map derived
from the labels actually found in this workbook, with a keyword classifier as the
fallback. Anything undecided is emitted as "Unclassified" with NEEDS_REVIEW
rather than being forced into a category.

Parsing is deliberately tolerant: anything that cannot be read with confidence is
written to a quarantine file instead of being guessed. Re-running this script
against a corrected source workbook will replace the quarantined rows.

Usage:
    python scripts/pricelist/extract_pricelist.py
    python scripts/pricelist/extract_pricelist.py --workbook <path.xlsx> --outdir <dir>
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path

DEFAULT_WORKBOOK = Path(
    "pricelist_cleaned/PRICELIST-JANUARY-2026_CLEANED_EXTRACTION.xlsx"
)
DEFAULT_OUTDIR = Path("pricelist_cleaned/normalized")

# U+FFFD is the replacement character left behind by the lossy PPTX text
# extraction. Any label carrying it is a broken glyph, not a real character, so a
# size like "2 \ufffd\ufffd''" cannot be safely expanded to "2-1/2"".
REPLACEMENT_CHAR = "\ufffd"

CATEGORIES = [
    "Pipes & Fittings",
    "Valves",
    "Couplings, Nozzles & Monitors",
    "Fire Hoses & Reels",
    "Sprinkler Heads & Nozzles",
    "Fire Alarm & Detection",
    "Fire Extinguishers & Agents",
    "Fire Hydrants",
    "Water Meters & Tank Fittings",
    "Instruments & Gauges",
    "Fire Pumps & Pump Sets",
    "Water Transfer Pumps",
    "Pumps & Motors",
    "Electrical",
    "Hardware & Fasteners",
    "Tools, Equipment & PPE",
]

UNCLASSIFIED = "Unclassified"

# Slides that sell nothing: slide 56 is the terms & conditions schedule, whose
# PCS/CTN, CTNS and QTY/pcs columns are carton packing data and must never be
# read as warehouse stock.
NON_PRODUCT_SLIDES = {56}

# Money as printed in the deck: optional currency word, thousands separators,
# optional trailing decimals. Bare integers are accepted because the deck mixes
# "12,500" and "12,500.00" across slides.
MONEY_RE = re.compile(
    r"^(?:PHP\s*)?"
    r"(?P<num>\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)"
    r"(?:\s*\.00)?$",
    re.IGNORECASE,
)

# A bare integer below this value is a dimension, not a price.
#
# Evidence from PRICELIST-JANUARY-2026_CLEANED_EXTRACTION.xlsx, re-runnable via
# `python scripts/pricelist/measure_size_price_floor.py`: of the 954 rows the
# extractor emits, 714 carry a bare-integer price. Exactly three of those sit
# below 30 -- 1, 2 and 2 -- all from the slide 53 conduit schedule (T10/T9/T13),
# a size list whose price column is missing. The next smallest is a genuine 30
# (S13 T5 r2). Every floor from 3 to 30 gives an identical result: 951 rows, 54
# quarantined, 0 gained, exactly 3 lost. 30 is the largest value in that range,
# so it is the floor; 31 would begin rejecting the genuine 30. Slide 53 T12
# prices those same sizes ("1 1/4" -> 75.00, "1 1/2" -> 102.00, "2" -> 140.00),
# which proves the bare integers alongside them are inch sizes rather than
# peso amounts.
#
# This is a floor on the *bare integer* form only. Small prices do exist in this
# workbook, but they are always printed with decimals (15.00, 20.00, 25.00 on
# slide 53), so they are unaffected. Legitimate bare-integer prices all sit far
# above the floor: 105, 143, 215, 430 (S51 T2) and 1000 (S20 T7).
BARE_INTEGER_SIZE_FLOOR = 30

# Labels that introduce a price row without describing a size or item.
HEADER_TOKENS = {
    "INCHES", "INCH", "SIZE", "NET PRICE", "PRICE", "PRICE...", "QTY", "QUANTITY",
    "BRAND", "BRANDS", "SPECIFICATION", "SPEC", "MODEL", "REMARKS", "UNIT", "PCS/CTN",
    "CTNS", "QTY/PCS", "DESCRIPTION", "TYPE", "EACH", "LENGTH", "ITEM", "LBS",
}

# A bare measurement/rating is never a product name on its own.
RATING_RE = re.compile(
    r"^\d+(?:\.\d+)?\s*-?\s*(?:HP|KW|PSI|BAR|LBS|LB|KG|MM|CM|M|FT|GPM|LPM|V|"
    r"HZ|AMPS?|A)\b",
    re.IGNORECASE,
)
SIZE_ONLY_RE = re.compile(r"^[\d\s.,/\-'\u00bc\u00bd\u00be\u2013\u2014\"'']+$")

# Real fractional inch sizes only ever use a small numerator and a power-of-two
# denominator. That is what separates a real size ("1-1/2\"", "2 1/2") from a pair
# of prices printed in adjacent cells ("650/ 495").
FRACTION_RE = re.compile(
    r"\d{1,2}\s*-\s*\d{1,2}\s*/\s*\d{1,2}|\b\d{1,2}\s*/\s*(?:2|4|8|16|32)\b"
)

# Brand tokens seen inside product labels; used only to populate the brand
# column, never to decide a category.
BRAND_HINTS = [
    "purity", "streamplus", "winter", "kits", "giacomini", "goulds", "danfoss",
    "mazaki", "hcfclo", "hcfc", "hyflo", "eaton", "cutler hammer", "cutler-hammer",
    "clinton", "woltman", "kennedy", "potter", "tewa", "craft", "haishen",
    "tyco", "eastop", "mech", "global vision", "royal pacific",
]

# ---------------------------------------------------------------------------
# Category maps derived from the table labels actually present in this workbook.
# Mixed slides need per-table precision; homogeneous slides need only a slide
# rule. Anything absent here falls through to KEYWORD_RULES.
# ---------------------------------------------------------------------------

MIXED_TABLE_CATEGORY: dict[tuple[int, int], str] = {
    # Slide 4: grooved alarm-check assemblies, an exit sign, and extinguisher
    # agents, all sitting under a "Butterfly Valve" title.
    (4, 1): "Valves",
    (4, 2): "Valves",
    (4, 3): "Fire Alarm & Detection",
    (4, 4): "Valves",
    (4, 5): "Valves",
    (4, 6): "Fire Extinguishers & Agents",
    (4, 7): "Fire Extinguishers & Agents",
    (4, 8): "Fire Extinguishers & Agents",
    # Slide 5: butterfly valves (T1-T7) plus three hydrant tables.
    **{(5, i): "Valves" for i in range(1, 8)},
    (5, 8): "Fire Hydrants",
    (5, 9): "Fire Hydrants",
    (5, 10): "Fire Hydrants",
    # Slide 8: gate valves, an air gauge, and two water-meter tables.
    (8, 1): "Valves",
    (8, 2): "Valves",
    (8, 3): "Valves",
    (8, 4): "Instruments & Gauges",
    (8, 5): "Water Meters & Tank Fittings",
    (8, 6): "Water Meters & Tank Fittings",
    # Slide 9: check valve, flange adaptor, two hydrants, a water monitor.
    (9, 1): "Valves",
    (9, 2): "Pipes & Fittings",
    (9, 3): "Valves",
    (9, 4): "Fire Hydrants",
    (9, 5): "Couplings, Nozzles & Monitors",
    (9, 6): "Valves",
    (9, 7): "Fire Hydrants",
    (9, 8): "Pipes & Fittings",
    # Slide 10: hydrant, CLA-VAL relief valve, inspector-test assemblies.
    (10, 1): "Fire Hydrants",
    (10, 2): "Valves",
    (10, 3): "Valves",
    (10, 4): "Valves",
    (10, 5): "Valves",
    # Slide 12: extinguisher agents and CO2, HYFLO hoses, and a water meter.
    (12, 1): "Fire Extinguishers & Agents",
    (12, 2): "Fire Extinguishers & Agents",
    (12, 3): "Fire Extinguishers & Agents",
    **{(12, i): "Fire Hoses & Reels" for i in range(4, 9)},
    (12, 9): "Fire Extinguishers & Agents",
    (12, 10): "Fire Extinguishers & Agents",
    (12, 11): "Water Meters & Tank Fittings",
    # Slide 13: sprinkler pendents and a plate-only spare.
    **{(13, i): "Sprinkler Heads & Nozzles" for i in range(1, 9)},
    # Slide 14: sprinkler brands.
    **{(14, i): "Sprinkler Heads & Nozzles" for i in range(1, 6)},
    # Slide 16: grooved couplings under a hose-connection title.
    **{(16, i): "Couplings, Nozzles & Monitors" for i in range(1, 16)},
    # Slide 17: couplings, plastic nozzles, a fire ball, and a fire axe.
    **{(17, i): "Couplings, Nozzles & Monitors" for i in range(1, 10)},
    (17, 10): "Tools, Equipment & PPE",
    # Slide 18: hose accessories mixed with hose/angle/gate/inspector valves.
    (18, 1): "Couplings, Nozzles & Monitors",
    (18, 2): "Couplings, Nozzles & Monitors",
    (18, 3): "Valves",
    (18, 4): "Valves",
    (18, 5): "Valves",
    (18, 6): "Couplings, Nozzles & Monitors",
    (18, 7): "Couplings, Nozzles & Monitors",
    (18, 8): "Couplings, Nozzles & Monitors",
    **{(18, i): "Valves" for i in range(9, 14)},
    # Slide 19: sprinkler sprays, angle valves, and a fire department connection
    # plus water flow switch.
    (19, 1): "Sprinkler Heads & Nozzles",
    (19, 2): "Sprinkler Heads & Nozzles",
    (19, 3): "Valves",
    (19, 4): "Valves",
    **{(19, i): "Fire Alarm & Detection" for i in range(5, 9)},
    # Slides 20-21: hoses, hose cabinets and hose racks.
    **{(20, i): "Fire Hoses & Reels" for i in range(1, 12)},
    **{(21, i): "Fire Hoses & Reels" for i in range(1, 23)},
    # Slides 22-23: alarm and detection devices.
    **{(22, i): "Fire Alarm & Detection" for i in range(1, 6)},
    **{(23, i): "Fire Alarm & Detection" for i in range(1, 7)},
    # Slide 24: fire pump sets, controllers, jockey pump, inverters.
    **{(24, i): "Fire Pumps & Pump Sets" for i in range(1, 8)},
    # Slide 25: tank fittings plus two instrument/tool tables.
    (25, 1): "Water Meters & Tank Fittings",
    (25, 2): "Water Meters & Tank Fittings",
    (25, 3): "Water Meters & Tank Fittings",
    (25, 4): "Water Meters & Tank Fittings",
    (25, 5): "Tools, Equipment & PPE",
    (25, 6): "Instruments & Gauges",
    (25, 7): "Water Meters & Tank Fittings",
    # Slide 26: flexible connections and grooved couplings.
    **{(26, i): "Couplings, Nozzles & Monitors" for i in range(1, 13)},
    # Slides 51-52: hangers, U-bolts, anchors, bolts, nuts, washers.
    **{(51, i): "Hardware & Fasteners" for i in range(1, 8)},
    **{(52, i): "Hardware & Fasteners" for i in range(1, 7)},
    # Slide 53: electrical fittings, boxes, conduit, clamps.
    **{(53, i): "Electrical" for i in range(1, 16)},
    # Slide 54: gasket/wire electrical accessories plus primer and gaskets.
    (54, 1): "Electrical",
    (54, 2): "Electrical",
    (54, 3): "Electrical",
    (54, 4): "Hardware & Fasteners",
    (54, 5): "Hardware & Fasteners",
    # Slide 55: PPE and tools.
    **{(55, i): "Tools, Equipment & PPE" for i in range(1, 11)},
    # Slide 57: schedule 40 reducers plus a bladder tank.
    (57, 1): "Pipes & Fittings",
    (57, 2): "Pipes & Fittings",
    (57, 3): "Water Meters & Tank Fittings",
    (57, 4): "Water Meters & Tank Fittings",
    # Slide 58: stainless steel tank.
    (58, 1): "Water Meters & Tank Fittings",
    # Slide 59: hand and power tools.
    **{(59, i): "Tools, Equipment & PPE" for i in range(1, 12)},
}

# Homogeneous slides, applied to any table not covered above.
SLIDE_CATEGORY: dict[int, str] = {
    1: "Pipes & Fittings",
    2: "Valves",
    3: "Valves",
    6: "Valves",
    7: "Valves",
    11: "Valves",
    15: "Valves",
    27: "Water Transfer Pumps",
    28: "Water Transfer Pumps",
    29: "Pumps & Motors",
    **{i: "Fire Pumps & Pump Sets" for i in range(30, 51)},
}

# Ordered most-specific first: the first hit wins.
KEYWORD_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("Fire Hoses & Reels", ("fire hose", "hose rack", "key cabinet", "hose reel", "hyflo hose")),
    ("Fire Hydrants", ("hydrant",)),
    ("Couplings, Nozzles & Monitors", (
        "coupling", "nozzle", "monitor", "snoot", "nipple", "hose valve", "adapter",
        "adaptor", "flange", "connector", "double ll", "flexible connector",
    )),
    ("Fire Extinguishers & Agents", ("extinguisher", "hcfc", "co2", "agent", "ceiling")),
    ("Fire Alarm & Detection", (
        "detector", "pull station", "control panel", "module", "exit sign", "bell",
        "horn", "strobe", "flow switch", "fdc", "telephone", "beam",
    )),
    ("Sprinkler Heads & Nozzles", ("sprinkler", "pendent", "bulb", "spray", "plate only")),
    ("Instruments & Gauges", ("gauge", "gage", "thermometer", "manifold")),
    ("Water Meters & Tank Fittings", (
        "water meter", "gibault", "tank", "float valve", "waste cone", "pressure switch",
        "bladder", "expansion",
    )),
    ("Pumps & Motors", ("motor", "engine", "diesel")),
    ("Water Transfer Pumps", ("transfer pump", "booster", "centrifugal", "jockey", "multistage")),
    ("Fire Pumps & Pump Sets", ("fire pump", "pump set", "split case", "turbine", "suction", "controller")),
    ("Electrical", ("emt", "conduit", "junction box", "utility box", "electrical", "wire", "primer")),
    ("Hardware & Fasteners", ("hanger", "u-bolt", "u bolt", "bolt", "nut", "washer", "anchor", "gasket")),
    ("Tools, Equipment & PPE", (
        "glove", "gown", "harness", "shoe", "glass", "mask", "brush", "wrench",
        "drill", "grinder", "welder", "welding", "saw", "machine", "dies", "axe",
    )),
    ("Valves", (
        "valve", "check", "gate", "globe", "ball valve", "butterfly", "relief",
        "air release", "tamper",
    )),
    ("Pipes & Fittings", (
        "pipe", "sch. 40", "sch 40", "erw", "reducer", "elbow", "tee", "fitting",
    )),
]


@dataclass
class Quarantine:
    slide: int
    table_index: int
    row: int
    reason: str
    raw_text: str
    context: str


@dataclass
class Entry:
    source_slide: int
    source_table: int
    source_row: int
    category: str
    product: str
    product_source: str
    brand: str | None
    size: str | None
    series: str | None
    source_column: int
    unit: str | None
    unit_price: str | None
    price_high: str | None
    review_status: str
    ambiguity_note: str | None
    raw_text: str


@dataclass
class Stats:
    slides_seen: int = 0
    tables_seen: int = 0
    cells_seen: int = 0
    entries_emitted: int = 0
    rows_skipped_header: int = 0
    rows_skipped_non_product: int = 0
    quarantined: int = 0
    slides_without_tables: list[int] = field(default_factory=list)
    slides_skipped_non_product: list[int] = field(default_factory=list)
    unclassified_tables: list[str] = field(default_factory=list)
    product_label_defects: list[str] = field(default_factory=list)
    multi_price_tables: list[str] = field(default_factory=list)
    repeated_series_tables: list[str] = field(default_factory=list)


def clean(value: object) -> str:
    """Collapse the extraction workbook's spacing and line-break artifacts."""
    if value is None:
        return ""
    text = str(value).replace("\r\n", " ").replace("\n", " ").replace("\r", " ")
    return re.sub(r"\s+", " ", text).strip()


def has_replacement(text: str) -> bool:
    return REPLACEMENT_CHAR in text


def parse_money(text: str) -> Decimal | None:
    candidate = clean(text)
    if not candidate:
        return None
    match = MONEY_RE.match(candidate)
    if not match:
        return None
    digits = match.group("num")
    try:
        value = Decimal(digits.replace(",", ""))
    except InvalidOperation:
        return None
    if "," not in digits and "." not in digits and value < BARE_INTEGER_SIZE_FLOOR:
        return None
    return value


def is_header(text: str) -> bool:
    stripped = clean(text).upper().rstrip(".:").strip()
    if not stripped:
        return True
    return stripped in HEADER_TOKENS


def is_rating(text: str) -> bool:
    return bool(RATING_RE.match(clean(text)))


def has_data_noise(text: str) -> bool:
    """True when a cell mixes a label with row data rather than naming a product.

    PowerPoint table merges leak whole rows into the first cell, so cells like
    "Smoke & Heat | 650" and "25 HP | 33,500" arrive where a product name should
    be. Rejecting them only downgrades the table to inherited/title resolution,
    which is safe; accepting them would write a price into the product name.
    """
    value = clean(text)
    if not value or "|" in value:
        return True
    if re.search(r"\d{1,3}(?:,\d{3})+", value):
        return True
    if re.search(r"\d+\.\d{2}\b", value):
        return True
    return bool(re.search(r"\b\d{3,}\b", FRACTION_RE.sub("", value)))


def is_size_like(text: str) -> bool:
    """A size cell is a measurement, not a word and not money."""
    value = clean(text)
    # "½" is a real half-inch size, not a damaged glyph, so it counts as a digit.
    if not value or not re.search(r"[\d\u00bc\u00bd\u00be]", value):
        return False
    if is_header(value) or parse_money(value) is not None or has_data_noise(value):
        return False
    if is_rating(value) or SIZE_ONLY_RE.match(value):
        return True
    return bool(
        re.search(
            r"""["'\u2033]|inch|mm\b|cm\b|ft\b|psi\b|hp\b|lbs\b|kg\b""",
            value,
            re.IGNORECASE,
        )
    )


def is_descriptive_label(text: str) -> bool:
    """True when a cell can stand on its own as a product name.

    A single token ("HYFLO", "NUT", "DIES") is not descriptive: it is a brand or a
    fragment, and the real product is whatever the slide already established.
    """
    value = clean(text)
    if not value or is_header(value) or is_rating(value) or is_size_like(value):
        return False
    if parse_money(value) is not None or has_data_noise(value):
        return False
    words = [w for w in re.split(r"[\s/\-]+", value) if w]
    if len(words) < 2:
        return False
    return sum(1 for w in words if len(w) >= 3) >= 2


def detect_brand(text: str) -> str | None:
    lowered = clean(text).lower()
    for hint in BRAND_HINTS:
        if hint in lowered:
            return hint.title()
    return None


def classify(resolved_product: str, slide_title: str) -> str:
    haystack = f"{resolved_product} {slide_title}".lower()
    for category, keywords in KEYWORD_RULES:
        if any(k in haystack for k in keywords):
            return category
    return UNCLASSIFIED


# ---------------------------------------------------------------------------
# Workbook reading
# ---------------------------------------------------------------------------

def read_tables(ws) -> dict[tuple[int, int], dict[tuple[int, int], str]]:
    """Group Table_Cells rows into (slide, table_index) grids of raw text."""
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return {}
    header = [str(c) if c is not None else "" for c in rows[0]]
    try:
        i_slide = header.index("slide")
        i_table = header.index("table_index")
        i_row = header.index("row")
        i_col = header.index("column")
        i_value = header.index("value")
    except ValueError as exc:
        raise SystemExit(f"Table_Cells is missing expected columns: {header}") from exc

    grid: dict[tuple[int, int], dict[tuple[int, int], str]] = defaultdict(dict)
    for r in rows[1:]:
        if not r or r[i_slide] is None:
            continue
        grid[(int(r[i_slide]), int(r[i_table]))][(int(r[i_row]), int(r[i_col]))] = (
            "" if r[i_value] is None else str(r[i_value])
        )
    return dict(grid)


def grid_to_rows(cells: dict[tuple[int, int], str]) -> list[list[str]]:
    if not cells:
        return []
    max_row = max(r for r, _ in cells)
    max_col = max(c for _, c in cells)
    return [
        [cells.get((r, c), "") for c in range(1, max_col + 1)]
        for r in range(1, max_row + 1)
    ]


def read_slide_titles(ws) -> dict[int, str]:
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return {}
    header = [str(c) if c is not None else "" for c in rows[0]]
    try:
        i_slide = header.index("slide")
        i_title = header.index("slide_title")
    except ValueError:
        return {}
    return {
        int(r[i_slide]): clean(r[i_title])
        for r in rows[1:]
        if r and r[i_slide] is not None
    }


def table_label(rows: list[list[str]]) -> str:
    """Best own-label for a table, or "" when no cell genuinely names a product.

    There is deliberately no "first non-empty cell" fallback. A table with only
    ratings, sizes, or data-noise cells has no own-label, and returning a rating or
    a leaked row would both pollute the product column and stop the slide's
    nearest real label from being inherited. "" is the honest answer.
    """
    for row in rows[:3]:
        for cell in row:
            value = clean(cell)
            if value and is_descriptive_label(value):
                return value
    return ""


# ---------------------------------------------------------------------------
# Product resolution
# ---------------------------------------------------------------------------

def usable_title(text: str) -> str:
    """A slide title is usable only when it names something rather than leaking a row.

    PowerPoint text extraction folds a table's first data row into the title shape on
    a few slides, yielding titles such as "Telephone jack | 4,950" or "25 HP | 33,500".
    Adopting one as a product name would write a price into the product column, so
    those titles are rejected and the tables fall through to UNRESOLVED. Bare ratings
    are still accepted: the homogeneous pump slides are genuinely titled "25 HP".
    """
    value = clean(text)
    return "" if has_data_noise(value) else value


def resolve_products(
    tables: dict[tuple[int, int], list[list[str]]],
    titles: dict[int, str],
) -> dict[tuple[int, int], tuple[str, str]]:
    """Return (slide, table) -> (product, product_source).

    Order of preference, recorded in product_source:
      own-label        the table names itself
      inherited-label  the table carries only a rating/size; the nearest
                       descriptive label earlier on the same slide applies
      slide-title      nothing descriptive on the slide; the title is the only
                       identity available (correct for the pump spec slides)
    """
    by_slide: dict[int, list[tuple[int, str]]] = defaultdict(list)
    for (slide, table_index), rows in tables.items():
        by_slide[slide].append((table_index, table_label(rows)))

    resolved: dict[tuple[int, int], tuple[str, str]] = {}
    for slide, items in by_slide.items():
        title = usable_title(titles.get(slide, ""))
        last_label = ""
        for table_index, label in sorted(items):
            if label and is_descriptive_label(label):
                resolved[(slide, table_index)] = (label, "own-label")
                last_label = label
            elif last_label:
                resolved[(slide, table_index)] = (last_label, "inherited-label")
            elif title:
                resolved[(slide, table_index)] = (title, "slide-title")
            else:
                resolved[(slide, table_index)] = (
                    f"UNRESOLVED-S{slide}-T{table_index}",
                    "unresolved",
                )
    return resolved


# Two prices printed in one cell ("650/ 495"). FRACTION_RE rejects this shape
# because 495 is not a power-of-two denominator, so it cannot be a size.
PRICE_PAIR_RE = re.compile(
    r"^\d[\d,]*(?:\.\d{1,2})?\s*/\s*\d[\d,]*(?:\.\d{1,2})?$"
)


def is_price_pair(text: str) -> bool:
    """True when one cell prints two prices rather than a size or a single price."""
    value = clean(text)
    if not value or not PRICE_PAIR_RE.match(value):
        return False
    return FRACTION_RE.fullmatch(value) is None


# ---------------------------------------------------------------------------
# Price-column detection
# ---------------------------------------------------------------------------

# Smallest count that separates a real price column from a one-off callout, and
# that still reproduces the old right-edge rule on single-price tables.
PRICE_COLUMN_MIN_ROWS = 2


def column_series(rows: list[list[str]], col: int, first_data_row: int) -> str | None:
    """The header text printed above `col`, if the table gives it one.

    A generic column word is not a series. "NET PRICE" names the kind of number,
    not which series it belongs to, so it is rejected and the entry keeps
    series=None instead of a label that would import as a variant name.
    """
    for r in range(first_data_row - 1, -1, -1):
        if col < len(rows[r]):
            candidate = clean(rows[r][col])
            if (
                candidate
                and not is_header(candidate)
                and parse_money(candidate) is None
                and not is_size_like(candidate)
            ):
                return candidate
    return None


def detect_price_columns(rows: list[list[str]]) -> dict[int, str | None]:
    """Map every genuine price column of one table to its header label.

    The old rule kept only the right-most money cell per row, so a table with
    several price columns (schedule, gauge, series) silently dropped all but
    the last. Counting money per column finds each of them instead. A
    single-price table still yields exactly one column, so its output is
    unchanged; a bare count or callout never qualifies because it is not money.
    """
    counts: dict[int, int] = defaultdict(int)
    for row in rows:
        for i, c in enumerate(row):
            if c and parse_money(c) is not None:
                counts[i] += 1

    candidates = sorted(i for i, n in counts.items() if n >= PRICE_COLUMN_MIN_ROWS)
    if not candidates:
        return {}

    first_data_row = next(
        (
            r
            for r, row in enumerate(rows)
            if any(parse_money(c) is not None for c in row)
        ),
        0,
    )
    return {i: column_series(rows, i, first_data_row) for i in candidates}


def duplicate_series_columns(price_cols: dict[int, str | None]) -> set[int]:
    """Columns whose series label repeats a label seen in an earlier column.

    Slide 30 prints one series over two price columns ("STREAMPLUS or EBSRAY
    AUSTRALIA" in the second and fourth columns), stacking a second header block
    whose prices cannot be attributed to a distinct series. The first (leftmost)
    occurrence of each label keeps its entries; every later column with the same
    label is rejected and the rows carrying money in it are quarantined as
    ambiguous-price-columns rather than emitted as one more entry for the same
    series. Columns with no header label are never repeated blocks: two generic
    price columns (net price for one size) are unlabeled, not stacked.
    """
    first_seen: dict[str, int] = {}
    rejected: set[int] = set()
    for col in sorted(price_cols):
        series = price_cols[col]
        if not series:
            continue
        first = first_seen.setdefault(series, col)
        if first != col:
            rejected.add(col)
    return rejected


# ---------------------------------------------------------------------------
# Row extraction
# ---------------------------------------------------------------------------

def extract(wb) -> tuple[list[Entry], list[Quarantine], Stats]:
    cells_ws = wb["Table_Cells"]
    index_ws = wb["Slide_Index"]
    titles = read_slide_titles(cells_ws)

    tables = read_tables(cells_ws)
    rows_by_table = {key: grid_to_rows(v) for key, v in tables.items()}
    resolved = resolve_products(rows_by_table, titles)

    stats = Stats()
    index_rows = list(index_ws.iter_rows(values_only=True))
    if index_rows:
        header = [str(c) for c in index_rows[0]]
        i_slide = header.index("slide")
        i_tables = header.index("tables")
        for r in index_rows[1:]:
            if r and r[i_slide] is not None:
                stats.slides_seen += 1
                if int(r[i_tables] or 0) == 0:
                    stats.slides_without_tables.append(int(r[i_slide]))

    entries: list[Entry] = []
    quarantine: list[Quarantine] = []

    for (slide, table_index), rows in sorted(rows_by_table.items()):
        if slide in NON_PRODUCT_SLIDES:
            stats.rows_skipped_non_product += sum(
                1 for r in rows if any(clean(c) for c in r)
            )
            if slide not in stats.slides_skipped_non_product:
                stats.slides_skipped_non_product.append(slide)
            continue

        stats.tables_seen += 1
        stats.cells_seen += sum(len(r) for r in rows)
        price_cols = detect_price_columns(rows)
        if len(price_cols) > 1:
            stats.multi_price_tables.append(f"S{slide}-T{table_index}")
        rejected_cols = duplicate_series_columns(price_cols)
        if rejected_cols:
            stats.repeated_series_tables.append(f"S{slide}-T{table_index}")
        product, product_source = resolved.get(
            (slide, table_index),
            (f"UNRESOLVED-S{slide}-T{table_index}", "unresolved"),
        )
        slide_title = titles.get(slide, "")

        category = (
            MIXED_TABLE_CATEGORY.get((slide, table_index))
            or SLIDE_CATEGORY.get(slide)
            or classify(product, slide_title)
        )
        if category == UNCLASSIFIED:
            stats.unclassified_tables.append(f"S{slide}-T{table_index}: {product}")

        label_brand = detect_brand(product)
        if has_replacement(product):
            stats.product_label_defects.append(
                f"S{slide}-T{table_index}: {product}"
            )

        for r_idx, raw_row in enumerate(rows, start=1):
            row = [clean(c) for c in raw_row]
            raw_text = " | ".join(c for c in row if c)
            if not raw_text:
                continue

            # Only this row's own cells matter for multiline detection. Checking
            # the whole table poisons every sibling row when one cell is
            # multiline.
            row_is_multiline = any("\n" in c or "\r" in c for c in raw_row)

            if any(has_replacement(c) for c in row):
                quarantine.append(
                    Quarantine(
                        slide, table_index, r_idx,
                        "replacement-character-in-source", raw_text, product,
                    )
                )
                stats.quarantined += 1
                continue

            if any(is_price_pair(c) for c in row):
                quarantine.append(
                    Quarantine(
                        slide, table_index, r_idx,
                        "price-pair-ambiguous", raw_text, product,
                    )
                )
                stats.quarantined += 1
                continue

            priced = [
                (i, p) for i, c in enumerate(row) if (p := parse_money(c)) is not None
            ]

            if not priced:
                if any(is_size_like(c) for c in row):
                    quarantine.append(
                        Quarantine(
                            slide, table_index, r_idx,
                            "size-without-price", raw_text, product,
                        )
                    )
                    stats.quarantined += 1
                else:
                    stats.rows_skipped_header += 1
                continue

            if rejected_cols and any(i in rejected_cols for i, _ in priced):
                quarantine.append(
                    Quarantine(
                        slide, table_index, r_idx,
                        "ambiguous-price-columns", raw_text, product,
                    )
                )
                stats.quarantined += 1
                continue

            multi = len(price_cols) > 1
            if multi:
                placed = set(price_cols)
                targets = [(i, p) for i, p in priced if i in placed]
                stray = [
                    c
                    for i, c in enumerate(row)
                    if i not in placed and parse_money(c) is not None
                ]
                if stray:
                    quarantine.append(
                        Quarantine(
                            slide, table_index, r_idx,
                            "unassigned-money-cell", raw_text, product,
                        )
                    )
                    stats.quarantined += 1
                    continue
                ignored_cells: list[str] = []
            else:
                targets = [priced[-1]]
                ignored_cells = [
                    c for c in row[: priced[-1][0]] if parse_money(c) is not None
                ]

            size = next(
                (c for c in row if c and is_size_like(c) and parse_money(c) is None),
                None,
            )

            for price_index, price in targets:
                series = price_cols.get(price_index)
                notes: list[str] = []
                if ignored_cells:
                    notes.append(
                        "earlier numeric cell(s) ignored, not price columns: "
                        + ", ".join(ignored_cells)
                    )
                if multi:
                    notes.append(
                        f"price column {price_index}"
                        + (f" ({series})" if series else " (no header)")
                    )
                if size is None:
                    notes.append("no size column")
                if row_is_multiline:
                    notes.append("multiline cell in source row")
                if product_source != "own-label":
                    notes.append(f"product from {product_source}")
                if has_replacement(product):
                    notes.append("replacement character in product label")
                if category == UNCLASSIFIED:
                    notes.append("category undecided")

                status = (
                    "PENDING"
                    if product_source == "own-label" and not notes
                    else "NEEDS_REVIEW"
                )

                entries.append(
                    Entry(
                        source_slide=slide,
                        source_table=table_index,
                        source_row=r_idx,
                        category=category,
                        product=product,
                        product_source=product_source,
                        brand=label_brand,
                        size=size,
                        series=series,
                        source_column=price_index,
                        unit=None,
                        unit_price=str(price),
                        price_high=None,
                        review_status=status,
                        ambiguity_note="; ".join(notes) if notes else None,
                        raw_text=raw_text,
                    )
                )
                stats.entries_emitted += 1

    return entries, quarantine, stats


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def write_outputs(entries, quarantine, stats, outdir: Path) -> None:
    outdir.mkdir(parents=True, exist_ok=True)

    entry_fields = list(asdict(entries[0]).keys()) if entries else []
    if entry_fields:
        with (outdir / "pricelist_entries.csv").open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=entry_fields)
            writer.writeheader()
            for e in entries:
                writer.writerow(asdict(e))

    with (outdir / "pricelist_entries.json").open("w", encoding="utf-8") as fh:
        json.dump([asdict(e) for e in entries], fh, indent=2, ensure_ascii=False)

    with (outdir / "quarantine.csv").open("w", newline="", encoding="utf-8") as fh:
        fields = list(asdict(quarantine[0]).keys()) if quarantine else [
            "slide", "table_index", "row", "reason", "raw_text", "context",
        ]
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for q in quarantine:
            writer.writerow(asdict(q))

    by_category: dict[str, int] = defaultdict(int)
    by_status: dict[str, int] = defaultdict(int)
    by_product_source: dict[str, int] = defaultdict(int)
    for e in entries:
        by_category[e.category] += 1
        by_status[e.review_status] += 1
        by_product_source[e.product_source] += 1

    by_reason: dict[str, int] = defaultdict(int)
    for q in quarantine:
        by_reason[q.reason] += 1

    report = {
        "stats": {
            **asdict(stats),
            "entries_by_category": dict(by_category),
            "entries_by_status": dict(by_status),
            "entries_by_product_source": dict(by_product_source),
            "quarantine_by_reason": dict(by_reason),
        },
        "invariants": [
            "Slide titles are NOT trusted for grouping; the table label is "
            "preferred and the title is only a last resort, recorded in "
            "product_source.",
            "No product label is invented. A table with no descriptive cell "
            "returns an empty own-label so the slide's nearest real label is "
            "inherited; unresolved tables are emitted as "
            "UNRESOLVED-S<slide>-T<table> for review.",
            "A table's price columns are found by counting money per column: a "
            "column holding money in at least PRICE_COLUMN_MIN_ROWS (2) rows is "
            "a price column. On a single-price table this reproduces the old "
            "right-edge rule, so those tables are unchanged. On a multi-price "
            "table one source row yields one entry per price column, each "
            "carrying its header label in series and its 0-based source_column.",
            "A money cell in a multi-price row that falls outside every detected "
            "price column is quarantined as unassigned-money-cell rather than "
            "assigned to a guessed column.",
            "A price column whose header label repeats an earlier column's label "
            "is stacked data: slide 30 prints the same series twice. Rows "
            "carrying money in the repeated block are quarantined as "
            "ambiguous-price-columns; the first block's entries are emitted as "
            "usual. Two generic (unlabeled) price columns are not a repetition.",
            "Prices are recorded exactly as printed. No currency conversion, "
            "recalculation, or availability inference is performed.",
            "price_high is never inferred. A second monetary cell in a row is "
            "left null for a human to judge, because the deck has no reliable "
            "price-range marker.",
            "Slide 56 (terms & conditions) is skipped entirely: PCS/CTN, CTNS "
            "and QTY/pcs are carton packing data, not warehouse stock. Its rows "
            "are counted in rows_skipped_non_product, not rows_skipped_header.",
            "U+FFFD in a row's own data (size or price) is quarantined rather "
            "than guessed. U+FFFD in a product label is kept as NEEDS_REVIEW "
            "with an explicit note, and the affected tables are listed in "
            "stats.product_label_defects.",
            "Nothing is classified by stock, lead time, or availability.",
        ],
    }
    with (outdir / "parse_report.json").open("w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)

    print(f"slides seen          : {stats.slides_seen}")
    print(f"tables parsed        : {stats.tables_seen}")
    print(f"cells read           : {stats.cells_seen}")
    print(f"entries emitted      : {stats.entries_emitted}")
    print(f"header rows skipped  : {stats.rows_skipped_header}")
    print(f"non-product rows skip: {stats.rows_skipped_non_product}")
    print(f"quarantined rows     : {stats.quarantined}")
    print(f"slides with 0 tables : {stats.slides_without_tables}")
    print(f"non-product slides   : {stats.slides_skipped_non_product}")
    print(f"unclassified tables  : {len(stats.unclassified_tables)}")
    print(f"product label defects: {len(stats.product_label_defects)}")
    print(f"multi-price tables   : {len(stats.multi_price_tables)}")
    if stats.multi_price_tables:
        for t in stats.multi_price_tables:
            print(f"  {t}")
    print(f"repeated-series tables: {len(stats.repeated_series_tables)}")
    if stats.repeated_series_tables:
        for t in stats.repeated_series_tables:
            print(f"  {t}")

    print("\nentries by category:")
    for k, v in sorted(by_category.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {v:5d}  {k}")
    print("\nentries by review status:")
    for k, v in sorted(by_status.items()):
        print(f"  {v:5d}  {k}")
    print("\nentries by product source:")
    for k, v in sorted(by_product_source.items(), key=lambda kv: -kv[1]):
        print(f"  {v:5d}  {k}")
    print("\nquarantine by reason:")
    for k, v in sorted(by_reason.items(), key=lambda kv: -kv[1]):
        print(f"  {v:5d}  {k}")
    if stats.unclassified_tables:
        print("\nunclassified tables (need a category decision):")
        for t in stats.unclassified_tables[:40]:
            print(f"  {t}")
        if len(stats.unclassified_tables) > 40:
            print(f"  ... and {len(stats.unclassified_tables) - 40} more")
    if stats.product_label_defects:
        print("\nproduct labels carrying U+FFFD (kept, NEEDS_REVIEW, not guessed):")
        for d in stats.product_label_defects[:40]:
            print(f"  {d}")
        if len(stats.product_label_defects) > 40:
            print(f"  ... and {len(stats.product_label_defects) - 40} more")
    print(f"\nwrote outputs to {outdir}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbook", type=Path, default=DEFAULT_WORKBOOK)
    parser.add_argument("--outdir", type=Path, default=DEFAULT_OUTDIR)
    args = parser.parse_args()

    if not args.workbook.exists():
        raise SystemExit(f"workbook not found: {args.workbook}")

    import openpyxl

    wb = openpyxl.load_workbook(args.workbook, data_only=True, read_only=True)
    try:
        entries, quarantine, stats = extract(wb)
    finally:
        wb.close()

    write_outputs(entries, quarantine, stats, args.outdir)


if __name__ == "__main__":
    main()
