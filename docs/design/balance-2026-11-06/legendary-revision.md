# Engine-preserving starter revision and legendary cost review

November 6, 2026. Supersedes the initial draft's starter cuts. **Design candidates only: no live deck, cost, effect, tutorial or saved duel has been changed.** The creator has accepted reserving some legendary Units in principle; the specific selections and prices below are recommendations for testing, not approved final card balance.

## Starter identity

Keep one clear legendary combat payoff in each starter, supported by the existing non-legendary finishers. Remove secondary legendary packages before removing the tools that make the main engine function.

| Starter | Legendary retained | Engine restored relative to the first draft | Additional finishing routes retained |
|---|---|---|---|
| Brutes | Skarn the Unchained | Drum of the Pit: attacks produce Momentum, which can find the needed Brute | Ironhide Catapult, Siegebreaker Ram, Bonecrusher Catapult, the Soar attackers and Frenzied Stampede |
| Nobles | Royal Crusher | Court Strategist: Command, entry Fortify and repeatable Plan/draw | Crown's Cavalier, Griffin Lancer, Royal Longbowman, Ashenfield War Ram, Clarity/Foresight and Ashenfield Lance |

This is not a promise that the decks have equal finishing power. It preserves distinct ways to establish an advantage, find a threat and close the game so that playtesting can evaluate them.

## All five legendary Units

Costs below are full printed costs. Generic Essence can be paid with any type. Ring, special Fonts and discounts can bring a payoff earlier than its printed total suggests. Do not equate a seven-cost card with a guaranteed turn-seven play.

| Card | Current cost | Recommended test cost | Destination |
|---|---|---|---|
| Skarn the Unchained | 3 generic + 3 Fury = 6 | **Keep 6** | Starter, one copy |
| Royal Crusher | 2 generic + 4 Oath = 6 | **Keep 6** | Starter, one copy |
| Korgath, Lord of Ruin | 3 generic + 3 Fury = 6 | **4 generic + 3 Fury = 7** | Saved booster reserve |
| Seraphine, Royal Advisor | 3 generic + 2 Oath = 5 | **3 generic + 3 Oath = 6** | Saved booster reserve |
| Garrett of Ashenfield | 4 generic + 2 Oath = 6 | **4 generic + 3 Oath = 7, test price** | Saved booster reserve; original trigger confirmed intentional |

### Skarn: preserve an attainable finisher

A first unblocked attack with just the Broken Fist Keep normally deals seven from Skarn and one from each new token: **nine total**. The created tokens enter attacking; they were not declared attackers and do not receive the Keep's attack trigger merely by being created. They may still benefit from continuous bonuses already in play.

Charge, Pierce and repeated token creation are powerful. Reckless can also force an unfavorable attack. Keep six for the first test rather than making the sole starter legendary harder to deploy while simultaneously removing Korgath. Test blocked attacks, multiple attack turns and pumps before considering seven. No cost change has been made.

### Royal Crusher: preserve the board payoff

It has no printed Charge or Command. Four Oath is a meaningful requirement that Ring cannot supply. If chosen as one of its own three targets, Crusher becomes **6 Attack / 9 Defense**, while up to two other Nobles also receive Fortify 2. Its own future unblocked Siege attack can then deal twelve to a Station, before other bonuses. It can also immediately strengthen Nobles already able to attack.

That is a real finisher, not an ordinary six-cost body. Retain six initially, observing both immediate team buffs and the opponent's opportunity to answer Crusher before its own attack. Keep the printed “up to three Nobles” behavior unchanged for now.

### Korgath: price the attack and the death engine

A 6/5 with Charge and Relentless threatens damage when attacking and when destroyed. Its death pulse watches friendly Brutes and can damage both Stations, including in sacrifice sequences. A seven-Essence test price gives that package more commitment than the straightforward six-cost starter payoff.

This is a starting test price, not a guarantee. Check last-known modified Attack for Relentless, whether the self-death pulse is intended, sacrifice chains, and simultaneous defeat. It remains a death/sacrifice archetype option rather than being deleted or flattened into a basic attacker.

