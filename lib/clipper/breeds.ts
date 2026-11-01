/** Breeds offered in the booking form, alphabetical. "Mixed Breed" and "Other" follow them. */
export const BREEDS = [
  "Bichon Frise",
  "Chihuahua",
  "Dachshund",
  "French Bulldog",
  "German Shepherd",
  "Golden Retriever",
  "Labrador Retriever",
  "Maltese",
  "Miniature Poodle",
  "Pomeranian",
  "Poodle",
  "Shiba Inu",
  "Shih Tzu",
  "Welsh Corgi",
  "Yorkshire Terrier",
] as const;

// Same spelling as the old hard-coded option, so existing bookings stay consistent.
export const MIXED_BREED = "Mixed Breed";

/** Select value that reveals the free-text breed input. */
export const OTHER_BREED = "__other__";

export const BREED_MAX_LENGTH = 40;
