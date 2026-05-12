/**
 * currency.js — INR formatting utilities
 *
 * Primary formatter uses Intl.NumberFormat with en-IN locale
 * so numbers render in Indian format: ₹1,20,000
 *
 * Usage:
 *   import { formatINR, formatCurrency } from '../../utils/currency';
 *   formatINR(120000)           → "₹1,20,000"
 *   formatCurrency(120000, 'INR') → "₹1,20,000"
 *   formatCurrency(120000, 'USD') → "$120,000"
 */

/** Format a number as INR using Indian locale (en-IN) */
export function formatINR(value) {
  const num = parseFloat(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a number with the given currency code.
 * Falls back to INR if currency is unrecognised or empty.
 */
export function formatCurrency(value, currency = 'INR') {
  const num = parseFloat(value || 0);
  const code = currency || 'INR';

  // Use Intl for all currencies; en-IN locale for INR (Indian grouping),
  // en-US locale for everything else.
  const locale = code === 'INR' ? 'en-IN' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    // Unknown currency code — fall back to INR symbol
    return formatINR(num);
  }
}

/** Shorthand alias — same as formatINR */
export const fmt = formatINR;
