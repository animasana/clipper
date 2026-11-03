import { eq } from "drizzle-orm";

import { groomingPackages } from "@/db/schema";
import { ADDRESS_DETAIL_MAX } from "@/lib/clipper/booking";
import { createAppointmentWithFreeGroomer } from "@/lib/clipper/data";
import { getDatabase } from "@/lib/clipper/db";
import { jsonError, logError, logEvent } from "@/lib/clipper/http";
import { createAppointmentId, createBookingReference } from "@/lib/clipper/ids";

type BookingRequest = {
  petName?: unknown;
  petBreed?: unknown;
  packageId?: unknown;
  neighborhood?: unknown;
  address?: unknown;
  /** Optional apartment, floor, or gate code. */
  addressDetail?: unknown;
  startsAt?: unknown;
};

export async function POST(request: Request) {
  let input: BookingRequest;

  try {
    input = (await request.json()) as BookingRequest;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const requiredFields = [
    "petName",
    "petBreed",
    "packageId",
    "neighborhood",
    "address",
    "startsAt",
  ] as const;
  const missingFields = requiredFields.filter((field) => {
    const value = input[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return jsonError(
      `Missing required fields: ${missingFields.join(", ")}.`,
      400,
    );
  }

  const petName = input.petName as string;
  const petBreed = input.petBreed as string;
  const packageId = input.packageId as string;
  const neighborhood = input.neighborhood as string;
  const address = input.address as string;
  const startsAt = new Date(input.startsAt as string);

  if (Number.isNaN(startsAt.getTime())) {
    return jsonError("startsAt must be a valid date.", 400);
  }

  if (input.addressDetail !== undefined && typeof input.addressDetail !== "string") {
    return jsonError("addressDetail must be a string.", 400);
  }
  const addressDetail = (input.addressDetail ?? "").trim();
  if (addressDetail.length > ADDRESS_DETAIL_MAX) {
    return jsonError(`Keep the apt, floor, or gate code under ${ADDRESS_DETAIL_MAX} characters.`, 400);
  }

  try {
    const db = getDatabase();
    const [groomingPackage] = await db
      .select()
      .from(groomingPackages)
      .where(eq(groomingPackages.id, packageId))
      .limit(1);

    if (!groomingPackage) {
      return jsonError("Grooming package was not found.", 404);
    }

    const endsAt = new Date(
      startsAt.getTime() + groomingPackage.durationMinutes * 60 * 1000,
    );

    const now = new Date();
    const bookingReference = createBookingReference();

    const groomerId = await createAppointmentWithFreeGroomer({
      id: createAppointmentId(),
      bookingReference,
      petName: petName.trim(),
      petBreed: petBreed.trim(),
      packageId,
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      startsAt,
      endsAt,
      status: "confirmed",
      priceCents: groomingPackage.priceCents,
      notes: addressDetail ? `Apt, floor, or gate: ${addressDetail}` : null,
      createdAt: now,
      updatedAt: now,
    });

    if (!groomerId) {
      return jsonError(
        "No groomer is available for that neighborhood and time.",
        409,
      );
    }

    logEvent("booking created", { bookingReference, packageId, groomerId });

    return Response.json({ ok: true, reference: bookingReference });
  } catch (error) {
    logError("failed to create booking", error, { packageId });

    return jsonError("We could not create your booking.", 500);
  }
}
