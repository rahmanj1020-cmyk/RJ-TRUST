# Sentinel Security Journal

## 2025-05-20 - Unbounded OTP Validation Retries
**Vulnerability:** The OTP verification endpoint in `server.ts` stored hashed OTPs in-memory without tracking failed attempt counts per email/OTP. This allowed attackers to perform unlimited brute-force attempts on 6-digit OTPs within the 5-minute validity window.
**Learning:** Storing hashed OTPs alone is insufficient for authentication security if validation attempts are unlimited.
**Prevention:** Track failed attempts per OTP (`attempts` counter), invalidate and purge the OTP after reaching `MAX_OTP_ATTEMPTS` (5 failed attempts), and use constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
