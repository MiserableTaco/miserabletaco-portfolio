const MAX_INPUT_LENGTH = 100
const HTML_TAG_REGEX = /<[^>]*>/g

/**
 * Sanitize user text input: strip HTML tags, trim, enforce length limit.
 * Used for terminal input and any other user-provided strings.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(HTML_TAG_REGEX, '')
    .trim()
    .slice(0, MAX_INPUT_LENGTH)
}

/**
 * Validate a numeric value from localStorage.
 * Returns the value if valid, otherwise the fallback.
 */
export function validateStoredNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const num = Number(value)
  if (Number.isNaN(num) || num < min || num > max) {
    return fallback
  }
  return Math.floor(num)
}
