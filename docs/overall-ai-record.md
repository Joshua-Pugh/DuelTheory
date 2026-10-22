# Overall AI record

AI Practice now shows one record under the device's saved display name: match W–L–D and game W–L–D across both pilots, all deck setups and Single/Best-of-Three formats. Pilot/version grouping is removed from the visible record. Technical pilot identity remains in private game logs for diagnosing decisions.

The new record starts at zero on first load of this release and removes the old setup-history key once. It does not import historical wins from logs. Existing private review logs and the recording preference are preserved. The player explicitly requested this fresh start.

The record uses the same stable device profile UUID as local review logging; a nickname is a label, not authentication. Changing that nickname retains the totals. This is local browser storage, not an account or cross-device leaderboard.

Results are stored by stable match ID and match/game index. Repeated React effects, refreshes and repeated saves cannot increment the same result twice. Completed games count immediately, including games from an unfinished series. A match counts only when completed or forfeited. Draws are tracked separately; a match forfeit does not fabricate unplayed game results. The compact result ledger remains independent of the 500-entry detailed match-history cap.

The old game-log win/loss counters have also been removed so the review archive is not mistaken for the new overall record. Export overall record saves the new totals and recent detailed records; exporting older game logs still preserves their original review data.
