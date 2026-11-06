# Starter interaction review and confirmed creator decisions

November 6, 2026. Analysis of the current **candidate** lists, including the proposed token-only Fury Offering. These are not changes to the live simulator.

## Confirmed decisions

- Preserve Garrett's original wording and intended self-triggering damage interaction. The earlier proposed trigger rewrite is withdrawn. His saved seven-Essence price remains a test price for an intentional combo finisher, evaluated together with future Command support and disruption.
- Korgath and **Korgath's Call** belong together in the reserve. Call is a **Strategy**, not a Tactic. It is already absent from the latest candidate list, so it must not be counted as another free cut.
- The four current Command Units are Court Strategist, High Strategist, Garrett and Seraphine. The current candidate retains Court Strategist and reserves the other three. Keeping Strategist is the recommendation for a small starter introduction to Command plus a Plan/Fortify/draw engine. If the creator instead wants Command entirely deferred, that is a separate change requiring an engine replacement, not a reason to silently remove Strategist.

## Dedicated hand interaction in the current candidates

Categories overlap. A modal card counts once in the total, not once per possible mode. Station-only damage, combat keywords and card selection are not counted as Unit removal.

### Nobles: seven cards, good coverage but thin redundancy

| Card | Copies | Cost | What it answers | Important limit |
|---|---:|---|---|---|
| Royal Decree | 1 | 1 generic + 1 Oath | Small Unit, or bounce a Relic | Unit Attack must be 2 or less; no Rune mode; Strategy timing |
| Purge the Unworthy | 1 | 1 generic + 2 Oath | Destroy a Unit or Rune | Targeted; no Relic mode; Strategy timing |
| Judgment of the Crown | 1 | 2 generic + 2 Oath | Up to two non-Legendary Units, or a Relic/Rune; both after Refine | Its Unit mode cannot destroy a legendary Unit |
| Crown's Verdict | 1 | 1 Oath | 2 Unit damage, or 3 to any target after Plan/Refine | Damage-limited; does not generally remove a large fortified Unit alone |
| Enforce the Law | 1 | 1 generic + 1 Oath | Bottom a Unit, or destroy a Relic/Rune; both after Fortify | Targeted, but Tactic timing; bottoming bypasses destruction/death triggers |
| Law of Precedence | 1 | 1 Oath | Nullify a Tactic, or give +3 Defense | Not a general counter to Unit plays, abilities or triggers |
| Throne's Will | 1 | 3 Oath | Nullify an Action | Does not Nullify every activated ability or triggered Effect |

The first five are removal-capable hand cards; the final two are counters. Enforce and Purge are the two straightforward on-board answers to a large legendary Unit. Throne's Will can prevent a Unit Action resolving, rather than removing an established body. Judgment's attractive two-Unit mode is not a third legendary answer.

Oathfire Decree can add conditional damage; combat, Fortify, Ranged and Soar also help. They are not replacements for a clean removal card. Crown Archer, Clarity, Foresight and Royal Longbowman's relevant pings target Stations, not arbitrary Units.

**Recommendation:** test **two Enforce the Law and two Purge the Unworthy**, with the other five at one each: nine dedicated hand-interaction cards. This improves access to existing answers without adding a new rules package or another sweeper. Keep their existing costs for that comparison. These two increases need two offsetting cuts; trade extra Unit copies before cutting another engine or finisher. One possible trade is the extra Griffin Knight and one Court Scribe, leaving those designs at one and two respectively. This trade is not applied to the saved primary candidate yet.

### Brutes: four cards, with a meaningful large-threat gap

| Card | Copies | Cost | What it answers | Important limit |
|---|---:|---|---|---|
| Ashen Strike | 1 | 1 Fury | 3 damage to any target; potential card draw | Strong against small Units, insufficient alone against high Defense |
| Rites of Ragefire | 1 | 1 generic + 1 Fury | Destroy a Relic or Rune | Only one dedicated support-removal copy |
| Skullsplitter's Roar | 1 | 2 generic + 1 Fury | 2 damage to each enemy Unit; tokens from kills | Low-Defense sweep, not clean removal of a large fortified Unit |
| Bloodfire Collapse | 1 | 2 generic + 3 Fury | Destroy all Units | Symmetric, five Essence, Strategy timing; can also damage both Stations |

