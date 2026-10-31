# Android 1.0.7 — flexible table adjustments

Prepared October 31, 2026. Version code 8. Signed user bundle verified and published to internal testing October 31, 2026 at 11:40 AM Eastern.

- Host chooses life tap and hold-repeat amounts in setup or during a table. Portable saved profiles retain these values; older profiles default to 1 and 10.
- Player-card dropdowns contain counters/source damage and custom life amounts. Life adjustments support 1–99,999 per entry, subject to total bounds, with atomic undo.
- Removed duplicate More controls menu. Only the host sees turn-passing configuration and can add/remove table counters. Removing a counter deletes its totals and clears undo snapshots so it cannot be resurrected by undo.
- Shared title claim/clear remains available to players. Host retains title configuration.
- Uploaded backgrounds use a lighter overlay and translucent total panels, with shadows for legibility. Account preview uses the same treatment.
- Visible table polling is one second after completion, with no overlapping reads, no background/offline polling, and exponential error backoff up to 30 seconds. This doubles the maximum healthy polling request rate versus the previous two-second interval; production-scale capacity has not been load-tested.

Validation: 959 full-suite tests passed, then an additional UI regression verified custom 2400 deduction and guest settings visibility. Website/mobile builds and native assembleDebug passed. Live disposable 8000-life table verified 1900/2400 deductions, host settings, shared counter add/remove and guest rejection, and was closed afterward.

Table service deployed version 7f6790ff-5d3c-4cbc-b7d4-39dceb8109af.

## Presentation pass before signing

The same pending 1.0.7 bundle also groups the menu into Table, Players, Game tools, Appearance and History. One panel is visible at a time; drafts remain mounted and keyboard navigation/Escape are supported. Two- and three-player desktop grids use all available columns, with a compact two-player opponent strip on phones. Entry and Android Home emphasize shared tables and reusable profiles. The guided lesson now teaches Start Game, the counter dropdown and the Game tools tab. No analytics, promotional posts or new major features were added.

Presentation verification: complete guided lesson, menu category/keyboard/draft tests and guest restrictions passed. Full suite had 959 passing tests and two timing failures in the mobile file while production builds ran concurrently; rerunning that entire mobile file alone passed all six tests. Website/mobile production builds succeeded. A live disposable two-player table was joined through the browser; reconnect and opening dice worked. Phone viewport 390 had 375px document/scroll width with no horizontal overflow. Final screenshots: table-layout-polish-phone.png and table-menu-polish-phone.png (workspace artifacts).

## Signed bundle

Preserved file: `releases/table-companion-20261028/DuelTheory-internal-v8-signed.aab` (workspace release archive).

- 20,001,382 bytes
- SHA-256: `7f50b7ad5b1edd4f53c712e458ad8f901b85a6784169a352aa3ab6f0895ab0ab`
- All 78 public web assets match the final Android source byte-for-byte.
- Jarsigner verification passed (normal self-signed upload-certificate warnings).

Publication confirmed: Active, latest release `1.0.7 - Your game, your way`, available to internal testers. Google accepted version code 8 with no release blockers. Testing link: https://play.google.com/apps/internaltest/4700180082221052659 . Screenshot: workspace `internal-release-1-0-7.png`.
