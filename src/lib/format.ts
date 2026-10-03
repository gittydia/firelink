const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

/** Format a PHP amount (number or decimal string) as e.g. "₱1,234.50". */
export function formatPrice(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return phpFormatter.format(amount);
}