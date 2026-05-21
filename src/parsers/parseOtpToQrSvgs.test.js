jest.mock(
  '@tetherto/pear-apps-utils-qr',
  () => ({
    generateQRCodeSVG: jest.fn(async (uri) => `<svg data-uri="${uri}"/>`)
  }),
  { virtual: true }
)

import { generateQRCodeSVG } from '@tetherto/pear-apps-utils-qr'

import { parseOtpToQrSvgs } from './parseOtpToQrSvgs'

const totp = (overrides = {}) => ({
  secret: 'JBSWY3DPEHPK3PXP',
  type: 'TOTP',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  issuer: 'GitHub',
  label: 'user@example.com',
  ...overrides
})

const vault = (records) => [{ name: 'V', records }]

describe('parseOtpToQrSvgs', () => {
  beforeEach(() => {
    generateQRCodeSVG.mockClear()
  })

  it('generates one SVG file per TOTP record', async () => {
    const data = vault([
      { type: 'login', data: { title: 'GitHub', otp: totp() } },
      {
        type: 'login',
        data: {
          title: 'AWS',
          otp: totp({ issuer: 'AWS', label: 'aws-user' })
        }
      }
    ])

    const result = await parseOtpToQrSvgs(data)
    expect(result).toHaveLength(2)
    expect(result[0].filename).toBe('GitHub_user_example_com.svg')
    expect(result[1].filename).toBe('AWS_aws_user.svg')
    expect(result[0].data).toMatch(/^<svg/)
  })

  it('reconstructs a standard otpauth:// URI with issuer prefix', async () => {
    const data = vault([
      { type: 'login', data: { title: 'GitHub', otp: totp() } }
    ])

    await parseOtpToQrSvgs(data)

    const uri = generateQRCodeSVG.mock.calls[0][0]
    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain(encodeURIComponent('GitHub:user@example.com'))
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
    expect(uri).toContain('issuer=GitHub')
    expect(uri).toContain('algorithm=SHA1')
    expect(uri).toContain('digits=6')
    expect(uri).toContain('period=30')
  })

  it('omits issuer params when no issuer is present', async () => {
    const data = vault([
      {
        type: 'login',
        data: {
          title: 'Standalone',
          otp: totp({ issuer: undefined, label: 'lone@x.com' })
        }
      }
    ])

    await parseOtpToQrSvgs(data)
    const uri = generateQRCodeSVG.mock.calls[0][0]
    expect(uri).toContain(encodeURIComponent('lone@x.com'))
    expect(uri).not.toContain('issuer=')
  })

  it('deduplicates filenames on collision', async () => {
    const data = vault([
      { type: 'login', data: { title: 'GitHub', otp: totp() } },
      { type: 'login', data: { title: 'GitHub', otp: totp() } },
      { type: 'login', data: { title: 'GitHub', otp: totp() } }
    ])

    const result = await parseOtpToQrSvgs(data)
    expect(result.map((r) => r.filename)).toEqual([
      'GitHub_user_example_com.svg',
      'GitHub_user_example_com_2.svg',
      'GitHub_user_example_com_3.svg'
    ])
  })

  it('skips records without an otp secret but keeps TOTP and HOTP', async () => {
    const data = vault([
      { type: 'note', data: { title: 'n' } },
      { type: 'login', data: { title: 'no-otp' } },
      {
        type: 'login',
        data: { title: 'no-secret', otp: { ...totp(), secret: '' } }
      },
      {
        type: 'login',
        data: {
          title: 'Bank',
          otp: totp({ type: 'HOTP', counter: 3, issuer: 'Bank', label: 'acct' })
        }
      }
    ])

    const result = await parseOtpToQrSvgs(data)
    expect(result).toHaveLength(1)
    expect(generateQRCodeSVG).toHaveBeenCalledTimes(1)

    const uri = generateQRCodeSVG.mock.calls[0][0]
    expect(uri.startsWith('otpauth://hotp/')).toBe(true)
    expect(uri).toContain('counter=3')
    expect(uri).not.toContain('period=')
  })

  it('returns an empty array when there are no records', async () => {
    const result = await parseOtpToQrSvgs([{ name: 'V', records: [] }])
    expect(result).toEqual([])
  })
})
