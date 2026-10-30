/**
 * Clipper operates in Seoul only. KST is UTC+9 with no daylight saving,
 * so a fixed offset is safe and avoids depending on the runtime's timezone
 * (Workers run in UTC; browsers run wherever the customer is).
 */
const SEOUL_TZ = "Asia/Seoul";
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Seoul calendar date ("YYYY-MM-DD"), weekday (0 = Sunday) and "HH:MM". */
export function seoulParts(date: Date) {
  // Shifted so the UTC fields read as Seoul wall-clock time.
  const wall = new Date(date.getTime() + SEOUL_OFFSET_MS);
  const iso = wall.toISOString();

  return {
    dateKey: iso.slice(0, 10),
    weekday: wall.getUTCDay(),
    time: iso.slice(11, 16),
  };
}

/** The instant at which Seoul wall-clock reads `dateKey` `time` ("HH:MM"). */
export function seoulDateTime(dateKey: string, time: string): Date {
  return new Date(Date.parse(`${dateKey}T${time}:00Z`) - SEOUL_OFFSET_MS);
}

/** Calendar arithmetic on "YYYY-MM-DD" keys. */
export function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" key. */
export function weekdayOf(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

/** "HH:MM" → minutes since midnight. */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Minutes since midnight → "HH:MM". */
export function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

type DateInput = Date | number | string | null | undefined;

function toValidDate(value: DateInput): Date | null {
  // `new Date(null)` is the epoch, so null/undefined must be rejected up front.
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Built once: constructing Intl formatters with a timeZone is relatively costly.
function seoulFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: SEOUL_TZ });
}

const dateFormatters = {
  // "Fri, Oct 23"
  short: seoulFormatter({ weekday: "short", month: "short", day: "numeric" }),
  // "Friday, October 23"
  long: seoulFormatter({ weekday: "long", month: "long", day: "numeric" }),
  // "Friday, October 23, 2026"
  full: seoulFormatter({ weekday: "long", month: "long", day: "numeric", year: "numeric" }),
};

const timeFormatter = seoulFormatter({ hour: "numeric", minute: "2-digit" });

/** Seoul calendar date for display, or null when `value` is missing/invalid. */
export function formatSeoulDate(
  value: DateInput,
  style: keyof typeof dateFormatters = "short",
): string | null {
  const date = toValidDate(value);
  return date && dateFormatters[style].format(date);
}

/** Seoul time for display ("10:00 AM"), or null when `value` is missing/invalid. */
export function formatSeoulTime(value: DateInput): string | null {
  const date = toValidDate(value);
  return date && timeFormatter.format(date);
}
