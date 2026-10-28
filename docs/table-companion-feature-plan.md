# Table Companion — proposed release feature list

Research date: October 28, 2026. Planning only; no feature or payment implementation is implied. Competitor comparison uses developer websites and store descriptions, not hands-on app testing.

## Positioning

A customizable life, score and resource tracker for card games. Play from your own phone, share one device, or join from a browser. Use the same saved setups on web and Android.

Avoid “supports every TCG” or “completely customizable” until coverage is demonstrated. This is manual scorekeeping, not a universal rules engine. Deck-as-life, hidden information and automatic card effects are not simulated. Avoid advertising a unique invention: other products already offer profiles, backgrounds, sync and networked tables.

## Competitive baseline

| Product | Developer-advertised capabilities | Implication for DT |
| --- | --- | --- |
| Lifetap | Free MTG tracker, saved player profiles, art/colors, varied timers, dice, numerous counters, CSV/JSON history export | Backgrounds, timers and exports are expected features, not a unique paid proposition |
| LifeElk | 1-screen multiplayer, large totals, custom starting life, extra counters, dice, tap/hold, autosave | Setup speed, readability and recovery matter as much as features |
| Dragon Counter | Gesture controls, colors, history, dice, free core with single full unlock | A one-time upgrade is an established model; ease of use remains necessary |
| Compendium Live Games | Individual phones with synchronized counters and QR joining; accounts required for live participants | Networked tracking is not unique. DT's account-optional guests can reduce entry friction |
| Lotus | Web/iOS/Android, custom counters/backgrounds, timers, TV spectator view, recaps; optional account sync described in privacy policy | Cross-platform use and spectators are established too; compete on a consistent game-neutral experience |

Sources:
- https://play.google.com/store/apps/details?id=com.lifetap
- https://lifeelk.com/
- https://www.dragoncounter.com/
- https://mtg-compendium.tech/guides/live-games
- https://lifecounter.app/
- https://lifecounter.app/privacy/

## Three different saved objects

1. Game setup: primary total definition, counters, numeric limits, threshold rules, turn/round options, dice and seating. Host-owned. Becomes a versioned room snapshot when a game starts.
2. Player setup: display name, avatar/background crop, accessible colors, preferred visible counters, shortcut increments and named damage sources. Player-owned. Any proposed extra resources must be permitted by the room; cannot modify room defeat conditions or starting totals.
3. Live session: authoritative scores, current turn, incoming damage, event history and timer. Never overwritten by loading preferences or logging in.

A room can permit different per-player starting values explicitly. This must be a host setting visible before readiness, not a side effect of loading a saved player setup.

## Required first public release

| Capability | Current state | Required change |
| --- | --- | --- |
| Life/counters/named-source damage | Implemented in shared rooms | Improve compact readability and direct numeric entry; configurable increments |
| Room joining | Existing code/link/host QR and private device seats | Guest or signed-in join; predictable cross-device recovery |
| Game setups | Local saves, import/export; up to 8 named counters; limited threshold model | Account sync; versioning; explicit table/player separation |
| Accounts | Not implemented | Managed sign-in, verified server sessions, private user data, sign-out and deletion |
| Player setup | Display name exists | Avatar/background upload and crop, colors, shortcuts and named sources; cloud save |
| Multi-device identity | Device seats only | Same account can reopen its seat on web/app; duplicate-write protection |
| Shared sessions | 2–8 players, own-seat controls | Device status and explicit pending/failed changes; no silent score loss |
| Single-device / solo mode | Not implemented | Offline manual tracking with clear controls; online-only requirement applies to shared rooms |
| Dice/turns | D6 first-player roll, ties, seat order, timer | Optional first-player procedure; manual order/skip randomizer; basic general-purpose dice/coin |
| Safety/recovery | One-entry undo, reconnect, bounded history, wake status | Make sync confirmation, connection loss, correction and wake status understandable |
| Data/export | Local profile import/export and room JSON | Continue free local portability; account saved-session behavior must be explicit |
| Release | APK/AAB build; unsigned release | Upload signing, physical tests, listing, disclosures, closed testing and approval |

Useful customization settings: tracker label, icon, color, starting value, min/max, ± increment, visible/hidden, and optional threshold warning. Threshold outcome should be configurable: warning, defeat or victory; boolean markers cover used/ready and held titles. Support team/shared pools later rather than overloading player counters.

## Join and sync behavior

- Entry choices: Join as guest / Sign in and join. A guest enters only a nickname; an account user may choose a saved player setup.
- Host creates from a saved game setup, guests receive its snapshot, and all players confirm before starting. Updates to a saved template do not mutate an active table.
- Same account may open both browser and app. Prefer one active editing device per seat; additional devices are read-only mirrors until explicit “Control from this device” takeover. This allows simultaneous viewing without conflicting taps.
- Server validates seat ownership. Every mutation has an idempotency key and version/conflict handling. The UI distinguishes pending versus confirmed values. Reconnecting fetches authoritative state rather than replaying stale deltas.
- Switching an editing device must stop hold-to-repeat on the old device and invalidate old write authority. Account login alone never silently claims a guest seat.
- Guest-to-account conversion requires the existing seat credential plus the signed-in session; no claiming a seat by display name.
- Local profiles can be imported into the account with a preview. Conflicting saved changes prompt a choice or retain copies; do not silently erase one device's setup.
- Offline shared-room changes must not silently queue and later double-apply. Initial release pauses shared edits while offline; independent local games remain usable offline.

## Monetization proposal — not finalized

Free: useful standalone tracker, basic online hosting, guest joining, core custom counters, existing local profiles/import/export, undo/reconnect, basic timer/dice, optional account and basic cross-device profile access. No ads in active games.

Table Plus host unlock: reusable complete table layouts (counter placement/groups), multiple shared objectives/team pools, advanced clock modes and configurable reset/reminder behaviors, longer cloud session history with comparisons, richer custom dice faces and presentation themes. Custom uploaded player background/color should be basic/free or a personal cosmetic unlock, not depend on whether an opponent paid.

One eligible host enables premium room tools for all guests on web/app. Personal account data remains private. Paid entitlement is verified on the server and follows the purchasing account; it is not attached to a nickname or invite URL. Restoration/refunds and applicable store payment policies must work before charging. Determine price after testing a concrete upgrade; do not promise unlimited cloud storage or lifetime future content.

Several of these premium items already exist elsewhere. Their value depends on useful implementation and the combined cross-game workflow, not exclusivity.

## Later, after the core works

Spectator/TV mode; permissioned whole-table adjustments; expanded match/session summaries; shareable setup templates; teams/bosses; advanced dice pools and symbol dice. AT stays separate until polished. No community marketplace, card database, automatic card rulings, chat/social feed or RPG campaign manager in this release.

## Build order

1. Confirm this scope and free/paid boundaries. Test mockups for host setup, guest join, signed-in join, saved player setup and active player panel.
2. Managed accounts and profile model; sync website and Android with import/version/conflict handling and deletion.
3. Player appearance and compact counter controls; offline local/solo mode; optional roll/ready workflow.
4. Multi-phone reliability and accessible layouts; physical testing and closed test with documented fixes.
5. Implement and verify the selected Table Plus bundle and billing before any purchase UI.

First-release acceptance: Android host creates a room from a web-saved setup; an iPhone browser guest joins without an account; another signed-in user loads their own saved appearance/sources without changing the host's rules; the same user's laptop mirrors their seat and can take control explicitly; network loss/reconnect produces no duplicated numeric changes; offline local games work; text remains readable with large font settings.
