import {
  and,
  desc,
  eq,
  gt,
  lt,
  ne,
} from "drizzle-orm";

import {
  type Appointment,
  appointments,
  groomerSchedules,
  groomerServiceAreas,
  groomers,
  groomingPackages,
} from "@/db/schema";

import { getDatabase } from "./db";
import {
  addDays,
  fromMinutes,
  seoulDateTime,
  seoulParts,
  toMinutes,
  weekdayOf,
} from "./time";
import type {
  AppointmentDetails,
  AvailableSlot,
  BookingOption,
} from "./types";

export async function getBookingOptions(): Promise<BookingOption> {
  const db = getDatabase();

  const [packageRows, neighborhoodRows] = await db.batch([
    db.select().from(groomingPackages),
    db
      .select({ neighborhood: groomerServiceAreas.neighborhood })
      .from(groomerServiceAreas),
  ]);

  const neighborhoods = [
    ...new Set(neighborhoodRows.map((row) => row.neighborhood)),
  ].sort();

  return {
    packages: packageRows,
    neighborhoods,
  };
}

type AppointmentRow = {
  appointment: Appointment;
  groomer: typeof groomers.$inferSelect | null;
  groomingPackage: typeof groomingPackages.$inferSelect;
};

function toAppointmentDetails(row: AppointmentRow): AppointmentDetails {
  return {
    ...row.appointment,
    reference: row.appointment.bookingReference,
    pet: { name: row.appointment.petName, breed: row.appointment.petBreed },
    groomer: row.groomer,
    package: row.groomingPackage,
    startsAt: row.appointment.startsAt.toISOString(),
    endsAt: row.appointment.endsAt.toISOString(),
    cancelledAt: row.appointment.cancelledAt?.toISOString() ?? null,
    createdAt: row.appointment.createdAt.toISOString(),
    updatedAt: row.appointment.updatedAt.toISOString(),
  };
}

export async function getAppointmentByReference(
  reference: string,
): Promise<AppointmentDetails | null> {
  const db = getDatabase();
  const rows = await db
    .select({
      appointment: appointments,
      groomer: groomers,
      groomingPackage: groomingPackages,
    })
    .from(appointments)
    .leftJoin(groomers, eq(appointments.groomerId, groomers.id))
    .innerJoin(
      groomingPackages,
      eq(appointments.packageId, groomingPackages.id),
    )
    .where(eq(appointments.bookingReference, reference))
    .limit(1);

  const row = rows[0];
  return row ? toAppointmentDetails(row) : null;
}

/** The bare appointment row, for routes that change it. */
export async function getAppointmentRow(
  reference: string,
): Promise<Appointment | null> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.bookingReference, reference))
    .limit(1);

  return rows[0] ?? null;
}

export async function getAppointments(): Promise<AppointmentDetails[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      appointment: appointments,
      groomer: groomers,
      groomingPackage: groomingPackages,
    })
    .from(appointments)
    .leftJoin(groomers, eq(appointments.groomerId, groomers.id))
    .innerJoin(groomingPackages, eq(appointments.packageId, groomingPackages.id))
    .orderBy(desc(appointments.startsAt));

  return rows.map(toAppointmentDetails);
}

type ScheduleWindow = {
  groomerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
};

type BusyInterval = {
  groomerId: string | null;
  startsAt: Date;
  endsAt: Date;
};

type GroomerMatchOptions = {
  /** Ignore this appointment's own time when rescheduling it. */
  excludeAppointmentId?: string;
  /** Picked over other free groomers when they are free too. */
  preferredGroomerId?: string | null;
};

/**
 * Schedules and appointments are interpreted in Seoul time: `weekday` and
 * `HH:MM` strings in groomer_schedules are KST wall-clock values.
 */
export async function findAvailableGroomer(
  neighborhood: string,
  startsAt: Date,
  endsAt: Date,
  { excludeAppointmentId, preferredGroomerId }: GroomerMatchOptions = {},
): Promise<string | null> {
  const start = seoulParts(startsAt);
  const end = seoulParts(endsAt);
  // Visits never run past midnight; schedules are per-day windows.
  if (start.dateKey !== end.dateKey) return null;

  const db = getDatabase();
  const [schedules, busy] = await db.batch([
    neighborhoodSchedulesQuery(db, neighborhood, start.weekday),
    neighborhoodBusyIntervalsQuery(
      db,
      neighborhood,
      startsAt,
      endsAt,
      excludeAppointmentId,
    ),
  ]);
  const candidates = groomersCovering(schedules, start.time, end.time);

  return pickFreeGroomer(candidates, busy, startsAt, endsAt, preferredGroomerId);
}

const SLOT_DAYS_AHEAD = 7;

/** Bookable days: the next week of Seoul days, starting tomorrow. */
function bookingWindow(now = new Date()) {
  const todayKey = seoulParts(now).dateKey;
  return {
    todayKey,
    from: seoulDateTime(addDays(todayKey, 1), "00:00"),
    to: seoulDateTime(addDays(todayKey, SLOT_DAYS_AHEAD + 1), "00:00"),
  };
}

export function isWithinBookingWindow(startsAt: Date): boolean {
  const { from, to } = bookingWindow();
  return startsAt >= from && startsAt < to;
}

/**
 * Bookable start times (hourly, KST) for the booking window where at least
 * one groomer serving `neighborhood` is scheduled and free for the package's
 * full duration. Returns null when the package doesn't exist.
 */
