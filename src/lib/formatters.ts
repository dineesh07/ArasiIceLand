/**
 * Formats an integer amount as an Indian Rupee string.
 * Whole rupees only, e.g. 1250 -> "₹1,250"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Formats a token number nicely, e.g. 7 -> "#7"
 */
export function formatToken(token: number | null | undefined): string {
  if (!token) return '';
  return `#${token}`;
}

