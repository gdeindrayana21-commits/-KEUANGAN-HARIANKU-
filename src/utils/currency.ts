/**
 * Format a number to Indonesian Rupiah currency string.
 * Example: 1000000 -> "Rp 1.000.000", -50000 -> "-Rp 50.000", 0 -> "Rp 0"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }

  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const positiveNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(positiveNum);

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Parses raw input string (e.g. "10.000" or "Rp 10.000") into a clean positive integer number.
 */
export function parseRupiahInput(value: string): number {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  return parseInt(digitsOnly, 10);
}

/**
 * Formats a typed raw digit string as user types, adding thousand separators with prefix "Rp ".
 */
export function formatRupiahInputDisplay(value: string | number): string {
  const num = typeof value === 'number' ? value : parseRupiahInput(value);
  if (num === 0) return '';
  return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
}
