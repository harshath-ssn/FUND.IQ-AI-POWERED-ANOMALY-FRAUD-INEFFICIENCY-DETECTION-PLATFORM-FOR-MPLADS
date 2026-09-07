// Single shared INR formatter for the whole app (FUND-IQ Session A, A4.2).
// Do not hand-roll (value / 1e7).toFixed(2) or similar conversions elsewhere --
// import formatINR from here instead so every workspace agrees on units.

const CRORE = 1e7;
const LAKH = 1e5;

/**
 * Format a rupee amount (raw number, not already divided) as a compact
 * Indian-unit string.
 *
 * @param {number} value - amount in rupees
 * @param {object} [opts]
 * @param {"auto"|"cr"|"lakh"} [opts.unit="auto"] - force a unit, or pick
 *   automatically based on magnitude (see aggregate/mode rules below)
 * @param {"aggregate"|"individual"} [opts.mode="individual"] - "aggregate"
 *   always renders in Cr with 2 decimals (national/state/district totals);
 *   "individual" (single works) uses Cr when >= 1 Cr, else Lakh -- so a
 *   small work reads as "Rs 4.5 L" instead of "Rs 0.005 Cr".
 * @param {number} [opts.decimals] - override decimal places
 * @param {boolean} [opts.withSymbol=true] - include the "Rs" prefix
 */
export function formatINR(value, opts = {}) {
  const {
    unit = "auto",
    mode = "individual",
    decimals,
    withSymbol = true,
  } = opts;

  const symbol = withSymbol ? "₹" : "";
  const num = Number(value);

  if (value === null || value === undefined || Number.isNaN(num)) {
    return withSymbol ? "₹—" : "—";
  }

  const abs = Math.abs(num);
  let resolvedUnit = unit;

  if (unit === "auto") {
    if (mode === "aggregate") {
      resolvedUnit = "cr";
    } else {
      resolvedUnit = abs >= CRORE ? "cr" : "lakh";
    }
  }

  if (resolvedUnit === "cr") {
    const d = decimals ?? 2;
    return `${symbol}${(num / CRORE).toFixed(d)} Cr`;
  }

  const d = decimals ?? 1;
  return `${symbol}${(num / LAKH).toFixed(d)} L`;
}

// Aggregate totals (national/state/district/constituency rollups): always
// Cr, 2 decimals, per A4.2.
export function formatINRAggregate(value, opts = {}) {
  return formatINR(value, { mode: "aggregate", ...opts });
}

// Full, uncompacted rupee figure with Indian digit grouping (2,34,56,789),
// e.g. for receipts/exports where the compact Cr/L form would be ambiguous.
export function formatINRFull(value) {
  const num = Number(value);
  if (value === null || value === undefined || Number.isNaN(num)) return "₹—";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

export default formatINR;
