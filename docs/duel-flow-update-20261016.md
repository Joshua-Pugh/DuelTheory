# Duel flow fixes — October 16, 2026

## Implemented

- New sessions use a fresh cryptographic random shuffle seed. Reproducible fixed seeds remain an explicit opt-in for replay testing. Recorded sessions retain their seed and exact initial state.
- The initial five-card deals and later draws animate card backs from each Deck to its hand. Turn draws happen automatically, including the GOAT first-player opening draw. Reduced-motion settings disable flight animations.
- Graceful Charity now has executable behavior: activation, response window, draw three at resolution, a mandatory choice of two discards, then completion of the remaining chain. Newly drawn cards may be discarded. Other actions and manual movement are blocked until the choice is complete; the selector cannot be dismissed into a dead end.
- Both Graceful Charity and Pot of Greed can activate from hand or after being Set. A valid automated action takes precedence over tabletop movement.
- Search triggers offer a small on-field Yes/No prompt. Yes opens the ordered Deck view directly. Optional effects can be declined; mandatory effects must continue. This includes battle recruiter triggers.
- Activated effects have an on-field resolution prompt. Yes passes the responding player's priority and finishes automatically only when the next player has no legal card response. Players can defer resolution to choose a response card; actual response windows remain intact.
- Next phase is beside the phase buttons on the field, not in the card inspector. Phase changes do not ask for generic confirmation. EP enters End and completes the turn; Next from Main 2 also completes End and hands over to the next player. Pending draws/effect choices prevent skipping.
- Turn ownership is displayed explicitly. Local practice includes a Play Player button to operate the other seat. AI is still future work.
- Opening-turn attacks remain prohibited, with a visible explanation and disabled BP shortcut. Next skips that unavailable Battle Phase. Later attack declarations and defender responses work through card menus; unambiguous Damage Step transitions progress automatically.
- Undo suppresses immediate automatic redraw/progression until another user action, so rewinding remains usable.

## Files

- `src/engine/model.ts` — Graceful activation and mandatory discard state/action types.
- `src/engine/rules.ts` — activation generation, paused/resumed Graceful resolution, Set Normal Spell activations.
- `src/services/GameService.ts` — fresh seeds, phase progression, response passing, pending-choice guards.
- `src/EnginePreview.tsx` — automatic draw/battle progression, fixed-seed opt-in, direct phase navigation, resolution handler.
- `src/DuelField.tsx` — field phase controls, effect/search prompts, mandatory discard selector, turn ownership.
- `src/duelInteraction.ts` — Graceful grouping and exact discard selection.
- `src/DrawAnimations.tsx` (new) — visual deal/draw flights and detection that excludes searches and rewind.
- `src/duelField.css` — field prompts and draw animations.
- `src/engine/duelFlow.test.tsx` (new) — regression tests for effects, seeds, turns, response priority, attacks, replay, and animation detection.

## Verification

Browser-tested with a test deck and explicit seed 0: opening animation created ten card flights; initial turn draw happened automatically; Graceful drew three and required two discards; Manju Yes opened search immediately; selected search resolved and shuffled; Pot drew two; EP moved to Player 2's Draw Phase and drew once; Player 2 summoned and attacked, battle damage completed, and Shining Angel's optional search prompted; EP handed back to Player 1. Replay verification succeeded after 34 recorded actions.

Regression suite: 130 tests passed across 33 files. Production build verification recorded with delivery.

## Coverage still to do

This update does not implement every GOAT effect. Tsukuyomi, other unmodeled effects, broader End Phase effect handling and hand-limit cleanup still need dedicated implementations and tests. Tabletop tools remain marked manual. AI and curated tournament decks remain later roadmap items.

## Rules references

- [Official Graceful Charity text](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4812&ope=2&request_locale=en): draw three, then discard two.
- [GOAT basic mechanics](https://www.goatformat.com/basics.html): first-player turn-one draw and historical response/priority context.