export async function getAvailableSlots(
  neighborhood: string,
  packageId: string,
): Promise<AvailableSlot[] | null> {
  const { todayKey, from, to } = bookingWindow();
  const db = getDatabase();
  const [packageRows, schedules, busy] = await db.batch([
    db
      .select({ durationMinutes: groomingPackages.durationMinutes })
      .from(groomingPackages)
      .where(eq(groomingPackages.id, packageId))
      .limit(1),
    neighborhoodSchedulesQuery(db, neighborhood),
    neighborhoodBusyIntervalsQuery(db, neighborhood, from, to),
  ]);
  const durationMinutes = packageRows[0]?.durationMinutes;
  if (durationMinutes === undefined) return null;

  return buildSlots(todayKey, durationMinutes, schedules, busy);
}

/**
 * Times `appointment` can move to: the same grid as new bookings, keeping its
 * booked length, not counting its own current time as busy, and leaving out
 * the time it already has.
 */
export async function getRescheduleSlots(
  appointment: Appointment,
): Promise<AvailableSlot[]> {
  const { todayKey, from, to } = bookingWindow();
  const db = getDatabase();
  const [schedules, busy] = await db.batch([
    neighborhoodSchedulesQuery(db, appointment.neighborhood),
    neighborhoodBusyIntervalsQuery(
      db,
      appointment.neighborhood,
      from,
      to,
      appointment.id,
    ),
  ]);
  const durationMinutes =
    (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60_000;
  const currentStart = appointment.startsAt.toISOString();

  return buildSlots(todayKey, durationMinutes, schedules, busy).filter(
    (slot) => slot.startsAt !== currentStart,
  );
}

function buildSlots(
  todayKey: string,
  durationMinutes: number,
  schedules: ScheduleWindow[],
  busy: BusyInterval[],
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  for (let offset = 1; offset <= SLOT_DAYS_AHEAD; offset++) {
    const dateKey = addDays(todayKey, offset);
    const weekday = weekdayOf(dateKey);
    const daySchedules = schedules.filter(
      (schedule) => schedule.weekday === weekday,
    );

    const startMinutes = new Set<number>();
    for (const schedule of daySchedules) {
      const close = toMinutes(schedule.endTime);
      for (
        let minute = toMinutes(schedule.startTime);
        minute + durationMinutes <= close;
        minute += 60
      ) {
        startMinutes.add(minute);
      }
    }

    for (const minute of [...startMinutes].sort((a, b) => a - b)) {
      const startTime = fromMinutes(minute);
      const endTime = fromMinutes(minute + durationMinutes);
      const startsAt = seoulDateTime(dateKey, startTime);
      const endsAt = seoulDateTime(dateKey, endTime);
      const candidates = groomersCovering(daySchedules, startTime, endTime);

      if (pickFreeGroomer(candidates, busy, startsAt, endsAt)) {
        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        });
      }
    }
  }

  return slots;
}

type Database = ReturnType<typeof getDatabase>;

// The query builders below are returned unawaited so callers can send
// them to D1 together with db.batch() in a single round trip.

function neighborhoodSchedulesQuery(
  db: Database,
  neighborhood: string,
  weekday?: number,
) {
  return db
    .select({
      groomerId: groomers.id,
      weekday: groomerSchedules.weekday,
      startTime: groomerSchedules.startTime,
      endTime: groomerSchedules.endTime,
    })
    .from(groomers)
    .innerJoin(
      groomerServiceAreas,
      eq(groomerServiceAreas.groomerId, groomers.id),
    )
    .innerJoin(
      groomerSchedules,
      eq(groomerSchedules.groomerId, groomers.id),
    )
    .where(
      and(
        eq(groomers.active, true),
        eq(groomerServiceAreas.neighborhood, neighborhood),
        eq(groomerSchedules.available, true),
        weekday === undefined
          ? undefined
          : eq(groomerSchedules.weekday, weekday),
      ),
    );
}

/**
 * Non-cancelled appointments overlapping `from`–`to` for every groomer who
 * serves `neighborhood`, wherever the appointment itself is (a groomer booked
 * in another neighborhood is still busy).
 */
function neighborhoodBusyIntervalsQuery(
  db: Database,
  neighborhood: string,
  from: Date,
  to: Date,
  excludeAppointmentId?: string,
) {
  return db
    .select({
      groomerId: appointments.groomerId,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
    })
    .from(appointments)
    .innerJoin(
      groomerServiceAreas,
      eq(groomerServiceAreas.groomerId, appointments.groomerId),
    )
    .where(
      and(
        eq(groomerServiceAreas.neighborhood, neighborhood),
        lt(appointments.startsAt, to),
        gt(appointments.endsAt, from),
        ne(appointments.status, "cancelled"),
        excludeAppointmentId === undefined
          ? undefined
          : ne(appointments.id, excludeAppointmentId),
      ),
    );
}

/** Schedules whose window fully contains `startTime`–`endTime` ("HH:MM", lexical compare). */
function groomersCovering(
  schedules: ScheduleWindow[],
  startTime: string,
  endTime: string,
) {
  return schedules.filter(
    (schedule) => schedule.startTime <= startTime && schedule.endTime >= endTime,
  );
}

function pickFreeGroomer(
  candidates: ScheduleWindow[],
  busy: BusyInterval[],
  startsAt: Date,
  endsAt: Date,
  preferredGroomerId?: string | null,
): string | null {
  const busyGroomerIds = new Set(
    busy
      .filter(
        (interval) => interval.startsAt < endsAt && interval.endsAt > startsAt,
      )
      .map((interval) => interval.groomerId),
  );
  const free = candidates.filter(
    (candidate) => !busyGroomerIds.has(candidate.groomerId),
  );

  return (
    (free.find((candidate) => candidate.groomerId === preferredGroomerId) ??
      free[0])?.groomerId ?? null
  );
}
