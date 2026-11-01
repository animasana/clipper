// Built once: Intl formatters are relatively costly to construct.
const krwFormatter = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" });

/**
 * Display price in won, e.g. 95000 → "₩95,000".
 * `priceCents` columns hold whole won (KRW has no minor unit), so no division is needed.
 */
export function formatKRW(amount: number): string {
  return krwFormatter.format(amount);
}

/** Visit length for display, e.g. 90 → "90 min". */
export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}
