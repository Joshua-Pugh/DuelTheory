# Visible effect resolution — October 16, 2026

## Changes

- Zorc resolves into a `pendingRoll` checkpoint. A gold 3D six-sided die rolls across the screen, lands, and displays the recorded result. After 2.2 seconds the UI submits `COMPLETE_DIE_ROLL`; destruction happens only then. Rolls of 3–5 immediately open field targeting. The recorded result is deterministic for replay and Undo; the browser never generates a different cosmetic result.
- Field-to-Graveyard transitions animate the revealed card from its cached field rectangle into its owner's GY pile. Multiple destroyed cards can move concurrently. Spell cleanup and field costs also animate when a source rectangle exists. Hand discards, deck movement, banishment and Undo are not misrepresented as field destruction. Reduced-motion settings omit flights and shorten the die checkpoint.
- Duo pays its cost and resolves into `pendingRandomDiscard`, preserving every opposing hand card until the selection. The engine shuffles a private ordering; the targeted player's modal receives only the number of face-down cards. Clicking a slot submits its index, not a card identity. The engine discards that slot, announces the revealed discard, then requires one normal chosen discard if any cards remain. One-card hands finish after the hidden pick. Both choices, the ordering and the LP cost replay correctly.
- At the user's request, chains auto-pass when both Spell/Trap rows have no other cards. Resolving chain sources are excluded from the occupancy check, so an activated Normal Spell does not create its own response popup. Other Set or face-up back-row cards retain the prompt. This is the requested board-occupancy shortcut, not a general determination of every legal response: it also skips potential hand responses when the rows are empty. Mandatory choices, search decisions and battle reveals remain explicit.

## Verification

173 tests across 36 files passed. New tests check pre-die state preservation, recorded results, hidden slot selection and seat/index validation, two-step and one-card Duo resolution, replay/rewind, six die faces, empty/occupied back rows and field-to-GY detection.

Browser checks used the user's supplied Ritual deck at seed 1025. Duo auto-resolved without a Yes click, paid 1000 LP, offered five unknown cards, revealed the selected discard, required one further chosen discard, and passed replay verification. A temporary tabletop setup placed Zorc and an opposing monster for the animation check: the visible roll landed before destruction, the field card flew into GY, and Undo replayed the same result successfully. Tabletop setup was correctly marked in replay history.

## Files

- `src/engine/model.ts`, `src/engine/rules.ts`, `src/engine/ritualDeckEffects.ts`: authoritative resolution checkpoints and validated actions.
- `src/EnginePreview.tsx`, `src/duelResolution.ts`: timed roll completion and empty-back-row automatic passing.
- `src/DuelField.tsx`: concealed Duo selection, second-discard announcement, post-roll targeting.
- `src/DuelEffectAnimations.tsx`, `src/duelEffectAnimations.css`: die and GY motion.
- `src/services/GameService.ts`: block manual overrides while these choices are pending.
- `src/duelResolution.test.tsx`, `src/engine/ritualDeckEffects.test.tsx`: regression coverage.

Production build passes. Vite reports its standard advisory for the main bundle slightly exceeding 500 kB; code splitting remains a separate performance task.
