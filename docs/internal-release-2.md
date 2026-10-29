# Internal release 2 — account verification

Prepared version: 1.0.1 / version code 2. The first signed rebuild predates the table-event additions below and must be regenerated before upload.

Build with `VITE_ACCOUNTS_ENABLED=true` before running `npm run android:sync`. The default environment remains account-disabled; do not accidentally replace this native build with a default build before signing.

Verified against the hosted Supabase project: email-code delivery through Resend, sign-in, saving cloud player setups, and the explicitly authorized deletion of the test account through the application. The deletion endpoint returned success and the UI signed out. The temporary local test origin was removed from the hosted function after verification. Authentication checks remained enabled throughout.

Full suite: 924 tests passed across 142 files. TypeScript, website/mobile production builds and native assembleDebug passed. The mobile package includes the updated privacy notice and account-deletion instructions. Cloud setups are explicit saved copies; they do not automatically modify active guest tables. Player accent application to live table panels is still pending.

Added foreground table notifications: title holder changes, elimination/concession and game result, with a device-local mute/volume control. Uses original synthesized audio; no new assets, tracking or permissions. Initial/reconnected room snapshots, resets and repeated polls remain quiet. Background/system push notifications are not included. Physical-device listening remains part of internal testing.

New profile-based tables default to turn passing off. The host can toggle it in the room; the first-player roll remains available. The server rejects guest/stale configuration and end-turn/timer actions while disabled. Changing the setting disables the timer. Earlier rooms retain their existing behavior. Deployed shared-table Worker version: 26a821fb-b30f-4c05-8191-8222baf1d23f. The live disposable-room test passed ownership, optional turns, stale updates, timer/undo idempotency, title transfers, defeat/corrections and reset. Browser host-toggle and 390px packaged-mobile layout checks passed.

Android Studio refreshed with backup android-starter-backup-20261028-205749. Generate the signed release AAB after this refresh; do not upload the earlier rebuild.

The existing internal tester list was reselected and saved after Console showed the track inactive. Console then showed Active; installation on the user's physical phone still needs confirmation.

Remaining release steps: verify native compilation, generate a signed release AAB with the existing upload key, verify its signature and packaged assets, upload version code 2 to internal testing, and test sign-in and reconnection on a Play-installed physical device. Publish the updated website privacy/deletion pages and complete the corresponding Play account/data disclosures before broader distribution. No ads, billing, or paid unlocks are enabled.

The test account was deleted with permission. Signing in again recreates it; previous cloud setups are intentionally gone. Local setups and guest rooms remain separate.
