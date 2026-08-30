# Contributing

Thank you for helping improve 北辰 Pi.

## Before opening an issue

- Search existing issues and test the latest release.
- Remove API keys, OAuth codes, session IDs, personal paths, private source code, and private screenshots.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development setup

Requirements: Windows 10/11 x64, Node.js 24.19.0, PowerShell 5.1 or newer, and Git.

```powershell
npm ci
npm run prepare:runtime
npm run check
npm run dev
```

Create Windows packages with `npm run dist`.

## Pull requests

1. Create a focused branch.
2. Preserve unrelated behavior.
3. Add or update tests.
4. Run `npm run check`.
5. Explain user-visible behavior, risks, and validation.
6. Do not commit generated output, binaries, credentials, sessions, or private logs.

Contributions are licensed under the project's MIT License.
