/** Online cancel/reschedule closes this long before the visit starts. */
export const CHANGE_CUTOFF_HOURS = 24;

/** Only these statuses can be cancelled or moved by the customer. */
export const CHANGEABLE_STATUSES = ["confirmed", "pending"];

/**
 * Why the customer can't cancel or reschedule this visit online, or null when
 * they can. Shared by the appointment page and the change routes.
 */
export function changeBlockedReason(
  appointment: { status: string; startsAt: Date | string },
  now = new Date(),
): string | null {
  if (appointment.status === "cancelled") {
    return "This visit has already been cancelled.";
  }
  if (!CHANGEABLE_STATUSES.includes(appointment.status)) {
    return "This visit can no longer be changed online.";
  }

  const msUntilStart = new Date(appointment.startsAt).getTime() - now.getTime();
  if (msUntilStart <= 0) {
    return "This visit has already started.";
  }
  if (msUntilStart < CHANGE_CUTOFF_HOURS * 60 * 60 * 1000) {
    return `Online changes close ${CHANGE_CUTOFF_HOURS} hours before your visit. Please call us instead.`;
  }

  return null;
}
