import { buildOtpAuthUri } from './buildOtpAuthUri'

describe('buildOtpAuthUri', () => {
  it('builds a TOTP uri with issuer prefix and period', () => {
    const uri = buildOtpAuthUri({
      type: 'TOTP',
      issuer: 'GitHub',
      label: 'user@example.com',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    })
    expect(uri).toBe(
      'otpauth://totp/GitHub%3Auser%40example.com?secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&issuer=GitHub&period=30'
    )
  })

  it('builds an HOTP uri with counter instead of period', () => {
    const uri = buildOtpAuthUri({
      type: 'HOTP',
      issuer: 'Bank',
      label: 'acct',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA1',
      digits: 6,
      counter: 42
    })
    expect(uri.startsWith('otpauth://hotp/Bank%3Aacct')).toBe(true)
    expect(uri).toContain('counter=42')
    expect(uri).not.toContain('period=')
  })

  it('omits issuer params and uses the bare label when no issuer', () => {
    const uri = buildOtpAuthUri({
      type: 'TOTP',
      label: 'lone@x.com',
      secret: 'AAAA',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    })
    expect(uri).toBe(
      'otpauth://totp/lone%40x.com?secret=AAAA&algorithm=SHA1&digits=6&period=30'
    )
    expect(uri).not.toContain('issuer=')
  })

  it('falls back to title for the label when label is missing', () => {
    const uri = buildOtpAuthUri({
      type: 'TOTP',
      title: 'My Title',
      secret: 'AAAA',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    })
    expect(uri).toContain(`/${encodeURIComponent('My Title')}?`)
  })

  it('applies defaults for missing algorithm/digits/period/counter', () => {
    expect(buildOtpAuthUri({ type: 'TOTP', label: 'a', secret: 'S' })).toBe(
      'otpauth://totp/a?secret=S&algorithm=SHA1&digits=6&period=30'
    )
    expect(buildOtpAuthUri({ type: 'HOTP', label: 'a', secret: 'S' })).toBe(
      'otpauth://hotp/a?secret=S&algorithm=SHA1&digits=6&counter=0'
    )
  })
})
