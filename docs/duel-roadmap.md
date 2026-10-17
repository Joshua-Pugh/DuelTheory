# Duel mode work list

User priorities recorded October 15, 2026. Documentation only; resume implementation in the next work session.

## Next session

1. **EP should finish the turn.** Clicking EP should enter the End Phase, handle required End Phase effects/response opportunities, then end the turn and pass to the next player without requiring another Next phase click under the card viewer. Mandatory choices must still be resolved.
2. **Automate card effects instead of repeated deck-tool clicks.** Prioritize draw/discard flows and commonly played GOAT cards. Graceful Charity should draw three cards as its effect resolves, then present a hand selector requiring two discards. Pot of Greed should draw two automatically through its supported activation and resolution; investigate why the user's current play flow still leads to manual drawing. Preserve normal chain/response timing.
3. **Expand and verify GOAT effect coverage.** Load executable effect behavior as well as card text; validate card IDs, costs, legal activation windows, targets, player choices, resolution, and resulting card movement. Track supported versus manual-only cards explicitly. Keep undo and replay reliable.

## Product direction and order

- Continue refining this duel mode until it is clean, intuitive, and highly polished. It is the heart of DuelTheory. Prioritize interaction and rule correctness before adding an AI opponent.
- Once the duel foundation is stable, add an AI opponent using the same validated game actions.
- Add selectable, historically appropriate tournament GOAT deck lists to play against: **Chaos Turbo, Goat Control, Reasoning Gate**, and other established competitive archetypes.
- “Preconstructed” here means curated versions of real tournament-played archetypes, not invented starter decks. Research and attribute deck-list sources, validate GOAT legality, and ensure effects used by the curated decks are implemented before presenting them as automated AI opponents.

## Current handoff

See `duel-room-interactions.md` for the implemented interface, modified files, browser checks, and existing automation limits. Last completed verification: production build succeeded; 116 tests passed.

## Progress — October 16, 2026

EP/turn handoff and the Graceful Charity/Pot draw flows are implemented and verified. On-field search/resolution prompts, automatic turn draws, deal/draw animations, and fresh default shuffles are also complete. See [duel-flow-update-20261016.md](duel-flow-update-20261016.md) for validation and remaining coverage. Broader card effects, End Phase effects and hand-limit cleanup, AI, and sourced tournament decks remain future work.

Opening coin toss and duel-completion popup are complete. Play again starts a fresh single game; Exit duel clears the completed session. See [duel-lifecycle-20261016.md](duel-lifecycle-20261016.md). Verification: 138 tests passed and production build succeeded. Best-of-three matches remain deferred until the duel foundation is polished.

## Ritual deck pass — October 16, 2026

See [ritual-deck-effects-20261016.md](ritual-deck-effects-20261016.md) for the supplied deck audit, new effect paths, streamlined Ritual selections, separated Graceful draws, battle reveals, and requested opening draw change. Main Deck core effects have a first implementation pass; Side Deck cards and broader timing/interaction verification remain. Latest validation: 165 tests in 35 files passed.

## Visible effects — October 16, 2026

Zorc now rolls visibly before applying its result; field-to-GY moves animate; Duo uses a shuffled face-down selection followed by the chosen discard; empty back rows skip response prompts as requested. See [visible-effects-20261016.md](visible-effects-20261016.md). Latest validation: 173 tests in 36 files passed, browser flow verified, production build passed.

## Counters and battle shortcuts — October 17, 2026

Breaker counter placement/badges, center-field tabletop dice/counters, right-click menus and logged overrides, paused automatic progression in Manual, quick attacks and Attack with all are implemented. See [battle-tools-20261017.md](battle-tools-20261017.md) for behavior, limits and file list. Validation: 178 tests across 37 files and production build pass; browser attacks and 45-action replay verified.

## Response and Ritual follow-up — October 17, 2026

See [response-ritual-flow-20261017.md](response-ritual-flow-20261017.md): skip response windows only when no supported legal response exists, own-summon Torrential, Call destruction cleanup, field-first Ritual activation/resolution, search and hand-to-field animations. Next: opponent tournament-deck selector BEFORE the coin flip, then effect coverage for sourced Chaos Turbo, Goat Control and Reasoning Gate lists; AI decision-making remains separate.
