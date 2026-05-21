import { generateQRCodeSVG } from '@tetherto/pear-apps-utils-qr'

import { collectOtpRows } from './collectOtpRows'

const sanitize = (value) =>
  String(value || '')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const buildBaseName = (row) => {
  const issuerPart = sanitize(row.issuer || row.title)
  const labelPart = sanitize(row.label)
  const joined = [issuerPart, labelPart].filter(Boolean).join('_')
  return joined || 'otp'
}

const uniqueFilename = (base, used) => {
  let candidate = `${base}.svg`
  let n = 2
  while (used.has(candidate)) {
    candidate = `${base}_${n}.svg`
    n += 1
  }
  used.add(candidate)
  return candidate
}

/**
 * @param {Array} data
 * @returns {Promise<Array<{filename: string, data: string}>>}
 */
export const parseOtpToQrSvgs = async (data) => {
  const rows = collectOtpRows(data)
  const used = new Set()

  return Promise.all(
    rows.map(async (row) => {
      const svg = await generateQRCodeSVG(row.otpauthUri, {
        type: 'svg',
        margin: 0
      })
      return {
        filename: uniqueFilename(buildBaseName(row), used),
        data: svg
      }
    })
  )
}
