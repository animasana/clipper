import { and, eq, inArray } from "drizzle-orm";

import { appointments } from "@/db/schema";
import { CHANGEABLE_STATUSES, changeBlockedReason } from "@/lib/clipper/changes";
import { getAppointmentRow } from "@/lib/clipper/data";
import { getDatabase } from "@/lib/clipper/db";
import { jsonError } from "@/lib/clipper/http";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { reference } = await params;
  const appointment = await getAppointmentRow(reference);

  if (!appointment) {
    return jsonError("Appointment was not found.", 404);
  }

  const blockedReason = changeBlockedReason(appointment);
  if (blockedReason) {
    return jsonError(blockedReason, 409);
  }

  const now = new Date();
  // The status guard keeps a concurrent change from being overwritten.
  const updated = await getDatabase()
    .update(appointments)
    .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
    .where(
      and(
        eq(appointments.id, appointment.id),
        inArray(appointments.status, CHANGEABLE_STATUSES),
      ),
    )
    .returning({ id: appointments.id });

  if (updated.length === 0) {
    return jsonError("This visit just changed. Please reload and try again.", 409);
  }

  return Response.json({ ok: true, reference });
}
