import { getAvailableSlots } from "@/lib/clipper/data";
import { jsonError } from "@/lib/clipper/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighborhood = searchParams.get("neighborhood")?.trim();
  const packageId = searchParams.get("packageId")?.trim();

  if (!neighborhood || !packageId) {
    return jsonError("neighborhood and packageId are required.", 400);
  }

  try {
    const slots = await getAvailableSlots(neighborhood, packageId);
    if (!slots) return jsonError("Grooming package was not found.", 404);

    return Response.json({ slots });
  } catch (error) {
    console.error("Failed to load availability", error);

    return jsonError("We could not load availability.", 500);
  }
}
