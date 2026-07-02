/**
 * Life insurance calculator – formatting (1:1 with zivotni.html).
 */

/** cs-CZ, no decimals, comma replaced by space. */
export function formatCurrency(val: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "decimal",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(val)
    .replace(/,/g, " ");
}

export function parseCurrency(str: string): number {
  return parseInt(str.replace(/[^0-9]/g, ""), 10) || 0;
}

/** Zaokrouhlení na nejbližší 100 000 Kč (FP model). */
export function roundTo100k(val: number): number {
  return Math.ceil(Math.max(0, val) / 100_000) * 100_000;
}

/** @deprecated použij roundTo100k */
export function roundTo10k(val: number): number {
  return roundTo100k(val);
}
