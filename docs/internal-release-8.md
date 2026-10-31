# Android 1.0.7 — flexible table adjustments

Prepared October 31, 2026. Version code 8. Signed user bundle still required.

- Host chooses life tap and hold-repeat amounts in setup or during a table. Portable saved profiles retain these values; older profiles default to 1 and 10.
- Player-card dropdowns contain counters/source damage and custom life amounts. Life adjustments support 1–99,999 per entry, subject to total bounds, with atomic undo.
- Removed duplicate More controls menu. Only the host sees turn-passing configuration and can add/remove table counters. Removing a counter deletes its totals and clears undo snapshots so it cannot be resurrected by undo.
- Shared title claim/clear remains available to players. Host retains title configuration.
- Uploaded backgrounds use a lighter overlay and translucent total panels, with shadows for legibility. Account preview uses the same treatment.
- Visible table polling is one second after completion, with no overlapping reads, no background/offline polling, and exponential error backoff up to 30 seconds. This doubles the maximum healthy polling request rate versus the previous two-second interval; production-scale capacity has not been load-tested.

Validation: 959 full-suite tests passed, then an additional UI regression verified custom 2400 deduction and guest settings visibility. Website/mobile builds and native assembleDebug passed. Live disposable 8000-life table verified 1900/2400 deductions, host settings, shared counter add/remove and guest rejection, and was closed afterward.

Table service deployed version 7f6790ff-5d3c-4cbc-b7d4-39dceb8109af.
