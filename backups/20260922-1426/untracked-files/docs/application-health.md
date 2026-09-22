# Application health check — 21 September 2026

## Completed housekeeping

- Consolidated eight duplicated components, hooks, types, and helpers into compatibility re-exports. Existing imports still work.
- Removed obsolete CRA startup code and a public/index.html fragment that conflicted with the Vite entry point.
- Private Banking, Jewellery, and Online providers now remount on account changes/logout. Their loading callbacks have stable dependencies and initial data updates happen from asynchronous query callbacks.
- Settings display values now derive directly from the confirmed settings source, without a state-copying effect.
- Shared error normalization preserves Firebase error codes and replaces untyped catch blocks. Timestamp parsing handles legacy formats, epoch zero, and malformed input consistently.
- Error notification timers are cancelled when superseded or unmounted.
- Added environment setup documentation, an empty .env.example, test/check commands, and ignore patterns for local configuration/audit reports. Removed the tracked Firebase hosting cache.
- Installed compatible dependency fixes and updated package-lock.json. No forced major updates were made.

## Verification

- TypeScript compilation and Vite production build: passed.
- Full ESLint scan: passed.
- 17 Node regression tests: passed (Firebase/auth/hooks mocked, no production writes).
- Browser smoke check: local login renders; direct /settings navigation redirects unauthenticated visitors to /login; no warning/error console entries were captured. Authenticated CRUD flows were not exercised against production.
- git diff --check: passed.
- Production dependency audit: zero reported vulnerabilities.
- Full dependency audit: one low-severity esbuild development dependency advisory remains. Vite 7.3.5 requires esbuild ^0.27.0; the advisory fix starts at 0.28.1, so repeated compatible npm audit fix does not resolve it. Avoid forcing an unsupported transitive override during routine housekeeping. Track a compatible Vite update. The advisory concerns esbuild’s standalone Windows development server (servedir); this application uses Vite rather than esbuild’s standalone server. See https://github.com/advisories/GHSA-g7r4-m6w7-qqqr .

## Remaining work

The production build still warns about chunks above 500 kB, notably the HEIC decoder and main bundle. The decoder is already a separate lazy chunk; further optimization should be measured rather than hiding the warning.

Deployed Firebase authorization rules are not checked into this repository and were not audited or changed. Export and review them separately before claiming a complete security review. No live records were changed. This housekeeping build has not been deployed.
