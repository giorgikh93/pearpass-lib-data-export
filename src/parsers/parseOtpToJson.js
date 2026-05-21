import { collectOtpRows } from './collectOtpRows'

/**
 * @param {Array} data
 * @returns {Array<{filename: string, data: string}>}
 */
export const parseOtpToJson = (data) => {
  const rows = collectOtpRows(data)

  const json = JSON.stringify(rows, null, 2)

  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_')
  const filename = `PearPass_2FA_${timestamp}.json`

  return [{ filename, data: json }]
}
