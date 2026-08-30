# Security Policy

## Supported version

Only the latest GitHub Release is supported with security fixes.

## Reporting a vulnerability

Do not publish credentials, private logs, session files, exploit details, or personal data in a public issue.

Use GitHub's [private vulnerability reporting form](https://github.com/opopile/beichen-pi-desktop/security/advisories/new). Include the affected version, operating system, minimal reproduction, expected and actual behavior, and sanitized evidence.

If a secret was exposed, revoke or rotate it immediately. Deleting it from a later commit does not remove it from Git history.

## Security boundary

北辰 Pi is an autonomous local coding-agent client. In Agent mode it can read and modify files and execute PowerShell with the permissions of the Windows user who launched it. It is not a security sandbox.

Do not open untrusted repositories, install untrusted Pi extensions or skills, or run the application against important files without version control and backups. See [PRIVACY.md](PRIVACY.md).
