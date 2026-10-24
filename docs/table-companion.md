# DuelTheory Table Companion

Table Companion is a game-neutral manual scorekeeping product for physical tabletop games. Open **Table Tools → Table Companion**, choose Classic Duel or Multiplayer Table, or customize your own profile. The interface and built-in profiles use DuelTheory branding and no third-party card art, catalog or rules text.

## Available now

- Shared rooms for 2–8 players, private device seats, invite links, reconnecting and own-seat controls.
- Compact player dashboard with centered totals, local-seat −/+ shortcuts, current-turn highlighting and expandable detailed controls. Opponent totals remain read-only.
- A shared **Table Title** with an editable label and optional end-of-turn reminder. Players manually claim the title; only one player holds it at a time. Holder/host can clear it, and only the host can rename/configure it. Version checks reject stale concurrent changes; request retries are idempotent. Eliminating the holder clears the title for manual reassignment. Reset clears the holder while retaining its label/reminder. Damage and game-specific effects never transfer it automatically.
- Editable primary total label, starting value and optional defeat threshold at or below a value.
- Up to eight named resources/counters with individual starting values and optional defeat thresholds at or above a value. Additional unconfigured counters can be entered during play within that same eight-counter limit.
- Optional named-source damage tracking: up to eight sources per player, independent source identities even when names match, optional defeat threshold per source and optional linked reduction/correction of the primary total.
- All seats must join before the host locks seats; everyone rolls a six-sided die, highest wins, highest ties reroll. Turns follow seat order from the winner, skipping eliminated players.
- Corrections restore an accidentally eliminated player. Host reset restores the profile's starting values and requires a fresh roll.
- Screen wake lock where supported, responsive controls, table history (80 most recent mutations), and session JSON export without device credentials.
- Local named profile saving (up to 20), JSON import/export, and Creator Studio project choices. A creator project supplies its game name, primary-total label and starting value; customize resources and thresholds in Table Companion before creating the room. This does not publish profiles to a community or add automatic game rules.

## Portable profile schema

`src/table/profiles.ts` defines `TableProfile`, its strict boundary validator and portable version-1 JSON. The room engine in `src/table/model.ts` reads those settings; card identities and game effect engines are not required.

```json
{
  "schemaVersion": 1,
  "name": "My original game",
  "health": {"label": "Resolve", "start": 35, "defeatAt": 0},
  "counters": [
    {"label": "Energy", "start": 3, "defeatAt": null},
    {"label": "Corruption", "start": 0, "defeatAt": 6}
  ],
  "sourceDamage": {"enabled": true, "label": "Injury", "defeatAt": 12}
}
```

Null thresholds disable that defeat condition. Settings are fixed when a room is created and validated by the server. A joining player cannot replace them. Profile files contain no executable code. Values must be integers, labels bounded and unique, and starting values must not already cause defeat.

The title is a room-level shared marker, separate from player counters and profile defeat rules. Configure its label and reminder in the active table. Reminders are displayed and logged when that holder's turn ends; they do not draw cards or simulate rewards. Numeric edits preserve an empty input instead of inserting zero, select the existing value on focus and normalize leading zeros on blur. Required blank starting totals cannot be saved as a valid profile; optional blank thresholds remain disabled.

## Compatibility and deployment

New links use `#/companion` and `?table=ROOMCODE`. Original `#/commander` and `?commander=ROOMCODE` bookmarks remain accepted. Existing stored room states and pre-update clients retain their 40/10/21 settings through an isolated compatibility entry point, rather than silently changing active games. Those settings are not advertised as a new built-in game profile.

The Cloudflare service keeps its original deployment name, Durable Object class, SQLite binding, device-seat storage keys and wire field names to preserve existing rooms. The old `commanders`, `life` and `poison` wire fields are compatibility details; newly created sessions read their rules from `profile`. New sessions reject the dedicated old poison command and use named counters. No destructive namespace or storage migration is needed. `VITE_TABLE_API_URL` is supported, with `VITE_COMMANDER_API_URL` as a fallback for existing installations. The default service remains `dueltheory-commander.cfpadvantage.workers.dev`.

Room history is shared with room participants, not a permanent account history. Profiles are saved only in this browser; exporting backs them up. Room data expires after 24 hours without a change. Shared rooms need a network connection; this release does not provide an offline match mode.

`node scripts/test-table-companion.mjs <API-URL>` verifies custom-profile behavior over HTTP. `scripts/test-commander-rooms.mjs` verifies older clients still work. Run the frontend test suite, Pages build, backend TypeScript check and Wrangler dry run before deploying the table service and frontend.

## Commercial scope

This change creates the configurable product foundation; it does not add subscriptions, accounts, payment processing or access restrictions. Pricing and entitlements need a separate implementation. A rebrand is not legal clearance: review the actual branding, third-party references/content, commercial terms and platform structure with an IP attorney before charging. Wizards' fan-content permission is not a paid-content license: https://company.wizards.com/en/legal/fancontentpolicy
