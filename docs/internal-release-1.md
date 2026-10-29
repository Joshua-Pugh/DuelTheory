# Internal release 1 — October 28, 2026

Google Play app: DuelTheory / com.dueltheory, app ID 4972911437566920042.

Status: published to internal testing on October 28, 2026. Console confirms Active and Available to internal testers. One owner-provided Google account is selected through the internal tester list. Release preview showed Ready to release with no warnings after tester setup.

Version code/name: 1 / 1.0. Minimum API 28; target API 36. Console download estimate: 19.4 MB.

Source artifact: `C:/Users/joshu/AndroidStudioProjects/DuelTheory/app/release/app-release.aab`.

Preserved copy: `../releases/table-companion-20261028/DuelTheory-internal-v1-signed.aab`.

SHA256: `8647736a66b6fe1afa26baf413023b358c4c4d5f09bf8c2bd8893ec85f7d735f`.

Verification: jarsigner verified the signature. The self-signed upload certificate is expected; this is not a public TLS certificate. All 68 packaged public assets match the Capacitor-synced canonical build byte-for-byte. Hidden Vite build metadata is excluded by Android packaging. Native assembleDebug passed after project refresh; the last full test pass was 917 tests with two workers, and website/mobile production builds passed.

Release name: 1.0 - Table Companion internal test.

Notes: Initial internal test of the tabletop tracker, shared tables, custom life/counters, first-player roll and reconnection. Accounts, advertisements, purchases and the Ashen Throne simulator are disabled. Email delivery and end-to-end account verification remain separate work.

Join URL: https://play.google.com/apps/internaltest/4700180082221052659 . The tester must sign in with the authorized Google account and opt in. Temporary store name: com.dueltheory (unreviewed). Next: verify a Play-installed copy on a physical device. Internal testing does not satisfy the separate closed-test production-access requirement.

No private signing key or passwords are stored in this repository.
