# Reasoning Gate prototype — 2026-10-19

Main Deck: the 40-card Carl Waite list featured at https://www.goatformat.com/reasoning-gate-otk.html. The 15-card Side Deck and nine-card Fusion selection are DuelTheory prototype additions, not a transcription of that tournament's side/extra deck. Download: `public/decks/reasoning-gate.ydk`.

Select Reasoning Gate for either seat in local GOAT practice or a private room. Mirror matches work. Guided coverage includes every supplied Main, Side and Fusion card; private user decks remain private.

## Playing the engine

- Set Scapegoat for the opponent's turn. The turn it is activated still prohibits your summons; a later turn's Sheep Token can pay Monster Gate or Metamorphosis.
- Reasoning opens a Level 1–12 choice for the opponent at resolution. It skips Special Summon-only monsters, stops at the first Normal Summonable monster, and sends it to the Graveyard if the Level matches. No hit reshuffles the picked cards.
- Monster Gate pays the Tribute once at activation, including tokens. The picked Spells reach the Graveyard before Dark Magician of Chaos chooses a recovery target.
- Dimension Fusion costs 2000 LP. Both players choose as many eligible face-up banished monsters as their spaces allow, then all return simultaneously. Improperly summoned Chaos/Fusion monsters cannot return. Sacred Crane triggers separately for each copy. Bottomless respects simultaneous summons.
- Marionette must be face-up both at Spell activation and resolution to gain its counter. Removing two counters is a cost; its destruction effect is repeatable. Blowback/Gatling toss three deterministic coins, with Gatling selecting its non-targeting destruction at resolution.
- Ceasefire flips monsters face-up without their Flip effects, then counts Effect Monsters for damage.

## Framework and verification

`framework/excavation.ts` is a game-independent ordered-pile operation. `seededCoinTosses` in `framework/random.ts` supports deterministic coin results. Game rules, costs and choices stay in `engine/reasoningGateEffects.ts`; the UI narrows authority-generated actions.

Tests cover deck/YDK parity, main/side coverage, costs, misses, DMOC/Crane timing, simultaneous returns, traps, counters, deterministic coin effects, local/mobile opponent declarations, hidden deck privacy, and reveal acknowledgements releasing the owner's picker without replacing the game snapshot. `scripts/reasoning-gate-smoke.mjs` runs a bounded isolated live-room check and leaves its room afterward.

Ruling references: https://www.goatformat.com/rulings5.html, https://www.goatformat.com/rulings6.html, https://www.goatformat.com/rulings2.html.
