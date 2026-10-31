import { getBookingOptions } from "@/lib/clipper/data";
import { jsonError, logError } from "@/lib/clipper/http";

export async function GET() {
  try {
    // The catalog changes rarely; let browsers reuse it for a few minutes.
    return Response.json(await getBookingOptions(), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    logError("failed to load booking options", error);

    return jsonError("We could not load booking options.", 500);
  }
}
