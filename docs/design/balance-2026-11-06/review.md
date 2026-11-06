# Ashen Throne starter balance review

November 6, 2026. **Draft for creator review. No live card, deck, saved profile or engine has changed.** This is a source-based design assessment, not a claim of proven competitive balance.

## What the current lists actually contain

The audit uses `ashenCatalog.json`, the printed costs in `ashenPrintData.json`, and the implemented rules/effects at commit `0aa4314147bdaa616a37ab2c7cccfaf338a6aa53`. It does not silently promote an older DOCX to the current rules authority.

- **Brutes:** 60 cards, including **18 Fonts (14 basic Fury Fonts + four special Fonts)**. The proposed 11 → 14 basic / 15 → 18 total adjustment is already reflected in the current code. Adding the six proposed duplicate Units therefore needs six cuts at 18 Fonts, not nine.
- **Nobles:** 60 cards, including 22 Fonts (18 basics, two Sanctums, one Forge and one Verdant Veil Fount). The nine additional Unit copies plus a second Clarity would indeed need ten cuts. Holding Clarity at one means nine cuts.
- Stations are separate from the 60-card draw deck.

Full reproducible tables and both exact 60-card candidates: [curves and lists](curves-and-lists.md). Machine-readable candidates: [candidate-decks.json](candidate-decks.json). The audit script only writes design artifacts in this folder.

## Overall judgment

The recommendations identify the right problems. Singleton-heavy starter decks produce inconsistent openings and make it hard to learn a coherent strategy. More low-cost Units should help both decks show their identities. Keeping Siege, Ranged and Soar is also the right choice: early defense should teach those interactions rather than remove them.

However, **consistency is itself a power increase**. An effect that rarely appears once becomes a dependable engine at two or three copies. More Standfast also changes how fatigue shapes the whole game. Recovery must be measured with the existing Charge-granting effects, not just the keyword printed on the new token spell.

I would not lower costs broadly. First remove competing late-game engines, increase the useful early copies, and price the most efficient draw/token effects appropriately. Then test a small set of recovery changes separately.

## Essence curve

Counts below are **non-Font cards at each printed total cost**, with the recommended cost changes applied only in the candidate columns. Generic requirements may use any Essence. A printed six-cost Command Unit is not necessarily a turn-six play.

| Printed cost | Brutes now | Brutes candidate | Nobles now | Nobles candidate |
|---|---:|---:|---:|---:|
| 1 | 6 | 7 | 7 | 11 |
| 2 | 10 | 10 | 8 | 9 |
| 3 | 16 | 16 | 6 | 7 |
| 4 | 2 | 1 | 8 | 7 |
| 5 | 5 | 4 | 6 | 2 |
| 6 | 3 | 2 | 3 | 2 |
| Fonts | 18 | **20** | 22 | **22** |
| Average non-Font cost | 2.98 | **2.78** | 3.18 | **2.63** |

The current Brute deck is not simply a low-curve aggro deck: 16 of its 42 non-Fonts cost three, and eight cost five or six. Its resource count is light for that workload. The Noble deck has a larger late-game tail and many overlapping engines. The suggested cuts reduce that tail without removing the important combat mechanics.

### Why start Brutes at 20 Fonts?

Exact natural draws for the first player, six opening cards and the first draw skipped:

| Font count | Zero in opening six | At least three Fonts drawn by own turn 3 | At least four by own turn 4 |
|---|---:|---:|---:|
| 18 | 10.5% | 45.0% | 25.7% |
| 20 | 7.7% | 53.9% | 34.2% |
| 22 | 5.5% | 62.3% | 43.1% |

These are not actual mana-screw or win rates. Mulligans, extra draws, Plan/Refine, Ring, spent Fonts and individual colored requirements all change playability. The free redraw helps both players. Nevertheless, 18 Fonts is an aggressive baseline for a deck still centered on three-cost plays. Start at 20 and see whether flooding actually becomes a problem before trimming resources.