**Korgath's Call also needs a linked review.** Save a provisional **4 generic + 3 Fury = 7** cost for it. Its revival, +3 Attack and conditional healing still distinguish it from simply drawing and casting Korgath. Raising only Korgath's normal cost while leaving the old Call untouched would miss an important deployment window. The original six-cost Call is preserved in its snapshot.

### Seraphine: stop her price from enabling another copy

At her current printed cost of five, another Seraphine in hand qualifies for her own “cost five or less” deployment. The current starter has one copy, but future decks could introduce that multiplication. Legendary rarity alone is not an implemented unique-per-battlefield rule.

At **3 generic + 3 Oath**, she has a three-Oath minimum under Command, and her printed cost of six no longer qualifies for that effect. The engine's eligibility check uses printed total cost, not the reduced Command payment. Her 4/6 body and free-deployment engine remain intact in this proposal.

There is a further timing issue to test: the current Start Phase executes start effects **before Ready**. A Unit she deploys during Start can therefore Ready later in that same Start Phase and attack that turn. Do not price her on the assumption that the new Unit must wait another turn. Decide deliberately whether that timing is intended before release; this review does not change it.

### Garrett: intentional combo finisher

The creator confirmed on November 6 that the original wording and self-triggering Station damage are intentional. Preserve that text and behavior. The previously proposed bounded wording is withdrawn. Evaluate him as a deliberate legendary combo finisher, rather than an ordinary combat body.

The saved **seven-Essence price remains provisional for testing with his original effect**. With Command, the proposed three Oath remains payable even after generic reductions. Future Command support, how quickly he can be found and deployed, and the opposing deck's disruption must be evaluated together.

This confirmation settles his intended wording. It does not claim the seven-cost test price is proven balanced, and no live price or effect has changed.

## Revised exact starter bookkeeping

Relative to the first saved draft:

- **Nobles:** reserve Garrett instead of Court Strategist. Seraphine remains reserved. Restore Court Strategist at its current printed cost and keep Royal Crusher at one. Total stays **60: 25 Units, 13 other non-Fonts, 22 Fonts**.
- **Brutes:** reserve Korgath instead of Drum of the Pit. Korgath's Call remains reserved with its linked cost note. Restore Drum at its current printed cost and keep Skarn at one. Total stays **60: 27 Units, 13 other non-Fonts, 20 Fonts**.

Average printed non-Font costs become **2.70 for Brutes** and **2.55 for Nobles**, including the previously recommended Initiate/Instigator/Scout cost adjustments. The more important change is retaining the engines and reachable finishing routes rather than merely reducing those averages.

The revised lists still preserve every previously requested Siege, Ranged and Soar representative. The analysis script checks those cards, Court Strategist, Drum, both starter legendary finishers, the reserve destinations and both 60-card totals.

## Saved pool and release gates

- [Exact revised lists and curves](curves-and-lists.md)
- [Machine-readable candidate decks](candidate-decks.json)
- [Original reserve designs with separate balance annotations](booster-reserve.json)
- [All five legendary reviews, original text/costs and recommended test prices](legendary-review.json)

The reserve still contains 17 proposed starter cuts, plus the separately preserved original Fury Offering design. Original printed costs are not overwritten by proposed prices. Korgath, Seraphine and Garrett each have explicit balance status and outstanding checks. Garrett's original trigger is confirmed intentional; his price still needs playtesting. Other reserved cards that have not had a full cost review are marked accordingly, not silently classified as balanced. All cards are marked **not release-ready**.

Before activating the starter changes, update the practice fixtures as well. The current lessons find Garrett in a starter deck, and the Command lesson specifically teaches him. Those lessons must use appropriate retained starter cards, such as Court Strategist, with revised goals and costs; otherwise removing Garrett would break the walkthrough. The Noble deck-selection tile also uses Garrett's art: revise its presentation so it does not imply he is included in the starter. Preserve the card catalog, artwork and IDs for saved games and future pool use. Update print-and-play and displayed deck lists together with engine/deck revisions.

No deployment, gameplay edit or new store build is part of this design revision.
