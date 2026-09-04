## 2025-05-18 - Prevent OTP Leakage in Development Fallbacks
**Vulnerability:** Unconfigured SMTP dev fallback in `/api/auth/send-otp` returned plain OTPs in HTTP JSON responses (`testOtp` property and `message`).
**Learning:** Fallback/debug mechanisms designed for local testing can inadvertently leak secrets over network responses if included in response payloads.
**Prevention:** Never include sensitive security tokens, OTPs, or dev credentials in API response bodies. Always constrain dev fallbacks to server-side stdout/logs and fail securely with 500 status in production when services are missing.
