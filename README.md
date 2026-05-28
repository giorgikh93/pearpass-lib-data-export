# pearpass-lib-data-export

A utility for exporting PearPass vaults to various formats.

## Features

- Export vault records to CSV or JSON format.
- Export 2FA/OTP credentials to CSV, JSON, or individual QR-code SVG files.
- OTP exports include full `otpauth://` URIs for round-trip import into authenticator apps.

## Security Notice

1. To ensure the security and integrity of your projects, please note that official PearPass packages are distributed exclusively through our GitHub organization.
2. Any packages with similar names found on the npm registry or other third-party package managers are not affiliated with PearPass and should be strictly avoided. We recommend installing directly from this repository to ensure you are using the verified, open-source version.

## Installation

Install the package using npm:

```bash
npm install git+https://github.com/tetherto/pearpass-lib-data-export.git
```

## Testing

To run the tests, use the following command:

```bash
npm test
```

## Usage Examples

Here's how you can use the library to export data:

### Export to JSON

```javascript
import { parseDataToJson } from '@tetherto/pearpass-lib-data-export';

const vaultData = [
  {
    name: 'My Vault',
    records: [
      {
        type: 'login',
        data: {
          title: 'Sample Login',
          username: 'user',
          password: 'password123'
        }
      }
    ]
  }
];

const files = parseDataToJson(vaultData);
files.forEach(file => {
  console.log(`File: ${file.filename}`);
  // You can now save file.data to a file
});
```

### Export to CSV

```javascript
import { parseDataToCsvText } from '@tetherto/pearpass-lib-data-export';

const vaultData = [
  {
    name: 'My Vault',
    records: [
      {
        type: 'login',
        data: {
          title: 'Sample Login',
          username: 'user',
          password: 'password123'
        }
      }
    ]
  }
];

const files = parseDataToCsvText(vaultData);
files.forEach(file => {
  console.log(`File: ${file.filename}`);
  // You can now save file.data to a file
});
```

### Export OTP credentials to JSON

```javascript
import { parseOtpToJson } from '@tetherto/pearpass-lib-data-export';

const files = parseOtpToJson(vaultData);
// => [{ filename: 'PearPass_2FA_2024_01_01T00_00_00_000Z.json', data: '...' }]
```

Each record in the JSON output contains: `vaultName`, `title`, `issuer`, `label`, `secret`, `type` (`TOTP`/`HOTP`), `algorithm`, `digits`, `period` (TOTP), `counter` (HOTP), and `otpauthUri`.

### Export OTP credentials to CSV

```javascript
import { parseOtpToCsvText } from '@tetherto/pearpass-lib-data-export';

const files = parseOtpToCsvText(vaultData);
// => [{ filename: 'PearPass_2FA_2024_01_01T00_00_00_000Z.csv', data: '...' }]
```

Columns: `vaultName`, `title`, `issuer`, `label`, `secret`, `type`, `algorithm`, `digits`, `period`, `counter`, `otpauthUri`.

### Export OTP credentials as QR-code SVGs

```javascript
import { parseOtpToQrSvgs } from '@tetherto/pearpass-lib-data-export';

const files = await parseOtpToQrSvgs(vaultData);
// => [{ filename: 'GitHub_user@example.com.svg', data: '<svg>...</svg>' }, ...]
```

Each SVG encodes the `otpauth://` URI for that credential. Filenames are derived from the issuer and label, with deduplication suffixes when needed.

## API Reference

All functions accept the same `vaultData` shape:

```javascript
[
  {
    name: 'Vault Name',       // string
    records: [
      {
        type: 'login',        // record type
        data: {
          title: 'GitHub',
          username: 'user',
          password: 'secret',
          otp: {              // optional — only for 2FA records
            type: 'TOTP',     // 'TOTP' | 'HOTP'
            secret: 'BASE32SECRET',
            issuer: 'GitHub',
            label: 'user@example.com',
            algorithm: 'SHA1',
            digits: 6,
            period: 30        // TOTP only
          }
        }
      }
    ]
  }
]
```

| Function | Return type | Description |
|----------|-------------|-------------|
| `parseDataToJson(data)` | `Array<{filename, data}>` | Exports all vault records as JSON |
| `parseDataToCsvText(data)` | `Array<{filename, data}>` | Exports all vault records as CSV |
| `parseOtpToJson(data)` | `Array<{filename, data}>` | Exports OTP credentials as JSON |
| `parseOtpToCsvText(data)` | `Array<{filename, data}>` | Exports OTP credentials as CSV |
| `parseOtpToQrSvgs(data)` | `Promise<Array<{filename, data}>>` | Exports one SVG QR code per OTP credential |

All functions return (or resolve to) an array of file objects. Write each `file.data` to `file.filename` to save the export.

## Related Projects

*   [@tetherto/pearpass-lib-data-import](https://github.com/tetherto/pearpass-lib-data-import)

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](./LICENSE) file for details.
