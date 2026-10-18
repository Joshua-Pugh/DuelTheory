# Brute duel prototype — 17 October 2026

## Start and play

Open **Ashen Throne → Battlefield → New Brute duel**. This starts a local, two-seat Brute mirror match with shuffled 60-card decks, six-card hands and separate Command Stations. The first player is selected randomly and skips the first draw. This is a playtest prototype; it does not provide an AI opponent or online matches.

- Select a hand card and choose **Deploy with effects**. Costs and targets are checked before payment. Units enter fatigued except when Charge applies; Fonts follow the one-per-turn limit and their printed spent-entry rules.
- Burn Ready Fonts into the Ley Basin. A response remains available if it can be paid by burning Ready Fonts, even when the Basin is currently empty.
- The center strip shows the current phase, Clash entries and the player with response priority. Use **Play Player …** or the view switch to control that seat. Use **Pass response** when appropriate. Players without a legal reactive action pass automatically.
- In Combat, select Ready attackers or **Select all Ready**, then **Declare Siege**. Reckless Units must attack if able. Where Rage and attacking-token triggers interact, choose trigger order before responses begin.
- Switch to the defender, click an attacker and then a legal blocker. Multiple blockers can be assigned in click order. Use **Clear blockers** to change assignments; **Confirm blockers** opens the damage response window. Blocker click order currently determines damage assignment order.
- **Next phase** advances to Main II; **End turn** heals surviving Units, clears temporary bonuses, fades essence and asks for discards down to seven. The incoming player receives start effects, readying, optional Maw choices and one draw.
- Card-selection windows finish the pending effect without repaying costs. Searches reveal the selected Brute and shuffle, including failed searches. Pending effects and Clash state survive reloads.
- At victory, choose **Play again** or **Exit to manual table**. The separate manual table and effects sandbox remain available; their controls bypass duel rules and are not equivalent to the full Brute duel.

## Coverage

The Brute catalog has no partial entries remaining. Its effects include entry tokens/damage, sacrifice and exhaust abilities, draw/discard/search and random discards, Outfit and granted abilities, continuous buffs, named counters, start/readied effects, attack triggers, last-known death triggers and Relentless targeting.

Combat handles deployment/combat fatigue, Charge, Reckless, Rage, Ranged/Soar/Siege blocking restrictions, Siege damage, Pierce, Crude Spearthrower pre-combat damage, simultaneous strikes and Duelist’s Edge. Blocked attacks stay blocked if the blocker disappears; Pierce can carry excess to the opposing Station. Tokens created attacking enter fatigued and do not themselves trigger “attacks” abilities. Rage counts other attacking Brutes when its effect resolves, including attacking tokens created before it resolves.

The Keep’s destruction trigger is limited to three per turn. Drum gains Momentum from declared Brute attacks. Warband’s Fury counters count Brute entries, including tokens. Losing defense auras performs lethal-damage checks. Paid abilities persist if their source leaves play, including equipped tokens sacrificed to their own granted ability.

**Creator ruling:** Reckless must attack if able. Korgath’s Call can play Korgath from **hand or Ossuary without paying his Essence cost**. He enters with Charge and +3 Attack for the turn. The Call itself still costs its printed essence, and its five-HP healing checks three Brute sacrifices during the current turn. The catalog text records this ruling rather than the older DOCX wording.

## Framework boundaries

- `src/framework/` supplies data-only effects, costs, choices/continuations, stat quantities, seeded shuffle/random primitives, attachment hooks, events and arbitrary-player alternating priority.
- `src/games/ashen/duel.ts` owns Ashen timing, phases, Clash legality, combat, victory and the Brute-specific card/keyword behavior. These game rules are deliberately outside the portable kernel.
- `src/games/ashen/bruteEffects.ts` is the serializable content pack. Some timing/keyword rules are implemented by the Ashen plugin, so that JSON alone is not a complete standalone game package.
- The existing GOAT engine remains unchanged by the Ashen duel controller. Creator publishing, network authority, AI and Noble effect coverage are separate work.

## Prototype limits

This is local two-seat play with seat switching and Undo, not enforced competitive hidden information. Mulligan setup and a visible opening coin animation are not yet part of the Ashen duel. Multi-block damage follows blocker assignment order. Simultaneous observer effects use stable subscription order; the specific Rage/token interaction exposes an ordering step. There is no certification of every possible tournament timing interaction or of custom decks. The Brute mirror entry point is the supported path; Noble and custom game content remain separate.

## Validation

275 tests across 48 files pass. Integration scenarios cover full catalog/deployment coverage, reactive off-turn play and LIFO resolution, payments, blocking/fatigue, Siege/Pierce, attack tokens and Rage ordering, pre-combat damage, first strike, vanished blockers, paid token-source abilities, Font-funded responses, saved Clash state, turn/start/readied effects, End Phase discards, Relentless, win detection and both Korgath’s Call origins. The existing GOAT and manual-table regression tests pass. GitHub Pages build passes with the existing bundle-size advisory.

Browser checks exercised a shuffled opening, Font deployment/burning, an advanced Font’s token entry effect, phase advancement and automatic turn/draw handoff. Noble is the next deck to implement.
