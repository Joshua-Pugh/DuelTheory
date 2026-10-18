# Private matches

Private Match is available under Play. Hosts choose GOAT or Ashen Throne and their deck, create a room, and share its invite link. The invited player chooses a deck before claiming the second seat. Both players can choose the same deck. Ready commits the current selection; deck changes clear readiness. Both seats must be ready before the shared coin flip, and both must confirm the toss before play.

The `dueltheory-matches` Cloudflare Worker uses one SQLite Durable Object per room. Server-side game reducers own the state; clients submit commands, never board snapshots. Seat credentials are random bearer tokens stored per room on each device; only SHA-256 hashes are stored by the service. Reopening the same invite on the same browser restores the seat. Clearing browser data loses that seat. There are two seats, no spectator access, and no seat takeover. Rooms expire 24 hours after the last change.

GOAT reuses GameService and all current supported effects. Unsupported lists run full manual play for both seats. AT reuses the Brute/Noble effects kernel. Opposing hands, hidden cards, deck order and shuffle seeds are projected out of client responses. Legal actions and pending searches reveal only the information required for the acting seat. Online seats cannot switch views or undo moves. Phase shortcuts are validated on the authority.

Chat is plain text rendered by React, shared by both authenticated seats. Messages are limited to 500 characters, retained to the most recent 100, and rate limited. It works in the lobby and in a collapsible panel during play. Room changes use revision checks for gameplay and request IDs for duplicate suppression. Lobby confirmations tolerate concurrent player requests. Polling every two seconds resumes on foreground and reconnect; no move is applied optimistically.

## Validation and deployment

- `npm test` and `npm run build`
- `services/commander/node_modules/.bin/wrangler types --config services/matches/wrangler.jsonc`
- `node_modules/.bin/tsc -p services/matches/tsconfig.json`
- `services/commander/node_modules/.bin/wrangler deploy --dry-run --config services/matches/wrangler.jsonc`
- `services/commander/node_modules/.bin/wrangler deploy --config services/matches/wrangler.jsonc`
- `node scripts/private-match-smoke.mjs` creates disposable GOAT/AT rooms on the deployed service and checks two-seat isolation, readiness, simultaneous toss acknowledgement, chat idempotency, reconnect, private hands and synchronized moves. Set MATCH_API to target a different backend. Test rooms expire normally.

Tooling uses the existing installed Commander service Wrangler version. The Commander Worker and its rooms are not modified. The site points to the matches sibling Worker URL. Future rematches, spectators, accounts and public matchmaking are outside this first private-room pass.
## Multiplayer feedback

Incoming chat produces a timed banner and a persistent unread badge. Opening chat starts at the latest message; new messages follow the bottom unless the player scrolls up, with a Jump to latest control to resume following. Old history and the player's own messages do not create incoming alerts.

Face-down GOAT field cards that actually turn face-up produce an opponent reveal acknowledgement. Further gameplay waits until the opponent views the revealed card and continues; chat remains available. Moving a still-set card directly to the Graveyard does not trigger a premature reveal. Generic opponent activity notices cover server-side choices and client target/material pickers. Picker presence expires after 20 seconds without refresh and never contains chosen targets or hidden identities. Presence updates do not change the gameplay revision.
