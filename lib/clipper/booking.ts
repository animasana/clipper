/** Longest "apt, floor, or gate code" the booking form accepts; enforced on the client and the API. */
export const ADDRESS_DETAIL_MAX = 120;

/**
 * Groomer-facing note for the optional apartment / floor / gate detail,
 * or null when the customer left it blank.
 */
export function addressDetailNote(detail: string): string | null {
  const trimmed = detail.trim();
  return trimmed ? `Apt, floor, or gate: ${trimmed}` : null;
}
