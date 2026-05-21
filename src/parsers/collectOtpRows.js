import { buildOtpAuthUri } from './buildOtpAuthUri'

/**
 * Flattens vaults into a list of OTP rows ready for export. Any record with a
 * `data.otp` secret of type 'TOTP' or 'HOTP' is included, regardless of record
 * type. Each row carries the split fields (for readability) plus a full
 * `otpauthUri` (for round-trip import into other apps).
 *
 * `period` is populated for TOTP only; `counter` for HOTP only.
 *
 * @param {Array} data
 * @returns {Array<{
 *   vaultName: string,
 *   title: string,
 *   issuer: string,
 *   label: string,
 *   secret: string,
 *   type: string,
 *   algorithm: string,
 *   digits: number,
 *   period?: number,
 *   counter?: number,
 *   otpauthUri: string
 * }>}
 */
export const collectOtpRows = (data) => {
  const rows = []

  data.forEach((vault) => {
    vault.records.forEach((record) => {
      const otp = record.data?.otp
      if (!otp || !otp.secret) return
      if (otp.type !== 'TOTP' && otp.type !== 'HOTP') return

      const isHotp = otp.type === 'HOTP'

      const row = {
        vaultName: vault.name || '',
        title: record.data?.title || '',
        issuer: otp.issuer || '',
        label: otp.label || record.data?.username || '',
        secret: otp.secret,
        type: otp.type,
        algorithm: otp.algorithm || 'SHA1',
        digits: otp.digits ?? 6,
        period: isHotp ? undefined : (otp.period ?? 30),
        counter: isHotp ? (otp.counter ?? 0) : undefined
      }

      row.otpauthUri = buildOtpAuthUri(row)
      rows.push(row)
    })
  })

  return rows
}
