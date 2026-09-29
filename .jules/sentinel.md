## 2026-03-30 - Unauthenticated Audit Ledger Record Endpoint
**Vulnerability:** The financial audit ledger recording endpoint (`POST /api/finance/ledger/record`) was exposed without authentication checks, allowing unauthenticated client requests to append arbitrary blocks to the server's audit chain.
**Learning:** Even though the ledger computes cryptographic hashes and HMAC signatures server-side, allowing anonymous clients to invoke block appends introduces data injection risks.
**Prevention:** Always enforce strict admin session token validation (`activeAdminSessions`) on sensitive backend financial endpoints like audit ledger recording.
