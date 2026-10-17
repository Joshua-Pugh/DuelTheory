# Ritual deck effects and interaction update — October 16, 2026

Source: `C:/Users/joshu/Downloads/goat-deck.ydk` (40 Main Deck cards, 30 unique names, 15 Side Deck cards). The source file was read, not changed. A regression fixture preserves the exact list.

## Interaction changes

- Ritual Monster selection advances immediately on click. Tribute/material selection advances as soon as it matches a legal material set. No redundant confirmation button; the player still chooses the destination zone.
- Graceful Charity records the actual three drawn instance IDs in the resolution snapshot. The discard picker separates Just drawn from Already in your hand; cards in either group may be discarded. Both groups share one two-card selection and confirmation.
- Attacks and attack replays name a face-down target by zone, not identity. Attack declaration logs also hide the name. At the battle flip checkpoint the engine pauses, shows the revealed card and text, then resumes damage after Continue battle.
- Per the user's explicit opening-rule request, the starting player keeps five cards and skips the turn-one draw. The second player draws normally. This supersedes the earlier first-player-draw behavior documented in prior handoffs.
- Ring can end in a drawn game when both players lose all LP simultaneously; the completion dialog supports that outcome.

## Main Deck coverage

All 30 unique Main Deck names have core activation/resolution paths. This means executable support for the tested effects, not certification of every historical timing edge or cross-card interaction.

| Card | Effect path |
| --- | --- |
| Black Luster Soldier - Envoy of the Beginning | Added in this pass |
| Book of Moon | Existing support retained |
| Breaker the Magical Warrior | Added in this pass |
| Call of the Haunted | Added in this pass |
| Chaos Sorcerer | Added in this pass |
| Contract with the Dark Master | Existing support retained |
| Dark Magician of Chaos | Added in this pass |
| Dark Master - Zorc | Added in this pass |
| Delinquent Duo | Added in this pass |
| Graceful Charity | Existing support retained |
| Heavy Storm | Added in this pass |
| Magician of Faith | Existing support retained |
| Manju of the Ten Thousand Hands | Existing support retained |
| Mirror Force | Existing support retained |
| Mystical Space Typhoon | Existing support retained |
| Nobleman of Crossout | Added in this pass |
| Pot of Greed | Existing support retained |
| Premature Burial | Added in this pass |
| Ring of Destruction | Added in this pass |
| Sakuretsu Armor | Existing support retained |
| Sangan | Existing support retained |
| Senju of the Thousand Hands | Existing support retained |
| Shinato's Ark | Existing support retained |
| Shinato, King of a Higher Plane | Added in this pass |
| Sinister Serpent | Added in this pass |
| Snatch Steal | Added in this pass |
| Thunder Dragon | Existing support retained |
| Torrential Tribute | Added in this pass |
| Tribe-Infecting Virus | Added in this pass |
| Tsukuyomi | Added in this pass |

New paths include Chaos summon costs and once-per-turn banishing; BLS second attack; Tribe discard and declared Type; Breaker counter, ATK bonus and destruction; Tsukuyomi setting and End Phase return; historical Sinister Serpent recovery and Dark Magician of Chaos recovery/banishment; Zorc's replayable die roll and post-roll target choice; Shinato damage; Heavy Storm; Nobleman; Delinquent Duo's random discard and opponent choice; Premature Burial, Call and Snatch links; Ring and Torrential.

Normal Spells and Ritual Spells can activate from hand or when previously Set. Revival excludes Spirits and requires proper initial summoning for Ritual/Chaos monsters. Linked revival/control cards use shared zone-safe movement, including destruction versus return-to-hand distinctions.

## Side Deck follow-up

This pass prioritized the Main Deck. These side-only names still need their own implementation/interaction pass: Spirit Reaper, Asura Priest, Kycoo the Ghost Destroyer, Dust Tornado, Trap Dustshoot, Waboku, Threatening Roar, Swords of Revealing Light, Giant Trunade and Mind Control. D.D. Warrior Lady and Nobleman already have effect paths.

## Practical limits

The engine still uses bounded response windows and partial historical priority/SEGOC handling. Summon-response handling currently focuses on Torrential; generic open-state fast-effect priority, optional effect timing choices, and more involved control/equip interactions need further verification. Multiple Snatch effects, field-full control reversion, full Damage Step effect timing, and effects outside this deck are not tournament-certified. Sideboarding, AI and match scoring remain future work.

Historical descriptions in the duel inspector override modern catalog errata for Sangan, Sinister Serpent, Dark Magician of Chaos and Ring. Current official card details were consulted for [Tsukuyomi](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=5780&ope=2&request_locale=en), [Tribe](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=5660&ope=2&request_locale=en), and [Chaos Sorcerer](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=5833&ope=2); current text alone does not establish historical rulings.

## Verification

- 165 tests across 35 files passed, including 27 new tests for effect costs, targets, linked movement, all six Zorc results, simultaneous Ring loss, hidden attack descriptions, Graceful groups, exact Main Deck coverage, and replay using the supplied deck.
- Browser: actual supplied deck, fixed test seed 1194. Starter retained five; Player 2 drew to six. Graceful showed exactly three new cards alongside the previous hand. Ritual clicks advanced directly through monster/materials/zone; replay matched. A face-down Magician of Faith was hidden until battle flip, then displayed before calculation.
- Production build verified before installation.

## Changed source files

`src/App.tsx`, `src/EnginePreview.tsx`, `src/DuelField.tsx`, `src/duelField.css`, `src/duelRoom.css`, `src/duelInteraction.ts`, `src/duelLifecycle.ts`, `src/engine/model.ts`, `src/engine/rules.ts`, `src/engine/ritualDeckEffects.ts`, `src/services/GameService.ts`, updated opening-rule tests, `src/engine/ritualDeckEffects.test.tsx`, and `src/engine/fixtures/ritual-deck-20261016.json`.
