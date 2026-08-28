## 2025-05-18 - Remove Hardcoded Admin Emergency Authentication Bypass
**Vulnerability:** Emergency admin fallback `1020304` / `admin1234` was hardcoded in `AppContext.tsx` client-side authentication logic.
**Learning:** Hardcoded credential checks in client-side bundles allow attackers to bypass authentication regardless of Firestore credential updates.
**Prevention:** Enforce dynamic authentication exclusively against secure configuration storage or backend services; never hardcode fallback credentials in frontend application code.
