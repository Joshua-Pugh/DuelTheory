# Android 1.0.8 — named templates and clearer practice

Prepared October 31, 2026. Version code 9. User approved the web-tested changes for Android. Signed release bundle verified and published to internal testing October 31, 2026 at 1:48 PM Eastern.

- Name and source fields are inside the Create/Join cards.
- Player cards show the current host, including after a transfer.
- Custom life amounts clear only after successful updates; failures retain the amount for retry.
- New templates require names. Signed-in users save/load/update private account templates directly from table setup. Guest templates stay in browser/device storage; JSON export/import remains optional.
- Five cloud game-template slots, enforced by the hosted database. Older templates are retained and editable, including duplicate-name legacy copies. No paid tier or Event Hub is included.
- Searchable template library and clearer Account copy.
- Guided practice explains the controls conversationally. Title text checks ignore case, whitespace differences and a missing final period; the same words are still required.

Website test was approved by the owner. Hosted ownership/quota tests and public-key rejection probes passed during web implementation. Prior full suite: 968 tests passed; later legacy-template and relaxed title checks also passed. This release additionally runs mobile-focused checks and native compilation.

## Android preparation verified

Mobile production build with accounts enabled and Capacitor sync passed. All 29 focused mobile/account/template/practice tests passed across six files. Android Studio project synchronized with backup `android-starter-backup-20261031-133445`; native `:app:assembleDebug` succeeded in 20 seconds. Version 1.0.8 / code 9 is ready for the owner to sign in Android Studio. The signed bundle was subsequently uploaded and published (see below).

## Signed bundle verification

Signed archive: workspace `releases/table-companion-20261028/DuelTheory-internal-v9-signed.aab`.

- 20,003,969 bytes
- SHA-256 `19257432c811c42c03279a46aa226e9217ff10d95615fb645d84f96edbfb1a5c`
- All 78 web assets match the canonical final Android assets exactly; account, template, host-badge and practice markers present.
- Jarsigner verification passed with the usual self-signed certificate/timestamp warnings.

## Publication

Play Console confirmed Active, latest release `1.0.8 - Saved templates and clearer practice`, available to internal testers, version code 9. Review showed Ready to release with no blockers. Testing link: https://play.google.com/apps/internaltest/4700180082221052659 . Workspace proof: `internal-release-1-0-8.png`.
