import { changeBlockedReason } from "@/lib/clipper/changes";
import { getAppointmentRow, getRescheduleSlots } from "@/lib/clipper/data";
import { jsonError } from "@/lib/clipper/http";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

/** Times this appointment can be moved to. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { reference } = await params;

  try {
    const appointment = await getAppointmentRow(reference);
    if (!appointment) return jsonError("Appointment was not found.", 404);

    const blockedReason = changeBlockedReason(appointment);
    if (blockedReason) return jsonError(blockedReason, 409);

    const slots = await getRescheduleSlots(appointment);
    return Response.json({ slots });
  } catch (error) {
    console.error("Failed to load reschedule availability", error);

    return jsonError("We could not load availability.", 500);
  }
}
