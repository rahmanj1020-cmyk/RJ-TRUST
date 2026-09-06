## 2026-09-06 - Constant-Time OTP Hash Comparison
**Vulnerability:** String equality operator (`!==`) was used to compare SHA-256 hashed OTPs in `validateOTP`, creating a timing side-channel attack vector.
**Learning:** Node's `crypto.timingSafeEqual` throws a `TypeError` if buffer lengths differ, so buffer length must be checked prior to calling `timingSafeEqual`.
**Prevention:** Always compare sensitive cryptographic hashes or tokens using `crypto.timingSafeEqual` with preliminary buffer length checks.
