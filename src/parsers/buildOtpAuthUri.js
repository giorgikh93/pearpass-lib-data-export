/**
 * Reconstructs a standard otpauth:// Key URI from an OTP export row.
 *
 * - TOTP -> otpauth://totp/<label>?secret=...&issuer=...&algorithm=...&digits=...&period=...
 * - HOTP -> otpauth://hotp/<label>?secret=...&issuer=...&algorithm=...&digits=...&counter=...
 *
 * The URI is the de-facto interchange format for OTP credentials, so embedding
 * it makes the JSON/CSV exports (and the QR images) importable by other apps.
 *
 * @param {{
 *   type?: string,
 *   issuer?: string,
 *   label?: string,
 *   title?: string,
 *   secret: string,
 *   algorithm?: string,
 *   digits?: number,
 *   period?: number,
 *   counter?: number
 * }} row
 * @returns {string}
 */
export const buildOtpAuthUri = (row) => {
  const otpType = row.type === 'HOTP' ? 'hotp' : 'totp'

  const labelPath = encodeURIComponent(
    row.issuer ? `${row.issuer}:${row.label}` : row.label || row.title
  )

  const params = new URLSearchParams({
    secret: row.secret,
    algorithm: row.algorithm || 'SHA1',
    digits: String(row.digits ?? 6)
  })

  if (row.issuer) params.set('issuer', row.issuer)

  if (otpType === 'hotp') {
    params.set('counter', String(row.counter ?? 0))
  } else {
    params.set('period', String(row.period ?? 30))
  }

  return `otpauth://${otpType}/${labelPath}?${params.toString()}`
}
