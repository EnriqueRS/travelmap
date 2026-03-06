/**
 * Normalizes a string by converting it to lowercase and removing diacritics (accents/tildes).
 * Useful for filtering and searching.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