This deliberately does **not** count the old sacrifice/damage/draw Fury Offering: its proposed recovery replacement removes that interaction. Live Fury Offering still has its old effect; nothing is overwritten.

Secondary sources remain: Ashfang Ravine's two-damage Font entry, Bonespike Hurler's exhaust/sacrifice damage, Ashclaw Skyreaver's paid sacrifice damage and Siegebreaker Ram's Relentless. They provide reach and combinations, but require board state, resources, a death or a particular timing window. Rubble Flinger and Skyclaw Raider's entry damage is Station-only and must not inflate the Unit-removal count.

**Assessment:** Brutes can interact, but are not yet reliably equipped to remove large threats. Several two/three-damage effects do not equal a clean answer to a fortified 7- or 9-Defense Unit. Damage must combine before end-of-turn healing clears it. One symmetric wipe is a backup, not a reliable targeted answer.

**Recommendation:** prioritize a second **Rites of Ragefire**, consider a second **Ashen Strike**, and use the Korgath-dependent spell's replacement role for a **non-Unit answer to large threats**. Brutes need not copy the Noble counterspell identity; they can use fast damage and a sacrifice-based removal Tactic instead. Ashen Strike's three damage plus potential draw is efficient, so doubling it is a controlled test, not permission to increase it to three or four casually.

## Proposed non-Unit replacement role

The preferred role for the card replacing Korgath's Call is targeted large-Unit removal. No current catalog card fills that exact role without major conditions; the old `Unused Cards.docx` includes Bloodhurl, but its two/four damage and Strategy timing do not solve the large-threat response gap by themselves.

A new design to review, **not an existing or approved card**:

**Bring Down the Mighty** — working title

Tactic — **1 generic + 2 Fury**

Additional cost: Sacrifice a Brute Unit you control.

Destroy target enemy Unit with Defense 4 or greater.

This complements the small-Unit damage cards, can answer legendary Units, and can be used in a legal response window. It does not remove a Station, counter an Effect, or target a protected Unit illegally. It is conditional rather than general Noble-style removal. The sacrifice can have synergies and the Keep can replace destroyed Brutes, so three Essence is only a proposed testing price. No text, art, ID, runtime implementation or starter slot has been activated.

If this role is accepted, do the final slot reconciliation once. The current 60-card draft already spent the space freed by Call on its other changes. Adding the new Tactic and duplicated interaction requires reducing other proposed additions; it cannot simply make the list 61–63 cards. Do not remove Drum, Skarn or the core token/draw engines to fund every early duplicate. The retained named mechanic representatives should remain checked by the audit.

## Interaction and intentional combo finishers

Garrett is intentionally powerful. That makes the response package consequential: his printed price is not the only balancing knob. Opponents need a realistic opportunity to disrupt his setup or remove his body in a legal window before a winning chain becomes inevitable. Removing his source does not retroactively Nullify a pending Effect, but prevents further source-dependent triggers from being generated while he is absent.

Neither listed Noble counter should be advertised as a generic answer to every Effect. Enforce the Law's bottom-deck mode is particularly useful against Relentless: moving a Unit to the deck is not destroying it. Brutes currently lack an equivalently clean fast large-Unit answer. That is a more important gap to address than adding another large attacker to Call's former role.

Keep broad answers distributed according to faction identity. Some future protection will require attacking its support source or using untargeted effects; do not make every starter removal spell ignore Aegis just to answer everything. Recheck this package when the Command/legendary booster introduces new threats.

## Status

The seven-versus-four counts and current limits are verified against the candidate entries, catalog text and effect definitions. The nine-card Noble package, expanded Brute package and new Tactic are recommendations for review, not implemented list changes. Primary candidate decks remain 60. The analysis now also rejects a candidate retaining Korgath's Call without Korgath. Garrett's confirmed intent is recorded in both the legendary review and saved reserve.
