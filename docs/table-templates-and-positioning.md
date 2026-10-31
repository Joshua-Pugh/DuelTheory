# Table templates and positioning — web test pass

October 31, 2026. Android remains at published 1.0.7; no new Android build, version increment, sync, or Play release is requested for this pass.

## Test these changes on the web

1. Open Create Table and Join Table: name and optional source fields belong inside the active card, with one shared draft preserved when switching tabs.
2. Create a game, complete the roll and check the HOST tag on either your own or another player's card. Transfer host and check that the tag moves.
3. Enter 2400 in Custom life amount, subtract it and confirm the field clears after success. A failed request keeps the amount for retry; undo still restores the total.
4. Signed in: edit a game profile, choose Save as new, enter a distinct name and save it to the account. No JSON file is downloaded.
5. On another signed-in device use Load saved template, search/select the named template, change its settings and Save changes. Updates use the same id and optimistic revision instead of creating duplicates.
6. Guest: save explicitly to this browser, then load it through the same library. Existing device templates remain separate and can be loaded and saved as a new account template. Export/Import remains an optional portability/backup feature.
7. At five cloud game templates, edits still work; new copies require freeing a slot. Existing accounts above five keep their records and can edit/delete them. Player appearance saves are separate from the five game slots. Overall legacy safety bound remains 40 total saved rows.

## Proposed free / paid boundary (billing is not enabled)

| Free core | Later Supporter options |
| --- | --- |
| Create/join 2–8 player tables; browser guests | 20 account game templates instead of five |
| Life, custom counters, source damage, thresholds | Curated theme, frame and sound packs |
| Configurable tap/hold increments and custom entry | Organized groups and shared template collections |
| Dice, optional turns, undo and current session history | Searchable persistent session archives |
| Host transfer, leave/close and seat management | Creator-focused profile collections and version notes |
| Five private account game templates, editing and deletion | Pricing decided after people use the free product |
| Existing personal colors and uploaded backgrounds | Core play and joining stay free |

Start with a modest one-time Supporter unlock once there is actual added value. A subscription needs ongoing value such as archive hosting/group services; do not introduce one merely for a life counter. Do not sell anything or advertise a paid quota before server-verified entitlements and store billing are implemented. No paid SKU or entitlement field is accepted from the frontend in this pass.

## Positioning

Headline: **Your game. Your way. One shared table.**

Explanation: Set the life total, counters, source tracking and adjustment amounts for the card game you play. Save the setup, invite your group by QR code or link, and let each player track their own totals from the app or browser.

Best initial audience: groups playing multiple card games, custom formats or original prototypes; groups wanting individual phones and easy browser joining. A group happy with a free single-device MTG tracker may have no reason to switch. The pitch is a useful combination of flexible game templates, shared sessions and low-friction access, not a claim to have invented multiplayer tracking.

## Competitor evidence checked October 31, 2026

- Lifetap's official site advertises free/ad-free counters, custom starting life, saved player profiles/backgrounds and game history: https://getlifetap.com/
- Lifelinker's official Google Play listing describes customization, dice, detailed history, and a one-time unlock for advanced options: https://play.google.com/store/apps/details?id=com.collectedcompany.MatchTracker
- MTG Compendium's live-games guide describes per-device synchronized multiplayer tracking: https://mtg-compendium.tech/guides/live-games (search result was readable; full fetch unavailable).

These establish that counters, personalization, history and synced sessions individually are not defensible uniqueness claims. This is a targeted comparison, not an exhaustive market survey or evidence that people will pay.

## Verification

Full suite: 968 tests across 152 files passed. Hosted SQL ran inside a rolled-back transaction: owner isolation, anonymous/direct-write denial, stale revision rejection, five-game-template quota, editing at quota, duplicate names, player-to-game quota bypass, and deletion/freeing a slot all passed. The quota function migration was then applied successfully to the existing project. No existing user rows were removed. Browser guest flow saved and loaded a named 8000-life template without a JSON download. Account UI save/load/update/error paths were tested with mocks; real email-code sign-in is left for the owner's web test.