Nobles have **21 Oath-producing Fonts and one Untuned Font**, not 22 Oath sources. Brute special Fonts all produce Fury, but Fury Pit and The Maw Below enter Spent. A Font drawn this turn is not always usable immediately.

### Printed cost is only the first curve

- **Ring of the Ley** supplies two Untuned Essence after an activation. It can accelerate generic-heavy cards, but cannot pay the colored portion of a cost.
- **Command** reduces generic cost from Plan/Refine actions. Garrett's printed 4 generic + 2 Oath can fall to 2 Oath. Do not judge his power only against other printed six-cost cards.
- **Noble cantrips** also benefit from the Bastion's separate draw/resource choice. More cheap Plan/Refine Units improve both early defense and access to the next Font.
- **The Maw Below and Ragekindle** can create unusual Essence windows. The candidate reserves Ragekindle to reduce explosive resource turns while the basic curve is tested.
- Every retained cost still needs enough colored sources. Howling Skyterror costs 3 generic + 1 Fury (four total); Ashen Warhawk costs 3 Fury (three total). Ring accelerates the former much more readily. Compare requirements, not only the bucket.

## Cost and effect recommendations

| Card | Current | First test recommendation | Reason |
|---|---|---|---|
| Bloodpit Initiate | 1 Fury; 1/1, Charge, token on entry | **1 generic + 1 Fury**, keep Charge and token | Same base body/cost/Charge as Grunt plus a token is too efficient a baseline to double without review. A two-cost Initiate keeps Grunt's one-cost role. |
| Warhowl Instigator | 2 Fury; 2/2, draw on non-token Brute entry | **1 generic + 2 Fury** | A repeatable draw engine becomes substantially more reliable at two copies. Generic ramp can still accelerate it; this is a tempo adjustment, not a guaranteed turn gate. |
| Watchtower Scout | 1 generic + 1 Oath; 3/1, Ranged, entry Plan, draw on Fortify | **1 generic + 2 Oath** | Entry Plan already works with Bastion; later Fortify draws add another engine. Two copies can multiply that value. If it is still excessive, test a once-per-turn draw limit instead of continually increasing cost. |
| Rune of Clarity | 2 Oath; pay 1 Oath to Refine 2; damage per draw | **One copy. Test Exhaust + 1 Oath for the activation.** | The issue is repeatable conversion of resources into draw/filtering and Station damage, not simply its two-cost deployment. |
| Blood Cauldron | 1 generic + 2 Fury; exhaust and sacrifice two Brutes for a 4/4 with Charge | Keep cost. Test **a second Exhaust option creating one 1/1 Frenzied Brute** | Its two modes share the same exhaust cost. The recovery token has no inherent Charge; global effects may grant it. |
| Fury Offering | 1 generic + 2 Fury; sacrifice/damage/draw effect | Keep cost for the proposed **two tokens, or three if you control no Units** replacement | A recovery spell must work without another Unit. Check the empty-Frontline condition as the spell resolves, and do not give its tokens inherent Charge. Preserve the old design separately. |

These are candidate prices, not proven final costs. Keep the other starter costs unchanged in the first comparison. In particular, do not also discount Raging Mauler, Rubble Flinger, Crown Archer or the one-cost Noble value Units while increasing their availability.

### Rune of Clarity needs more caution than the proposal gives it

With **two Clarity Runes**, one Refine 2 activation draws two cards. Both Runes see each draw: **four damage**. Choosing the Bastion's separate draw adds **two more damage**, for **six Station damage from that one Oath activation**, before other engines. With a Rune of Foresight, the two bottomed cards can add another two damage. The setup takes cards and Essence and can be answered; it is not a free combo. But the printed activation currently has no exhaust or once-per-turn limit, so increasing copies is much more than improving consistency.

One Clarity plus Foresight and the Bastion's draw can already produce five damage from that sequence. Holding Clarity to one alone does not solve repeated activation; that is why the exhaust test belongs with it. A second copy should be a later controlled experiment, not part of the first starter rebuild. Increasing deployment cost alone would only delay this engine.

