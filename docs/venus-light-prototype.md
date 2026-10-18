# Venus LIGHT prototype deck

The 40-card main deck is the player's supplied `goat-deck.ydk`, received October 18, 2026. The provisional preset name is **Venus LIGHT**. Its card IDs and counts are preserved, with no Side or Fusion Deck added. Both seats can select it; custom decks made entirely from covered cards also qualify for guided play. Unsupported cards still force full manual play.

## Added effects

- Venus: repeatable 500 LP activation cost; select a Mystical Shine Ball from hand or Deck at resolution, then its position and zone. Deck searches shuffle.
- Soul of Purity and Light: banish two LIGHT monsters to Special Summon; reduces opposing ATK during the opposing player's Battle Phase.
- Hoshiningen: continuous LIGHT +500 / DARK -400 ATK for both fields, stacking per face-up copy.
- Zaborg: mandatory monster destruction after a successful Tribute Summon, including its own card when necessary.
- Asura Priest: each opposing monster once, no direct attack after attacking monsters, and Spirit return after Normal Summon or being flipped face-up.
- Airknight Parshath: piercing damage and mandatory draw after inflicting battle damage.
- Cannon Soldier / Amazoness Archer / Exiled Force: pay the required Tributes as costs; effects can resolve after their sources leave.
- Reinforcement of the Army: choose an eligible Level 4-or-lower Warrior at resolution, add it, then shuffle.
- Creature Swap: each player chooses their own monster during resolution; preserve positions and lock manual position changes that turn.
- Giant Trunade: return other Spell/Trap cards, with existing attachment consequences. It does not return itself.
- Waboku: battle damage and battle-destruction protection for the turn.
- Solar Ray: count face-up LIGHT monsters at resolution and inflict 600 each.
- Dust Tornado: destroy an opposing Spell/Trap, then optionally Set a hand Spell/Trap. Newly Set cards retain the appropriate activation restrictions.
- Scapegoat: four Defense-position Sheep Tokens; enforce available zones, prior summons, the turn's summon lock, and the restriction on using Sheep Tokens for Tribute Summons. Normal Sets remain possible. Tokens vanish when leaving the field and do not count as reaching the Graveyard. Effect Tributes remain possible.
- Last Will: use the 2005 state-based behavior. Each resolved copy waits for the next qualifying own monster to leave the player's field for that player's Graveyard. Each state gives one optional summon opportunity, expires at turn end, and does not count earlier departures or Tokens. Trigger choices wait for the active cost/chain or battle sequence to finish.

Existing Shining Angel, D.D. Warrior Lady, Magician of Faith, and shared Spell/Trap implementations are reused.

## Historical sources

Archived Upper Deck card FAQs and dated judge-list rulings, preserved by GoatFormat.com:

- [Last Will, including the January 20, 2005 timing clarification](https://www.goatformat.com/rulings5.html)
- [Scapegoat and related restrictions](https://www.goatformat.com/rulings7.html)
- [Asura Priest attacks and Spirit return](https://www.goatformat.com/rulings1.html)
- [Giant Trunade does not return itself](https://www.goatformat.com/rulings3.html)

This remains the current local prototype: no AI, network duels, sideboarding, or Fusion mechanics are added in this pass. Effect coverage does not certify every interaction with unsupported cards.

## Exports

Both JSON and YDK downloads retain the chosen deck name with a ` - GOAT` suffix. Unsafe filename characters are replaced, empty names fall back to `Untitled Deck`, and an existing suffix is not duplicated. YDK carries a `#name` comment as well as the format-neutral card IDs.

## Validation

Regression tests cover the exact forty cards, guided coverage, unsupported-card fallback, costs, resolution choices, battle effects, token zone integrity, Last Will timing/multiple copies, and a deterministic token-summon replay. Browser verification confirms Venus LIGHT can be selected against Chaos Turbo with guided effects enabled.
