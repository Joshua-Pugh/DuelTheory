# Duel start and completion — October 16, 2026

Starting a GOAT duel now opens an animated DT coin toss before dealing. Heads starts Player 1; Tails starts Player 2. Begin duel opens the field with the chosen player holding turn authority and receiving the opening Draw Phase draw. Default sessions use a fresh seed; the optional fixed replay seed reproduces the toss and shuffle.

A completed duel opens a winner popup for Life Point loss or deck-out. Play again starts a new toss and fresh session with the selected decks. Exit duel closes the session and returns to the arena. These are single games; match scoring and best of three remain deferred.

The dialogs support keyboard focus containment, announced results, and reduced motion. Existing undo/replay snapshots preserve the starting seat.

## Files

- src/engine/model.ts: optional starting seat and initial event.
- src/services/GameService.ts: pass starting seat into session creation.
- src/EnginePreview.tsx: opening toss, rematch, completed-session cleanup, progression guards.
- src/DuelLifecycleDialogs.tsx: accessible coin and result dialogs.
- src/duelLifecycle.ts: deterministic toss and result messages.
- src/duelRoom.css: lifecycle dialog and coin styling.
- src/duelLifecycle.test.tsx: lifecycle regression coverage.

## Verification

Production build passed; 138 tests in 34 files passed. Tests cover both starting seats, opening draw and turn handoff, replay, both winner seats, Life Point result messages, genuine deck-out, and clean session restart. Browser checks with a temporary six-card deck verified coin reveal, opening deal, turn progression to deck-out, result popup, rematch, and exit without a stale Return to duel action. The short deck is a test fixture, not a shipped deck list.

Opening-rule update later on October 16: the starting player now skips the first draw per the user request. See [ritual-deck-effects-20261016.md](ritual-deck-effects-20261016.md) for current behavior.
