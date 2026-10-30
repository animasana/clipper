/** The API's error contract: `{ ok: false, error }` with an HTTP status. */
export function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}
