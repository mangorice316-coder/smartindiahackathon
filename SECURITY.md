# Security Policy & Defensive Architecture

## Supported Versions

| Version | Supported | Security Maintenance Status |
|---|---|---|
| 2.1.x | Yes | Active Security & Vulnerability Audits |
| 2.0.x | Yes | Patch Support Only |
| < 2.0.0 | No | End of Life |

## Reporting a Vulnerability

If you discover a security vulnerability within the Landslide Risk Intelligence System (LRIDS), please report it responsibly:

- **Security Team Contact**: `security@lrids-sih.gov.in`
- **GitHub**: Submit a confidential report via [GitHub Security Advisories](https://github.com/mangorice316-coder/smartindiahackathon/security/advisories).

Please include:
1. Description of the vulnerability and potential impact.
2. Step-by-step reproduction steps or proof-of-concept payload.
3. Affected endpoint, component, or file.
4. Suggested mitigation, if known.

We acknowledge receipt of vulnerability reports within 24 hours and provide validation updates within 72 hours.

## Defense-in-Depth Architecture

1. **Role-Based Access Control (RBAC)**:
   - `ADMIN`: Full system administration, model activation, threshold modification, user management.
   - `ANALYST`: Scenario simulation, report generation, telemetry analysis.
   - `FIELD_OFFICER`: Ground inspection task updates, fissure/crack incident reporting.
   - `READ_ONLY`: Public situational awareness view.
2. **SQL Injection Prevention**: 100% parameterized queries via SQLAlchemy ORM; raw string SQL interpolation is banned.
3. **Cryptographic Checksum Guards**: Model artifacts and datasets are certified with SHA-256 checksums to detect file tampering.
4. **Rate Limiting**: Operational endpoints are rate-limited (60 req/min for telemetry; 10 req/min for model operations).
5. **Immutable Audit Ledger**: All administrative actions, role switches, and alert acknowledgments are permanently logged in an append-only audit trail.\n