/** Max lengths for free-text booking fields; the form and `/api/bookings` both enforce them. */
export const FIELD_LIMITS = {
  petName: 40,
  address: 200,
} as const;
