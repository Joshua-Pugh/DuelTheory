# Chaos Turbo prototype deck

The preset reproduces the 40-card main deck from Riccardo Lari (Riclar91), winner of the 2020 GOAT Format World Championship, as published at https://www.goatformat.com/chaos-turbo.html. This is an established tournament baseline, not a claim that one list is universally best. It has 22 monsters, 11 spells, and 7 traps. No invented Side or Fusion Deck was added.

## Player flow

In Duel Arena, select the player and opponent decks before starting the coin flip. Either seat can use the current Deck Builder deck or Chaos Turbo. The preset can be opened in Deck Builder to customize and save, or downloaded from `public/decks/chaos-turbo.ydk` for import elsewhere. Local practice still controls both seats; there is no AI opponent yet.

Support is assessed from the actual active card IDs, regardless of deck name or order. Unsupported main-deck effects, any Extra Deck, missing catalog entries, invalid main-deck size, or format validation errors force the **entire session** into full manual play. Side Deck cards are inactive because sideboarding is not available. A deck containing only covered cards can use guided effects even if its exact list differs from the preset.

The session authority defaults to support checking. Manual-only sessions return no automated legal actions and reject rules dispatch. The lock survives Undo; automatic draws, effects, and battle resolution never run. Manual draw/search/shuffle, movement, position, LP, counters, dice, and phase/turn controls are available. Actions are logged as unverified. Engine unit tests use an explicit `fixture` policy for intentionally tiny or illegal decks; the app never selects this policy.

## Added effect coverage

- Gravekeeper's Spy: Flip trigger, valid deck selection, Attack/Defense choice, free-zone selection, shuffle, and summon response.
- Night Assailant: Flip destruction and hand-to-Graveyard recovery. Discard/cost triggers wait until the current chain finishes. It cannot recover itself but may recover a different copy. Both copies discarded together can form a trigger chain.
- Kycoo: battle-damage trigger, optional zero/one/two monster banishment, and opposing Graveyard-banish restriction. A monster just destroyed in that battle is excluded from the selection. Kycoo can also trigger when defending.
- Card Destruction: both hands discarded before either draws, followed by deferred discard triggers and normal deck-out handling.
- Raigeki Break: discard cost, valid field target, and destruction without negating an already activated Spell.
- Trap Dustshoot: four-card activation threshold, hand inspection at resolution, monster selection, owner-deck return and shuffle. The whole hand is visible; non-monsters are not selectable. No-monster hands can be acknowledged without an invalid target.

Mystic Tomato's catalog ID is 83011278. The previous engine constant used 83011277; the real ID now receives recruitment coverage. The old ID remains recognized by the low-level battle hook for existing fixtures.

Free-chain windows after draws and phase changes open only when legal Quick-Play/Trap responses exist. This makes Dustshoot available before the opponent's Main Phase plays. Empty response opportunities are skipped.

Historical references: https://www.goatformat.com/rulings5.html (Night Assailant), https://www.goatformat.com/rulings4.html (Kycoo), https://www.goatformat.com/rulings7.html (Trap Dustshoot). The previously requested first-player skip-draw house rule remains unchanged.

## Validation and limits

The preset/YDK equivalence, all active-card coverage, new effect paths, historical Kycoo targeting, draw-phase response windows, and forced-manual/replay behavior have regression tests. Browser checks cover pre-coin deck selection, the builder preset, centered viewer glyphs, and locked manual drawing/LP/turn changes.

“Supported prototype” means the listed card effects and choices are implemented. It is not certification of every tournament ruling, priority interaction, or arbitrary cross-card combination. The engine remains a prototype; more playtesting is needed before competitive or AI play. Manual matches rely on players to perform effects and battle accounting themselves.

The GitHub Pages workflow remains manually triggered. Push the commit, then run **Deploy DuelTheory to GitHub Pages** in GitHub Actions to publish it.
