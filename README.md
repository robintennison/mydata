# MyData

Personal data application built with React, TypeScript, Vite, and Firebase. Modules cover banking/deposits/history, jewellery/bills, online records/renewals, and shared settings.

## Local development

Use a current Node.js LTS version supported by Vite (Node 22.12+ or 24). Run `npm ci`, copy `.env.example` to `.env.local`, fill in the Firebase project configuration, then run `npm run dev`.

Firebase configuration in a browser bundle is public configuration, not an authorization boundary. Access to records depends on the deployed Firebase security rules. This repository contains hosting configuration but no checked-in Firestore, Storage, or Realtime Database rules; review/export those separately from the project console before changing access policies.

## Checks

- `npm test`: regression tests for settings, timestamp/error handling, and session data lifecycles. Tests mock Firebase; they never write production records.
- `npm run lint`: full ESLint scan. Existing issues are recorded in `docs/application-health.md`; rules have not been disabled to hide them.
- `npm run build`: TypeScript compilation followed by the production bundle in `dist`.
- `npm run check`: lint, tests, and build, stopping at the first failure.
- `npm run preview`: preview the built bundle locally.

If a Windows global npm shim is broken, repair the Node/npm installation or invoke the bundled npm CLI with `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"` followed by the usual npm arguments.

## Storage and deployment

The app uses the default Cloud Firestore database from the configured Firebase project. Shared settings are stored at `settings/app`; see `docs/settings-persistence.md`. Images and files use Firebase Storage. A legacy file-upload component also uses Realtime Database; do not remove its configuration without retiring or migrating that component.

The Vite entry point is `index.html` → `src/main.tsx`. Compatibility re-export files keep older import paths working while sharing a single implementation.

Build before deploying. Firebase Hosting configuration is in `firebase.json`; `.firebaserc` currently targets `robintennison-mydata`. Publish only when intended: `firebase deploy --only hosting --project robintennison-mydata`. Reload existing browser tabs after releasing fixes.

Keep `.env*`, build output, local audit reports, and `.firebase` cache files out of commits. `.env.example` contains names only and is safe to track.
