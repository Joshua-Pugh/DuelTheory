# Goat Control prototype

The Main Deck matches the 40-card Lolmarcus list published by GoatFormat.com for his seventh-place finish at Worlds 2020:
https://www.goatformat.com/goat-control.html

`src/data/goatControl.json` and `public/decks/goat-control.ydk` contain the same Main Deck. Sideboarding and AI remain unavailable. Either seat may select the preset, including mirror matches.

The Fusion selection is a separate DuelTheory prototype selection, not an assertion about Lolmarcus's tournament Fusion Deck: three Thousand-Eyes Restrict, plus Flame Ghost, Darkfire Dragon, Musician King, Roaring Ocean Snake and Twin-Headed Thunder Dragon. These provide verified Level 1, 3, 4, 5, 6 and 7 Metamorphosis options. Other Fusion Monsters still force manual play. Polymerization and proper Fusion Summons are not introduced by this batch.

Metamorphosis pays its one-monster tribute at activation, including face-down monsters and Sheep Tokens, and selects a matching-level Fusion at resolution. It does not properly Fusion Summon, so its monsters cannot subsequently be revived from the Graveyard. Pending Sangan triggers from the activation cost wait until resolution finishes. Scapegoat's summon restriction still applies.

Thousand-Eyes Restrict includes absorption, equipped-monster ATK/DEF, hidden face-down equipment, attack/manual-position locks, and battle-destruction substitution. Book of Moon/Tsukuyomi detach equipment and reset the soft once-per-turn ability. Tokens may remain on the field as Equip Cards and disappear when removed. Other continuous modifiers retain the existing engine's bounded support.

Rules references:
- Official Thousand-Eyes Restrict card: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4740
- Archived GOAT Metamorphosis rulings: https://www.goatformat.com/rulings5.html
- Archived GOAT Thousand-Eyes Restrict rulings: https://www.goatformat.com/rulings7.html

`src/engine/goatControl.test.tsx` verifies deck export/coverage, Fusion-zone invariants, costs and resolution choices, tokens, chain timing, absorption/privacy, locks, battle replacement, bounce/revival restrictions and Dark Mimic LV1's Flip draw. Its Level-Up effect has no legal LV3 target in this deck; adding unsupported LV3 still forces a manual match.
