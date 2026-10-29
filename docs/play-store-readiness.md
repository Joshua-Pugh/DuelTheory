# Google Play preparation — October 28, 2026

## This build

- Table Companion is the default app experience. AT routes and navigation are hidden. Internal development can opt in with `VITE_MOBILE_AT_PREVIEW=true`; do not set that variable for the initial store build.
- Startup uses the Forge Crest/wordmark, staggered Build / Simulate / Master animation, an indeterminate loader tied to module readiness, a 15-second failure timeout, and retry. Reduced motion removes the animation and minimum intro duration.
- Current-domain table invites are accepted alongside the older GitHub Pages links. Other hosts are rejected.
- Privacy notice is bundled offline at `/table-privacy.html` and included in the website's public files. Review it against the production provider's retention settings before submitting Data safety.
- Shared account UI, private profile database and account-deletion endpoint are prepared, but public sign-in is disabled pending SMTP, end-to-end tests and privacy updates. Billing and ad SDKs are not implemented. This is a free internal-test candidate.

## Before uploading

1. Play Console now shows the Ashen Forge Games personal developer account. The owner created DuelTheory (free app, com.dueltheory), app ID 4972911437566920042. Privacy URL and public support email/HTTPS website are saved as Console drafts. No build has been uploaded.
2. Create and securely back up an upload signing key; use Play App Signing. Do not commit keys or passwords. The generated release AAB remains unsigned until this is configured. Do not upload the debug APK as a production release.
3. Add title, descriptions, support email, launcher icon, feature graphic, real phone screenshots, content rating, target audience, ads declaration and Data safety answers. Do not advertise AT or purchases in the initial listing.
4. Verify privacy URL `https://dueltheory.com/table-privacy.html` works publicly after deployment. Confirm Cloudflare operational log settings/retention. Disclose actual room data, nickname and identifiers; do not claim no collection simply because there are no accounts.
5. Physical Android QA: fresh install; startup and reduced motion; offline start/retry; 2–4 phones; current-domain QR/link and room-code join; reconnect after background/network changes; no duplicated +/- operations; hold-to-repeat stops on release/cancel; undo; dice ties; turn timer; wake lock release; font scaling; keyboard and screen-reader access.
6. Install through Play internal testing and inspect pre-launch reports. If using a new personal developer account, Google currently requires at least 12 testers continuously opted in for 14 days in a closed test before applying for production access. This is not an approval guarantee.

## Paid host release remains separate work

- Managed sign-in with verified sessions; server-side ownership of premium entitlements. Never trust a localStorage premium flag.
- Guest joining remains free. Bind paid hosting to an account, not a shared room code or device seat token.
- Purchase verification, acknowledgement, restoration, refund/revocation handling and cross-platform identity linking before charging.
- Review applicable Play payment rules before adding a web checkout link inside Android. A Stripe link is not an automatic substitute for Play Billing.
- Account deletion in app and through a public website flow; update privacy and Data safety before enabling registration.
- Agree on the actual paid feature set and test it before adding a purchase button.

## Official references checked October 28

- Testing: https://support.google.com/googleplay/android-developer/answer/14151465
- User data/privacy: https://support.google.com/googleplay/android-developer/answer/10144311
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Payments: https://support.google.com/googleplay/android-developer/answer/10281818

## Build commands

`npm run android:sync` builds the default table-focused bundle and updates canonical Android assets.

`scripts/sync-android-studio.ps1` backs up and synchronizes the supplied Android Studio project. Build with JDK 21: `gradlew.bat --no-daemon :app:assembleDebug :app:bundleRelease`.

Browser visual QA could not run in this session because local browser use is disabled in Work settings. Automated tests/build results do not substitute for visual and physical-device QA.

## Validation from this pass

- 910 tests passed across 137 files. Includes startup readiness/failure/retry/reduced motion, default table-only routes, and current-domain invite checks.
- Website and mobile production builds passed. Mobile initial JS is 226,846 bytes before compression.
- Android Studio sync completed with backup `android-starter-backup-20261028-115752`; bundled index hash matches the canonical build.
- Native `assembleDebug` and `bundleRelease` passed. The release AAB was independently checked and is unsigned; it still needs an upload key before Play submission.
- Local outputs: `../releases/table-companion-20261028/DuelTheory-table-test.apk` and `DuelTheory-table-unsigned.aab`.
- AT screens are hidden in the release UI. Original AT assets remain bundled for the retained internal preview; further bundle trimming can follow before submission.
