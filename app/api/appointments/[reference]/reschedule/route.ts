import { changeBlockedReason } from "@/lib/clipper/changes";
import {
  getAppointmentRow,
  isWithinBookingWindow,
  moveAppointmentToFreeGroomer,
} from "@/lib/clipper/data";
import { jsonError } from "@/lib/clipper/http";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

type RescheduleRequest = {
  startsAt?: unknown;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { reference } = await params;
  let input: RescheduleRequest;

  try {
    input = (await request.json()) as RescheduleRequest;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (typeof input.startsAt !== "string" || input.startsAt.trim().length === 0) {
    return jsonError("Missing required fields: startsAt.", 400);
  }

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return jsonError("startsAt must be a valid date.", 400);
  }

  const appointment = await getAppointmentRow(reference);
  if (!appointment) {
    return jsonError("Appointment was not found.", 404);
  }

  const blockedReason = changeBlockedReason(appointment);
  if (blockedReason) {
    return jsonError(blockedReason, 409);
  }

  if (startsAt.getTime() === appointment.startsAt.getTime()) {
    return jsonError("Your visit is already at that time.", 400);
  }
  if (!isWithinBookingWindow(startsAt)) {
    return jsonError("Choose one of the offered times.", 400);
  }

  // The visit keeps the length it was booked with.
  const endsAt = new Date(
    startsAt.getTime() +
      (appointment.endsAt.getTime() - appointment.startsAt.getTime()),
  );
  const result = await moveAppointmentToFreeGroomer(appointment, startsAt, endsAt);

  if (result === "no-groomer") {
    return jsonError(
      "No groomer is available for that neighborhood and time.",
      409,
    );
  }
  if (result === "changed") {
    return jsonError("This visit just changed. Please reload and try again.", 409);
  }

  return Response.json({ ok: true, reference });
}
