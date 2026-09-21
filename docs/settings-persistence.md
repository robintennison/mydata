# Settings persistence and recovery

All ten settings fields already use Cloud Firestore in the configured Firebase project, at `settings/app`: `locations`, `boughtFor`, `goldRatePerGram`, `makingTaxPercent`, `resaleDiscountPercent`, `liabilities`, `showInactive`, `showDelete`, `EMW_interest`, and `EMW_Date`. No Realtime Database migration is required. Firebase is the platform that includes Cloud Firestore. The existing document and unknown fields are preserved.

The previous provider wrote the entire default document whenever a listener reported a missing document, without checking whether the snapshot came from the cache. This was an overwrite risk, not proof of the cause of historical incidents. It also listened before authentication, silently accepted failed saves locally, and renamed list entries with separate remove/add writes.

The provider now subscribes after authentication, never writes from a read/error callback, validates stored and edited values, and updates only explicitly edited fields. Missing older fields receive consistent read-time defaults; these are never automatically persisted. Invalid stored fields produce an error instead of silently replacing stored data. Failed writes return false and leave editors open. Renames use a Firestore transaction against the current list. Banking reads the same shared settings provider.

If the document is missing or invalid, the Settings page reports it and offers Reload. Restore the correct values from a trusted backup in Firestore. Do not reconstruct personal settings from application defaults. This change cannot recover already lost values. No production data or security rules were modified by this code change.

Deploy the rebuilt application through the existing hosting workflow and reload older browser tabs so they stop running the old write logic. Confirm the authenticated account has read/update permission for `settings/app`; transaction renames also need read permission. A live authenticated browser/Firestore check is still needed after deployment.

Regression checks: `npm run test:settings` (Node built-in test runner, mocked Firestore/auth/hooks; no production access) and `npm run build`. The tests cover absent cache/server documents, auth transitions, failed and pending writes, validation, partial updates, and atomic renames preserving concurrent additions.

Firebase references: https://firebase.google.com/docs/firestore/query-data/listen and https://firebase.google.com/docs/firestore/manage-data/transactions
