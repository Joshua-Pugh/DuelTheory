# Commander Table prototype

DT's Commander Table is a manual multiplayer game companion. The host creates a room, shares its eight-character code/link, and each person joins on their own phone. Each seat can update only its own values. No MTG card simulation is involved.

## Included

- Two to six seats, starting at 40 life; one or two named commanders per player.
- Shared table overview, life gain/loss, poison, custom counters, concessions and recent history.
- Commander combat damage received, tracked by individual commander identity rather than by player or card name. Partners and identical commander names remain separate.
- Optional linked life adjustment when recording/correcting commander damage. Disable it if life was already adjusted or damage has a different result (for example infect); enter poison separately.
- Commander hit shortcuts are labeled −1 and −5 for the life lost. They increase damage received from the selected commander. The manual field requires a signed amount: −7 records a seven-damage hit, while +3 removes three recorded damage as a correction. With linked life adjustment enabled, corrections restore the corresponding life. Corrections cannot reduce received commander damage below zero.
- Common threshold notices at life <= 0, poison >= 10 or 21 combat damage from one commander. These never automatically eliminate anyone: actual card effects remain the table's responsibility.
- Host can lock seats when play begins and reset all players for the next game.
- Browser-local seat credentials allow refresh/reconnect. Disconnect retains a room-specific credential on that device, so joining the same code can recover the seat. Clearing browser storage loses that credential.

Official references: [Commander format](https://magic.wizards.com/en/formats/commander) for 40 life and the individual-commander combat-damage threshold; [Wizards release notes](https://magic.wizards.com/en/news/feature/phyrexia-all-will-be-one-release-notes) for poison counters. This is a counter tracker, not a rules adjudicator.

## Architecture and hosting

The existing Vite/React frontend stays on GitHub Pages. A separate Cloudflare Worker, `dueltheory-commander`, runs the room API at `https://dueltheory-commander.cfpadvantage.workers.dev`. There is one SQLite-backed Durable Object per room, with synchronous read/validate/write operations and no in-memory authoritative state. Rooms expire after 24 hours without a mutation; alarms clean up their stored data.

Clients refresh the shared state every two seconds while visible (ten seconds when hidden), and immediately use the server response after their own changes. The UI labels connectivity and only displays confirmed mutations. Requests carry random idempotency IDs; the most recent 200 mutation IDs are retained so transport retries do not apply a change twice. State revisions prevent a slower poll from replacing a newer mutation response.

Each device gets a cryptographically random bearer token. Only its SHA-256 digest is persisted on the server. Public responses contain game state and seat ID, never credentials or membership authentication data. The authenticated seat determines the edited player; client-supplied player IDs are ignored. Room codes invite players but cannot authorize edits to existing seats. New-room/join requests have an IP-based rate limit. Cross-origin access is restricted to configured DT/dev origins. There are no account logins or credential recovery across devices in this prototype.

The frontend API URL can be overridden with `VITE_COMMANDER_API_URL` at build time. It defaults to the deployed endpoint. Invite links use `?commander=ROOMCODE`, with no seat credentials in the URL.

## Development

In `services/commander`, run `npm ci`, `npm run types`, then `npm run dev`. This starts the Cloudflare local runtime at port 8787. Run Vite with `VITE_COMMANDER_API_URL=http://127.0.0.1:8787` and an allowed origin (for example `http://127.0.0.1:5197`). Generated Cloudflare types and `.wrangler` state are ignored.

Backend checks: generate types, run the root TypeScript binary against `services/commander/tsconfig.json`, and run `npm run check` in the backend folder. `npm run deploy` deploys only the room service. It does not publish the GitHub Pages frontend.

`node scripts/test-commander-rooms.mjs <API-URL>` creates a temporary test room. It checks two-player sync, seat authorization, credential omission, retry idempotency, concurrent increments, host controls, reset and CORS. The default target is localhost; an explicit remote URL tests the deployed service.

## Verified

297 tests across 50 files and the Pages build pass. Backend types and the Wrangler packaging dry run pass. HTTP integration checks passed in the local Workers runtime and against the deployed Cloudflare service. Browser checks covered a live four-seat room, life/poison/commander-damage entry, read-only opponent tiles and reconnect after refresh. Responsive styles are included; a physical iPhone/Android field test is still useful before calling this a finished mobile product.
# First player and turn tracking

After everyone joins, the host locks seats and opens a server-generated six-sided die roll. Each seat rolls once per round; only players tied for the highest result reroll. The winner starts turn 1. Turn order follows join/seat order around the table, rotated to begin with the winner. Join in physical seating order.

The current player or host can advance turns. Conceded players are skipped; life/poison/damage thresholds remain advisory. New game clears rolls and turns. Existing rooms can start rolling through the host control. Request retries and stale turn/roll submissions cannot advance twice.