### Standfast: start on three designs

Add it initially to **Shieldbearer Noble, Banner Guard and Crown Archer**. With the proposed quantities, that gives six Standfast cards: three Shieldbearers, one Banner Guard and two Archers.

Hold it on **Spearman of the Crown** and **Griffin Knight** initially. Spearman already has repeatable Plan and persistent Fortify growth; Griffin Knight already combines Soar with Refine 2 and the associated triggers. Add more Standfast only if the first games still show a specific defensive gap.

The full recommendation would yield ten Standfast copies once duplicates are counted. Standfast permits blocking while fatigued, including after attacking, not merely on the deployment turn. It should not become so common that fatigue stops being an important decision. It also does not override Soar/Ranged restrictions. Crown Archer is a particularly useful addition because its existing Ranged keyword makes it a legal blocker for Soar as well as Ranged attackers.

### Recovery and Charge must be tested together

The new Cauldron mode is reasonable to test because the two options compete for one activation. Do not let the player exhaust it once to receive both effects. The proposed Offering should **replace**, not append to, its current sacrifice/damage/draw text. Otherwise it becomes a much larger card than the proposal describes.

With Banner of the Broken Fist already in play, three Offering tokens may gain Charge. If all three attack unblocked, the Keep makes them 2 Attack each: **six damage**, not three. With Frenzied Stampede as well, the same three attackers can reach **15 unblocked damage with Pierce**. That requires the Banner setup, the two three-cost spells and the relevant attack window; it is a ceiling to test, not damage the spell always deals.

The candidate has ten printed-Charge Unit copies versus nine currently, despite reserving Stonehide. Do not assess Charge only by the number of designs. Banner, Overseer and token interactions matter too.

## Exact starter cuts and proposed booster reserve

All designs and their original printed costs/text have been snapshotted in [booster-reserve.json](booster-reserve.json). This is a **proposed reserve**, not approved deletion or release-ready booster balance. Runtime IDs, art and implementations remain intact. There are 17 proposed cut designs plus an original Fury Offering design snapshot if its replacement is accepted.

### Nobles: nine cuts

Apply all proposed Unit copy increases, keep Clarity at one and Fonts at 22. Reserve:

| Card | Why reserve it from this starter |
|---|---|
| Royal Guard | A second recurring Plan/Refine starter engine is unnecessary alongside the duplicated early cards; Spearman remains. |
| Court Strategist | Command plus targeted Fortify plus repeatable Plan/draw adds another engine and target prompt. Junior remains; Garrett still demonstrates Command. |
| High Strategist | Another Command/Plan engine; saves an advanced design for a later pool. |
| Seraphine, Royal Advisor | Free deployment changes cost windows substantially and adds another high-value engine. |
| Rune of the Crown | Fortify-to-direct-damage engine overlaps several other win engines. |
| Crown of Dominion | Stacking counters, nullification and team Aegis belong in a later, more deliberate package. |
| Mandate of Dominion | Removes one of the expensive sweeping finishers; Royal Crusher remains. |
| Order's End | Reduces overlapping mass-removal choices and five-cost congestion. |
| The King's Will | Broad modal sweeper/nullification package is too much additional machinery for this starter. |

This gives **25 Units, 13 other non-Fonts and 22 Fonts**. Royal Crusher, Ballista Crew, Royal Longbowman, Griffin Lancer and Crown's Cavalier all remain. Ashenfield War Ram and Ashenfield Lance remain too. Targeted removal and defensive Tactics are preserved.

If a second Clarity is eventually approved, **Oathfire Decree is my provisional tenth cut**, preserving the named combat representatives and 22 Fonts. It is not part of the saved primary candidate.

### Brutes: eight cuts at 20 Fonts

Add one copy each of the six specified Units, and increase basic Fury Font **14 → 16**, for 20 total Fonts. Reserve:

