import { collectOtpRows } from './collectOtpRows'

const HEADERS = [
  'vaultName',
  'title',
  'issuer',
  'label',
  'secret',
  'type',
  'algorithm',
  'digits',
  'period',
  'counter',
  'otpauthUri'
]

const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

/**
 * @param {Array} data
 * @returns {Array<{filename: string, data: string}>}
 */
export const parseOtpToCsvText = (data) => {
  const rows = collectOtpRows(data)

  const csvRows = [HEADERS.join(',')]
  rows.forEach((row) => {
    csvRows.push(HEADERS.map((h) => escape(row[h])).join(','))
  })

  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_')
  const filename = `PearPass_2FA_${timestamp}.csv`

  return [{ filename, data: csvRows.join('\n') }]
}
