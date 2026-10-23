# AI decision review, October 22

Reviewed ten unique recorded games (the five-game export overlaps the ten-game export). Six human wins, three AI wins, one unfinished game. Replays reproduced all completed winners. Review-only human hand snapshots remain separate from the masked observations used by the pilots.

Implemented in Chaos Turbo review 3 and Goat Control v3:

- Do not declare attacks with zero-ATK tokens.
- Prefer absorbing a visible threat to an unknown set. Absorbing a set can still be useful removal, but yields zero ATK/DEF; do not score it as a known high-stat equip.
- Do not duplicate a pending Book on the same target. Hold a second removal trap when a friendly removal already handles that target and the opponent has not added a response.
- Preserve Asura in hand behind Restrict's attack lock.
- Recognize Dark Mimic as a useful Tsukuyomi reset; require available recovery/draw/recruit resources for other friendly flip resets.
- Prefer Nobleman over BLS banishing a set in Main Phase 1 when a face-up attack-position BLS is available.

Regression tests cover token attacks, both players' pending Books, redundant removal, fresh opponent responses, absorption choices, Restrict's lock and Dark Mimic resets. Existing hidden-information invariance and autonomous legality tests remain in place.

Further review candidates, not implemented in this patch: opponent-End-Phase Scapegoat timing without an explicit response window; avoiding low-value searcher removal; deliberate Restrict unlock and relock battle sequencing. These need dedicated timing tests rather than broad score changes. This is a targeted policy improvement, not model training or evidence of tournament strength. The new overall win/loss record is preserved and remains independent of pilot versions.