| Card | Why reserve it from this starter |
|---|---|
| Warchanter Savage | The proposed cut; the three named Ranged designs remain. |
| Stonehide Juggernaut | The three named Siege Units remain. It removes the need to change this design just to fit the starter. |
| Korgath's Call | Korgath remains, but its expensive second route and burst package need not occupy another starter slot. |
| Warband of Bloodfire | Scaling bonus and counters dominate wide-board balance and create too much extra power for the recovery experiment. |
| Ragekindle | Removes a go-wide resource burst while resource access is being assessed. |
| Flesh-Slinger's Chant | Repeated sacrifice-to-Station damage creates another way to turn the token engine into a finisher without combat. |
| Flamebelcher Rig | Ranged remains represented without an extra Outfit/sacrifice-damage package. |
| Drum of the Pit | Momentum bookkeeping and tutoring are useful later, but less necessary than reliable Fonts and early Units now. |

This gives **28 Units, 12 other non-Fonts and 20 Fonts**. All three requested Siege designs, all three requested Ranged designs and all four requested Soar designs remain. Savage Warcaller is also a fifth Soar design in the current data; it stays at one and its death-draw effect needs observation.

An **18-Font alternative** is easy to compare: remove the two added basics and return Flamebelcher Rig and Drum of the Pit. That is exactly 60 with six cuts. I prefer starting with the 20-Font version because it tests whether the game is enjoyable when both sides can actually deploy their hands.

Stonehide's current four-cost 4/3 with Charge and Siege can hit an unblocked Station for ten with the Keep bonus. It can still be chump-blocked without Pierce. If retained instead of a different card, test removing Charge before reducing its cost. Its original design is preserved in the reserve.

## Baseline interactions to keep separate from the rebuild

1. **Garrett's damage can retrigger itself under the currently retained creator ruling.** Once a controlled Noble damages a Station, repeated Garrett targeting of a Station can become a lethal chain unless interrupted. This behavior is documented in the current reference. Cost alone does not make such a finish fair; explicitly decide whether this is an intended win condition before judging Noble finishers. This review does not change that ruling.
2. **Warband's engine currently counts Brutes on both sides**, while its bonus is applied to friendly Brutes. The printed count says “each Brute on the Frontline,” without restricting that count to its controller. Confirm that scope explicitly for mirror matches rather than assuming it is an implementation bug. Reserving it avoids muddying starter tests. Its scaling with a wide board also warrants a cap or a different bonus, independent of that wording decision.
3. **Instigator's trigger does not exclude itself** in the current effect definition. Track its entry draw as well as subsequent draws. Two copies can draw multiple cards on later entries.
4. **Fury Offering's current effect is completely different** from the recovery proposal. Keep a versioned record and update card text, engine, print-and-play and tutorial references together if approved. The original is saved here; nothing is overwritten.
5. **Skullsplitter's Roar** already combines a two-damage enemy-wide sweep with token creation at three total Essence. More low-Defense Nobles make that exchange more important. Watch it before raising Noble Defense or lowering other recovery costs. **Ashen Strike**, Bloodforge Hollow and Ashfang Ravine also provide unusually efficient one-off effects in the existing internal power scale; do not casually increase their copies along with the early Units.

## How I would test this

First agree the copy counts, cuts and three cost changes. Run a small matched batch of Brute versus Noble games with starting player alternated. Keep the same starting seeds where practical, and record mulligans, missed Font plays, first meaningful attack/block, the earliest engine-driven lethal and whether the losing side had useful choices.

Use the narrow Standfast package and one bounded Clarity activation in that batch. Then compare the recovery changes rather than adding every buff at once. Specifically test an empty Brute Frontline, a live Banner, Cauldron's competing modes, two Instigators, Scout with a multi-Unit Fortify, and Griffin Knight's Refine triggers.

A small set of self-play games will reveal broken openings and unfun loops; it will not establish a reliable 50/50 win rate. Adjust the relevant card or resource window after observing the failure, rather than tuning to a nominal average cost. Keep the discarded designs in the reserve with their revision history.
