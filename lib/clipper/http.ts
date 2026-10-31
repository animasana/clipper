/** The API's error contract: `{ ok: false, error }` with an HTTP status. */
export function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

/** Structured (JSON) log line, searchable in Workers Logs. */
export function logEvent(message: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ message, ...fields }));
}

/** Structured error log. Errors don't serialize, so keep their message. */
export function logError(
  message: string,
  error: unknown,
  fields: Record<string, unknown> = {},
) {
  console.error(
    JSON.stringify({
      message,
      error: error instanceof Error ? error.message : String(error),
      ...fields,
    }),
  );
}
