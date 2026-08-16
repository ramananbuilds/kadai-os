/**
 * Client-generatable ids. The offline billing flow depends on being able
 * to mint a UUID on the device with no network; the backend accepts these
 * as idempotency keys. Browsers and Hermes (React Native 0.74+) both ship
 * crypto.randomUUID; the fallback covers older webviews.
 */

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Normalizes an Indian phone entry to E.164 (+91…). Throws on garbage. */
export function toE164(raw: string, defaultCountryCode = '91'): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.length < 10) {
    throw new Error(`toE164: "${raw}" is not a valid phone number`)
  }
  if (raw.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`
  if (digits.length === 12 && digits.startsWith(defaultCountryCode)) return `+${digits}`
  return `+${digits}`
}
