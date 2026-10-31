# Internal release 1.0.6 / code 7 — dice and account appearance

Prepared October 30, 2026; signing/publication pending.

The dice component returns no display after the opening roll has a winner. Completed-roll views show compact turn information instead. Seat order is available in Table menu. A new game clears the previous roll; dice appear again after seats are locked. Tie-break rounds remain visible until resolved.

Validation covers authoritative roll requests, intermediate results, disappearance on completion with turn passing enabled or disabled, continued disappearance after turn changes, and reappearance in a new game. Shared browser/app UI; no backend changes.


Account now includes local player appearance settings and a live preview built with the real player-card component. It supports bounded image preparation, removal, themes, accent and display name. Available without joining a room, including for guests. Images remain device-local and do not sync through Supabase. Name/colors can still be saved as a separate cloud player setup.

An explicit, off-by-default setting applies this look when creating/joining a fresh seat. It uses the existing authenticated appearance command and bounded background endpoint. Reconnecting seats are not overwritten, active rooms are not changed by saving Account settings, and an appearance upload failure does not prevent a successful join. Stale-seat checks stop uploads if the user leaves during the request.


Final validation: 954 tests across 150 files passed; production web/mobile builds passed; native assembleDebug passed after final sync. Android Studio backup: android-starter-backup-20261030-203653. Browser verified a real image upload and live preview, persistence after reload, and opted-in application of theme/background to a disposable new seat against the deployed service. The room was closed after verification. Preview screenshot: ../account-appearance-preview.png. Signed release remains pending.

Website deployment of 6b833b1 passed; live Account & settings page verified with upload/theme controls and player-card preview. Screenshot: ../account-appearance-live.png. Android signing/publication is still pending.
