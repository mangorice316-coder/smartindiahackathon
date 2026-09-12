# Security Architecture & Access Control

## 1. Role-Based Access Control (RBAC)

LRIDS enforces strict separation of duties across 4 operational tiers:

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│ OPERATOR ROLE   │ PERMITTED OPERATIONS                                   │
├─────────────────┼────────────────────────────────────────────────────────┤
│ ADMIN           │ Model activation, parameter calibration, threshold     │
│                 │ editing, user provisioning, system configuration.       │
├─────────────────┼────────────────────────────────────────────────────────┤
│ ANALYST         │ Scenario simulation, what-if parameter tuning, SitRep  │
│                 │ generation, full historical analytics export.          │
├─────────────────┼────────────────────────────────────────────────────────┤
│ FIELD_OFFICER   │ Inspection dispatch updates, evidence logging, crack   │
│                 │ aperture reporting, alert acknowledgment.              │
├─────────────────┼────────────────────────────────────────────────────────┤
│ READ_ONLY       │ Public dashboard view, citizen evacuation notices,     │
│                 │ real-time weather & regional hazard viewing.           │
└─────────────────┴────────────────────────────────────────────────────────┘
```

## 2. Authentication & Session Management
- **Token Mechanism**: JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **Token Lifetime**: 60 minutes with sliding renewal.
- **Password Security**: Passwords hashed using BCrypt (`bcrypt` cost factor 12).

## 3. Threat Mitigation Matrix

| Threat Vector | Mitigation Strategy | Verification Method |
|---|---|---|
| **SQL Injection** | 100% Parameterized queries via SQLAlchemy ORM. | `tests/test_security_hardening.py` |
| **Model Poisoning** | Model checkpoints verify cryptographic SHA-256 signatures before loading. | `test_model_version_checksum_and_integrity` |
| **API Denial of Service** | IP-based sliding window rate limiting. | `test_rate_limiting_enforcement` |
| **Data Snooping / Leakage** | ML training decoupled offline from live runtime dashboard state. | `test_simulation_does_not_mutate_baseline_data` |
| **Audit Log Tampering** | Append-only SQLite audit ledger with sequential tamper detection. | `test_audit_event_immutability` |\n