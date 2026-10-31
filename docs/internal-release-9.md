# Android 1.0.8 — named templates and clearer practice

Prepared October 31, 2026. Version code 9. User approved the web-tested changes for Android. Signed release bundle pending.

- Name and source fields are inside the Create/Join cards.
- Player cards show the current host, including after a transfer.
- Custom life amounts clear only after successful updates; failures retain the amount for retry.
- New templates require names. Signed-in users save/load/update private account templates directly from table setup. Guest templates stay in browser/device storage; JSON export/import remains optional.
- Five cloud game-template slots, enforced by the hosted database. Older templates are retained and editable, including duplicate-name legacy copies. No paid tier or Event Hub is included.
- Searchable template library and clearer Account copy.
- Guided practice explains the controls conversationally. Title text checks ignore case, whitespace differences and a missing final period; the same words are still required.

Website test was approved by the owner. Hosted ownership/quota tests and public-key rejection probes passed during web implementation. Prior full suite: 968 tests passed; later legacy-template and relaxed title checks also passed. This release additionally runs mobile-focused checks and native compilation.

## Android preparation verified

Mobile production build with accounts enabled and Capacitor sync passed. All 29 focused mobile/account/template/practice tests passed across six files. Android Studio project synchronized with backup `android-starter-backup-20261031-133445`; native `:app:assembleDebug` succeeded in 20 seconds. Version 1.0.8 / code 9 is ready for the owner to sign in Android Studio. No Play upload has occurred yet.
