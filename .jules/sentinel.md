## 2025-05-18 - Sanitized Firestore Error Handling to Prevent Auth Data Exposure
**Vulnerability:** `handleFirestoreError` in `src/lib/firebase.ts` stringified and threw an object containing user authentication details (email, UID, tenant ID, providerInfo) and raw internal document paths when Firestore operations failed.
**Learning:** Client-side Firestore error handlers can inadvertently bundle sensitive auth state (`auth.currentUser`) into thrown error messages, exposing PII if unhandled errors bubble up to UI or error trackers.
**Prevention:** Always sanitize exception payloads before throwing errors to callers, logging diagnostic details securely without including user credentials or PII in thrown Error objects.
