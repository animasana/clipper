const REFERENCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const REFERENCE_LENGTH = 6;
// Largest multiple of the alphabet size that fits in a byte; bytes at or above
// it are skipped so every character is equally likely.
const UNBIASED_LIMIT =
  Math.floor(256 / REFERENCE_ALPHABET.length) * REFERENCE_ALPHABET.length;

/** Booking reference in the `CLP-XXXXXX` format (uppercase letters and digits). */
export function createBookingReference(): string {
  let code = "";

  while (code.length < REFERENCE_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(REFERENCE_LENGTH))) {
      if (byte < UNBIASED_LIMIT && code.length < REFERENCE_LENGTH) {
        code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
      }
    }
  }

  return `CLP-${code}`;
}

export function createAppointmentId(): string {
  return `apt_${crypto.randomUUID()}`;
}
