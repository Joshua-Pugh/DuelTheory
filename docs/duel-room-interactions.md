# Duel room interaction handoff

Updated October 15, 2026. The user's Duelingbook solo recording informed interaction behavior; DT retains its own layout, branding, and card back.

## Playing

- Click a hand or field card to open its compact action menu. Zone, target, and material permutations are grouped under one action.
- Choose Set or a summon, then click a highlighted field zone. Both players' Monster rows face the center; Spell / Trap rows are behind.
- Activate a supported Spell directly. A free S/T slot is assigned automatically; effects with targets ask you to click a highlighted target. Rituals ask for the Ritual Monster, materials, and destination.
- Search effects open a visual window containing the entire deck in current order (#1 is top). Ineligible choices are disabled. Exact card instances are preserved, including duplicate copies. The rules engine shuffles after resolution.
- The DT crest card back is used for deck stacks, hidden hands, and face-down cards. Opponent hidden cards cannot be inspected from the other viewing seat.
- Click graveyard or banished piles to browse their contents.
- Enable Tabletop tools for manual Special Summons, unmodeled Spell/Trap activations, card movement, drawing, and deck search/shuffle. These are explicitly recorded as manual actions. Activating an unmodeled card places it face-up; players resolve the effect and send it to the Graveyard when appropriate.
- Manual deck searches use current order, add exactly the selected instances to hand, and shuffle. Closing a manual deck view also shuffles.

## Architecture

- `src/DuelField.tsx`: board, card menus, placement/target prompts, visual selectors, deck tools, hidden-card handling.
- `src/duelField.css`: isolated duel layout, original CSS card back, accessible selection highlights and dialogs, responsive layout.
- `src/duelInteraction.ts`: source-card action grouping and successive filtering of legal options. UI choices narrow generated legal actions instead of inventing new rules actions.
- `src/EnginePreview.tsx`: session integration, both seats' response controls, tabletop dispatch, body scroll locking.
- `src/services/GameService.ts`: audited tabletop actions, deterministic search/shuffle/draw, replay, rewind, and same-zone face-up Spell movement.
- `src/duelInteraction.test.tsx`: grouping, placement, deck order, distinct-copy choice, material selection, hidden information, row order, search/shuffle/replay/rewind integrity.

## Validation and limits

116 tests passed. Browser-tested Set Book of Moon in S/T zone 3; Normal Summon Apprentice Magician in Monster zone 2; Thunder Dragon search with explicit selection, response passes and shuffle; manual deck search; immediate Pot of Greed activation; replay verification. Inspector image bounds remain above description text.

This is a local practice duel with a bounded GOAT rules engine, not complete effect automation or a networked multiplayer implementation. Tabletop tools do not claim rules verification. Existing card-ID/ruling coverage issues are separate from this interface update.

## Next work session

See [duel-roadmap.md](duel-roadmap.md) for the user's next-session priorities: EP completes the turn, automatic draw/discard effects, broader GOAT effect coverage, then AI and curated tournament archetype decks.

## October 16 flow update

See [duel-flow-update-20261016.md](duel-flow-update-20261016.md). This supersedes the earlier draw and phase flow: fresh shuffles by default, automatic animated turn draws, Graceful draw/discard resolution, on-field effect prompts, and EP completing the turn. Final regression suite: 130 tests passed.
