/**
 * Converts a name to title case (e.g. "JOHN SMITH" → "John Smith").
 */
function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalizes an attorney name from "Last, First" format to "First Last" with title case.
 * Names already in "First Last" format are title-cased but otherwise unchanged.
 * Handles ALL-CAPS input common in court data exports.
 *
 * Examples:
 *   "SMITH, JOHN"    → "John Smith"
 *   "DOE, JANE M."   → "Jane M. Doe"
 *   "John Smith"      → "John Smith"
 *   ""                → ""
 */
export function normalizeAttorneyName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.includes(',')) {
    const [last, ...rest] = trimmed.split(',');
    const first = rest.join(',').trim();
    if (first && last) {
      return toTitleCase(`${first} ${last.trim()}`);
    }
  }

  return toTitleCase(trimmed);
}
