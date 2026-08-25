## 2025-05-18 - Cryptographically Secure OTP Generation & Form Auto-fill Vulnerability
**Vulnerability:** Weak pseudo-random number generator (`Math.random()`) was used for OTP creation in `ForgotPasswordModal` and `ChangePasswordModal`. In addition, `ForgotPasswordModal` auto-filled the OTP directly into the input field (`setVerifyValue(code)`), completely bypassing verification.
**Learning:** Security tokens/OTPs must always use Web Crypto API (`window.crypto.getRandomValues`) and must never auto-fill verification fields in client forms.
**Prevention:** Always use `window.crypto.getRandomValues()` for security-sensitive tokens/OTPs and require explicit user input for OTP verification.
