## 2025-05-18 - Constant-Time Hash Comparison for OTP Verification
**Vulnerability:** Comparing hashed OTP strings with non-constant-time equality operators (`!==`) in authentication endpoints leaves the application vulnerable to timing side-channel attacks.
**Learning:** Comparing cryptographic hashes directly with string operators leaks timing information based on how many leading characters match before a mismatch is detected.
**Prevention:** Always compare cryptographic digests using `crypto.timingSafeEqual` with buffer length checks to ensure comparison time is constant regardless of input contents.
