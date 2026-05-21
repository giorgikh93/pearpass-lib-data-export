import { parseOtpToJson } from './parseOtpToJson'

describe('parseOtpToJson', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-06-01T12:34:56.789Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

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

  it('exports a single file with TOTP rows across vaults', () => {
    const data = [
      {
        name: 'Personal',
        records: [
          {
            type: 'login',
            data: { title: 'GitHub', username: 'u1', otp: totp() }
          }
        ]
      },
      {
        name: 'Work',
        records: [
          {
            type: 'login',
            data: {
              title: 'AWS',
              username: 'u2',
              otp: totp({ issuer: 'AWS', label: 'aws-user' })
            }
          }
        ]
      }
    ]

    const result = parseOtpToJson(data)
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe(
      'PearPass_2FA_2024_06_01T12_34_56_789Z.json'
    )

    const rows = JSON.parse(result[0].data)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      vaultName: 'Personal',
      title: 'GitHub',
      issuer: 'GitHub',
      label: 'user@example.com',
      secret: 'JBSWY3DPEHPK3PXP',
      type: 'TOTP',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      otpauthUri:
        'otpauth://totp/GitHub%3Auser%40example.com?secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&issuer=GitHub&period=30'
    })
    // TOTP rows must not carry a counter key
    expect(rows[0]).not.toHaveProperty('counter')
    expect(rows[1].vaultName).toBe('Work')
    expect(rows[1].issuer).toBe('AWS')
  })

  it('filters out records without otp and without a secret, but keeps TOTP and HOTP', () => {
    const data = [
      {
        name: 'V',
        records: [
          { type: 'note', data: { title: 'n' } },
          { type: 'login', data: { title: 'no-otp' } },
          {
            type: 'login',
            data: {
              title: 'hotp',
              otp: { ...totp(), type: 'HOTP', counter: 7 }
            }
          },
          {
            type: 'login',
            data: { title: 'no-secret', otp: { ...totp(), secret: '' } }
          },
          { type: 'login', data: { title: 'good', otp: totp() } }
        ]
      }
    ]

    const rows = JSON.parse(parseOtpToJson(data)[0].data)
    expect(rows.map((r) => r.title)).toEqual(['hotp', 'good'])

    const hotp = rows[0]
    expect(hotp.type).toBe('HOTP')
    expect(hotp.counter).toBe(7)
    expect(hotp).not.toHaveProperty('period')
    expect(hotp.otpauthUri).toContain('otpauth://hotp/')
    expect(hotp.otpauthUri).toContain('counter=7')
  })

  it('falls back to username when otp.label is missing', () => {
    const data = [
      {
        name: 'V',
        records: [
          {
            type: 'login',
            data: {
              title: 'GitHub',
              username: 'fallback@x.com',
              otp: totp({ label: undefined })
            }
          }
        ]
      }
    ]
    const rows = JSON.parse(parseOtpToJson(data)[0].data)
    expect(rows[0].label).toBe('fallback@x.com')
  })

  it('returns a file with empty array when no TOTP records exist', () => {
    const data = [{ name: 'V', records: [] }]
    const result = parseOtpToJson(data)
    expect(result).toHaveLength(1)
    expect(JSON.parse(result[0].data)).toEqual([])
  })

  it('applies algorithm/digits/period defaults', () => {
    const data = [
      {
        name: 'V',
        records: [
          {
            type: 'login',
            data: {
              title: 'X',
              otp: {
                secret: 'AAAA',
                type: 'TOTP'
              }
            }
          }
        ]
      }
    ]
    const rows = JSON.parse(parseOtpToJson(data)[0].data)
    expect(rows[0]).toMatchObject({
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    })
  })
})
