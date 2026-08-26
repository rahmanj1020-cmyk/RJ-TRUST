## 2025-05-18 - Unintended Production Exposure of Administrative Reset Utilities
**Vulnerability:** Emergency DB wipe (`forceResetAllStats`) and admin credential reset (`forceResetAdmin`) helper functions were imported in `src/main.tsx` and exported directly onto the global `window` object in client bundles.
**Learning:** Development and debug reset scripts placed inside `src/` can accidentally be included into production build bundles, allowing any client with devtools access to call `window.forceResetAllStats()` and clear Firestore collections.
**Prevention:** Keep debug / database reset scripts out of production frontend source entrypoints or gate them strictly behind server-side authentication/environment checks.
