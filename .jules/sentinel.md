## 2025-05-18 - OTP Authentication Hardening in Express Server
**Vulnerability:** Unbounded OTP verification attempts (brute force), non-constant-time hash comparison (timing attack), and potential test OTP leakage in production when SMTP credentials were unconfigured.
**Learning:** `server.ts` maintained OTP state in-memory without attempt counts and relied on string comparison `!==` for hashes.
**Prevention:** Always enforce `MAX_OTP_ATTEMPTS` to invalidate active OTPs on repeated failures, use `crypto.timingSafeEqual` for secret hash comparison, and explicitly restrict test-mode response properties to non-production environments (`process.env.NODE_ENV !== 'production'`).
