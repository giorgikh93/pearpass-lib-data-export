import { parseOtpToCsvText } from './parseOtpToCsvText'

describe('parseOtpToCsvText', () => {
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

  it('produces a header row + a data row per TOTP record', () => {
    const data = [
      {
        name: 'Personal',
        records: [
          {
            type: 'login',
            data: { title: 'GitHub', username: 'u1', otp: totp() }
          }
        ]
      }
    ]

    const result = parseOtpToCsvText(data)
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe(
      'PearPass_2FA_2024_06_01T12_34_56_789Z.csv'
    )

    const lines = result[0].data.split('\n')
    expect(lines[0]).toBe(
      'vaultName,title,issuer,label,secret,type,algorithm,digits,period,counter,otpauthUri'
    )
    expect(lines[1]).toBe(
      '"Personal","GitHub","GitHub","user@example.com","JBSWY3DPEHPK3PXP","TOTP","SHA1","6","30","","otpauth://totp/GitHub%3Auser%40example.com?secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&issuer=GitHub&period=30"'
    )
  })

  it('writes counter (not period) and an hotp:// uri for HOTP rows', () => {
    const data = [
      {
        name: 'V',
        records: [
          {
            type: 'login',
            data: {
              title: 'Bank',
              otp: totp({ type: 'HOTP', counter: 5, issuer: 'Bank' })
            }
          }
        ]
      }
    ]

    const lines = parseOtpToCsvText(data)[0].data.split('\n')
    // columns: ...,type,algorithm,digits,period,counter,otpauthUri
    expect(lines[1]).toContain('"HOTP"')
    expect(lines[1]).toContain('"5"') // counter
    expect(lines[1]).toContain('otpauth://hotp/')
    expect(lines[1]).toContain('counter=5')
    // period column is empty for HOTP (",""," between digits and counter)
    expect(lines[1]).toContain('"6","","5"')
  })

  it('escapes double-quotes inside fields', () => {
    const data = [
      {
        name: 'V',
        records: [
          {
            type: 'login',
            data: {
              title: 'has "quote"',
              otp: totp({ issuer: 'Iss"uer' })
            }
          }
        ]
      }
    ]

    const lines = parseOtpToCsvText(data)[0].data.split('\n')
    expect(lines[1]).toContain('"has ""quote"""')
    expect(lines[1]).toContain('"Iss""uer"')
  })

  it('returns header-only file when there are no OTP records', () => {
    const data = [{ name: 'V', records: [] }]
    const result = parseOtpToCsvText(data)
    expect(result[0].data).toBe(
      'vaultName,title,issuer,label,secret,type,algorithm,digits,period,counter,otpauthUri'
    )
  })
})
