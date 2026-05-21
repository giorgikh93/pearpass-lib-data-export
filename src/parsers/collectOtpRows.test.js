import { collectOtpRows } from './collectOtpRows'

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

const vault = (name, records) => ({ name, records })
const loginRecord = (data) => ({ type: 'login', data })

describe('collectOtpRows', () => {
  it('returns an empty array for empty vaults', () => {
    expect(collectOtpRows([vault('V', [])])).toEqual([])
  })

  it('extracts a TOTP record with correct fields', () => {
    const data = [
      vault('Personal', [
        loginRecord({ title: 'GitHub', username: 'u1', otp: totp() })
      ])
    ]

    const rows = collectOtpRows(data)
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.vaultName).toBe('Personal')
    expect(row.title).toBe('GitHub')
    expect(row.issuer).toBe('GitHub')
    expect(row.label).toBe('user@example.com')
    expect(row.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(row.type).toBe('TOTP')
    expect(row.algorithm).toBe('SHA1')
    expect(row.digits).toBe(6)
    expect(row.period).toBe(30)
    expect(row.counter).toBeUndefined()
    expect(row.otpauthUri).toContain('otpauth://totp/')
  })

  it('extracts an HOTP record with counter and no period', () => {
    const data = [
      vault('V', [
        loginRecord({
          title: 'Bank',
          otp: totp({ type: 'HOTP', counter: 7, period: undefined })
        })
      ])
    ]

    const rows = collectOtpRows(data)
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.type).toBe('HOTP')
    expect(row.counter).toBe(7)
    expect(row.period).toBeUndefined()
    expect(row.otpauthUri).toContain('otpauth://hotp/')
    expect(row.otpauthUri).toContain('counter=7')
    expect(row.otpauthUri).not.toContain('period=')
  })

  it('skips records without an otp field', () => {
    const data = [
      vault('V', [
        loginRecord({ title: 'NoOtp' }),
        { type: 'note', data: { title: 'NoteRecord' } }
      ])
    ]
    expect(collectOtpRows(data)).toHaveLength(0)
  })

  it('skips records with an empty secret', () => {
    const data = [
      vault('V', [
        loginRecord({ title: 'Bad', otp: { ...totp(), secret: '' } })
      ])
    ]
    expect(collectOtpRows(data)).toHaveLength(0)
  })

  it('skips records with an unknown otp type', () => {
    const data = [
      vault('V', [
        loginRecord({ title: 'Odd', otp: { ...totp(), type: 'STEAM' } })
      ])
    ]
    expect(collectOtpRows(data)).toHaveLength(0)
  })

  it('falls back to username when label is absent', () => {
    const data = [
      vault('V', [
        loginRecord({
          title: 'Service',
          username: 'alice',
          otp: totp({ label: undefined })
        })
      ])
    ]

    const [row] = collectOtpRows(data)
    expect(row.label).toBe('alice')
  })

  it('flattens records from multiple vaults', () => {
    const data = [
      vault('A', [
        loginRecord({ title: 'S1', otp: totp({ issuer: 'S1', label: 'a' }) })
      ]),
      vault('B', [
        loginRecord({ title: 'S2', otp: totp({ issuer: 'S2', label: 'b' }) })
      ])
    ]

    const rows = collectOtpRows(data)
    expect(rows).toHaveLength(2)
    expect(rows[0].vaultName).toBe('A')
    expect(rows[1].vaultName).toBe('B')
  })

  it('defaults algorithm to SHA1 and digits to 6 when absent', () => {
    const data = [
      vault('V', [
        loginRecord({ title: 'Min', otp: { secret: 'ABC', type: 'TOTP' } })
      ])
    ]

    const [row] = collectOtpRows(data)
    expect(row.algorithm).toBe('SHA1')
    expect(row.digits).toBe(6)
    expect(row.period).toBe(30)
  })

  it('defaults HOTP counter to 0 when absent', () => {
    const data = [
      vault('V', [
        loginRecord({ title: 'H', otp: { secret: 'ABC', type: 'HOTP' } })
      ])
    ]

    const [row] = collectOtpRows(data)
    expect(row.counter).toBe(0)
  })
})
