"""Tests for the price-column detector and multi-price row emission.

Run: python -m unittest discover -s scripts/pricelist -p "test_*.py"
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from openpyxl import Workbook

from extract_pricelist import detect_price_columns, extract


def build_workbook(tables, title=""):
    """tables maps (slide, table_index) to a rectangular list-of-rows grid."""
    wb = Workbook()
    cells = wb.active
    cells.title = "Table_Cells"
    cells.append(
        ["slide", "slide_title", "table_index", "row", "column", "value"]
    )
    slides = set()
    for (slide, table_index), rows in tables.items():
        slides.add(slide)
        for r, row in enumerate(rows, start=1):
            for c, value in enumerate(row, start=1):
                cells.append([slide, title, table_index, r, c, value])
    index = wb.create_sheet("Slide_Index")
    index.append(["slide", "tables"])
    for slide in sorted(slides):
        index.append([slide, 1])
    return wb


# One price column at the right edge, with a size column to its left.
SINGLE = [
    ["BUTTERFLY VALVE", "", "", ""],
    ["", "SIZE", "NET PRICE"],
    ["", '2"', "1,250.00"],
    ["", '3"', "1,350.00"],
]

# Two price columns (schedule), each with a header printed above it.
MULTI = [
    ["BUTTERFLY VALVE", "", "", ""],
    ["", "", "ERW STD", "ERW S80"],
    ["", '2"', "1,250.00", "1,450.00"],
    ["", '3"', "1,350.00", "1,550.00"],
]

# One series label printed over two price columns (slide 30 geometry).
STACKED = [
    ["HORSE POWER ELECTRIC", "", "", "", "", ""],
    ["", "SIZE", "STREAMPLUS or EBSRAY AUSTRALIA", "PURITY or ZJ BETTER",
     "STREAMPLUS or EBSRAY AUSTRALIA", "PURITY or ZJ BETTER"],
    ["", "10 HP", "270,000", "250,000", "", ""],
    ["", "20 HP", "290,000", "260,000", "", ""],
    ["", "40 HP", "310,000", "270,000", "490,000", "425,000"],
    ["", "50 HP", "330,000", "280,000", "510,000", "440,000"],
]


class DetectPriceColumnsTest(unittest.TestCase):
    def test_single_price_column_is_the_only_candidate(self):
        self.assertEqual(list(detect_price_columns(SINGLE)), [2])

    def test_every_price_column_is_detected(self):
        self.assertEqual(sorted(detect_price_columns(MULTI)), [2, 3])

    def test_header_text_becomes_the_series_label(self):
        self.assertEqual(
            detect_price_columns(MULTI),
            {2: "ERW STD", 3: "ERW S80"},
        )

    def test_bare_integer_sizes_are_not_price_columns(self):
        rows = [
            ["BUTTERFLY VALVE", "", ""],
            ["", '2"', "1,250.00"],
            ["", '3"', "1,350.00"],
        ]
        self.assertEqual(list(detect_price_columns(rows)), [2])

    def test_column_below_row_threshold_is_not_a_price_column(self):
        rows = [
            ["BUTTERFLY VALVE", "", "", ""],
            ["", '2"', "1,250.00", "9,999.00"],
            ["", '3"', "1,350.00", ""],
        ]
        self.assertEqual(list(detect_price_columns(rows)), [2])

    def test_table_without_money_has_no_price_columns(self):
        rows = [["BUTTERFLY VALVE", ""], ["", '2"'], ["", '3"']]
        self.assertEqual(detect_price_columns(rows), {})

    def test_generic_header_token_is_not_a_series(self):
        self.assertEqual(detect_price_columns(SINGLE), {2: None})

    def test_generically_headed_price_columns_keep_no_series(self):
        rows = [
            ["BUTTERFLY VALVE", "", "", ""],
            ["", "", "NET PRICE", "QTY"],
            ["", '2"', "1,250.00", "1,450.00"],
            ["", '3"', "1,350.00", "1,550.00"],
        ]
        self.assertEqual(detect_price_columns(rows), {2: None, 3: None})


class ExtractMultiPriceTest(unittest.TestCase):
    def test_single_price_table_still_yields_one_entry_per_row(self):
        entries, quarantine, stats = extract(build_workbook({(1, 1): SINGLE}))
        self.assertEqual(len(entries), 2)
        self.assertEqual(quarantine, [])
        self.assertEqual(stats.multi_price_tables, [])
        self.assertEqual([e.source_column for e in entries], [2, 2])
        self.assertEqual([e.unit_price for e in entries], ["1250.00", "1350.00"])
        self.assertEqual([e.series for e in entries], [None, None])

    def test_multi_price_table_yields_one_entry_per_price_column(self):
        entries, quarantine, stats = extract(build_workbook({(1, 1): MULTI}))
        self.assertEqual(quarantine, [])
        self.assertEqual(len(entries), 4)
        self.assertEqual(stats.multi_price_tables, ["S1-T1"])
        self.assertEqual(
            [(e.source_row, e.source_column, e.unit_price) for e in entries],
            [
                (3, 2, "1250.00"),
                (3, 3, "1450.00"),
                (4, 2, "1350.00"),
                (4, 3, "1550.00"),
            ],
        )

    def test_multi_price_entries_carry_their_series(self):
        entries, _, _ = extract(build_workbook({(1, 1): MULTI}))
        self.assertEqual([e.series for e in entries], ["ERW STD", "ERW S80"] * 2)

    def test_multi_price_entries_are_flagged_for_review(self):
        entries, _, _ = extract(build_workbook({(1, 1): MULTI}))
        for entry in entries:
            self.assertEqual(entry.review_status, "NEEDS_REVIEW")
            self.assertIn("price column", entry.ambiguity_note)

    def test_unassigned_money_is_quarantined_not_guessed(self):
        rows = [row[:] for row in MULTI]
        rows[2][0] = "1,500"
        entries, quarantine, stats = extract(build_workbook({(1, 1): rows}))
        self.assertEqual(
            [q.reason for q in quarantine], ["unassigned-money-cell"]
        )
        self.assertEqual(len(entries), 2)
        self.assertEqual(stats.quarantined, 1)

    def test_price_high_is_never_inferred(self):
        entries, _, _ = extract(build_workbook({(1, 1): MULTI}))
        self.assertTrue(all(e.price_high is None for e in entries))

    def test_repeated_series_header_quarantines_the_second_block(self):
        entries, quarantine, stats = extract(build_workbook({(1, 1): STACKED}))
        self.assertEqual(
            [(q.reason, q.row) for q in quarantine],
            [
                ("ambiguous-price-columns", 5),
                ("ambiguous-price-columns", 6),
            ],
        )
        self.assertEqual(stats.quarantined, 2)
        self.assertEqual(stats.repeated_series_tables, ["S1-T1"])
        self.assertEqual(stats.multi_price_tables, ["S1-T1"])
        self.assertEqual(
            [(e.source_row, e.source_column, e.series) for e in entries],
            [
                (3, 2, "STREAMPLUS or EBSRAY AUSTRALIA"),
                (3, 3, "PURITY or ZJ BETTER"),
                (4, 2, "STREAMPLUS or EBSRAY AUSTRALIA"),
                (4, 3, "PURITY or ZJ BETTER"),
            ],
        )
        self.assertTrue(all(e.source_column not in (4, 5) for e in entries))
