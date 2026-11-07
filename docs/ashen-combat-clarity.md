# Combat clarity pass — November 6, 2026

Roadmap milestone 2 now has direct attack/block selection, legal highlights, attack/block connections, a separate card-reading action, readiness/Spent indicators, remaining Defense with damage, and actual damage/destruction feedback. Full real-device acceptance remains necessary; this is not the cinematic presentation milestone or an AI release.

## Player flow

1. Enter the Skirmish. Tap highlighted Ready Units to select/deselect them. Select all Ready is available. Required Reckless attackers must be included before confirming.
2. The defender taps an attacker, then one of the highlighted legal blockers. Standfast remains valid while fatigued; Soar/Ranged/Siege restrictions still apply. Tap an assigned blocker to remove it before resolving, or clear all assignments.
3. Orange connections lead unblocked attacks toward the enemy Station; green connections join blockers to their attackers. Color is reinforced by labels and the expandable assignment list. Multiple blockers take damage in the displayed assignment order.
4. Resolve combat. The engine records damage and destroyed Units; brief labels and the Combat result panel show what happened. There is no frontend forecast being presented as a guaranteed result. Short animations respect reduced motion, and results remain available after the labels disappear.

Opponent responses, trigger ordering, card selections and ownership continue to gate combat. A bare priority window now also locks idle-only actions, closing a stale-state edge case. The new `unblock` network command permits only the authenticated defender's assigned Unit. Existing save keys, card IDs, frames and deck data are unchanged.

## Structure

See [arena module ownership](../src/games/ashen/arena/README.md). Rendering, geometry, feedback and read-only view projection have separate modules. Rules and receipts belong to the shared engine; the controller sends the same actions locally and remotely. The local-only populated review harness is excluded from release entry graphs and copied assets.

## Verification

Focused regressions cover legal selection, fatigue/Standfast, aerial restrictions, assignment/removal ownership, simultaneous damage receipts, touch selection and remaining Defense. Public AT/shared/Companion checks and public/mobile/private builds cover consumers. Browser checks exercise populated desktop and phone-sized fields, connections after resizing, multiple blockers and the result panel. Real iPhone Safari/Home Screen and Android-device checks remain a release acceptance task; no store release is included.
