# Event Hub: path to 500 tables / 1,000 players

Status: design plan, November 4, 2026. The shipped pilot still allows 4–6 tables. It has not been load-tested or approved for a 500-table event.

## Why increasing the table limit is insufficient

One EventHub Durable Object currently stores a JSON event record, including every table and member. Each read parses that record and constructs a directory; each action clones and rewrites event state. Each visible client polls every two seconds. With 1,000 visible player devices, polling alone creates approximately 500 reads/second, or 1.8 million/hour. Organizer and display devices add traffic. This is arithmetic from our polling interval, not a measured capacity limit.

The organizer receives the whole event state, and each guest receives the directory plus their table. That repeats unrelated information and would grow with table count. Round operations and SQLite history inserts also run within the same event object. Faster polling worsens these costs.

## Proposed service boundaries

1. **One persistent table object per event/table.** It owns seats, reconnect permissions, totals, counters, local history and the first-player roll. A player subscribes only to their table. Persist changes before acknowledging them. Keep bounded recent logs and fetch older history in pages.
2. **An event coordinator and compact table index.** Store event metadata, organizer/staff roles, round number, table availability, status summaries and unresolved assistance requests. Do not send every player's full history to the dashboard. Search and filter by table number, status or assistance; paginate or virtualize the directory.
3. **Push changes over authenticated WebSockets.** Use Cloudflare's hibernation API where appropriate, with versioned messages and a snapshot/replay path after reconnect. Acknowledge mutations with stable request IDs so retries cannot duplicate damage or rolls. Retain bounded, backed-off polling only as a fallback. A public QR contains an invitation, never organizer credentials.
4. **Summaries and targeted delivery.** Tables send changed summaries to the coordinator through a durable outbox or equivalent retryable delivery. Organizer clients receive small batches of changed summaries. Announcements have stable IDs and explicit recipients; assistance requests persist until resolved and are distinct from temporary popup presentation. Staff assignment, acknowledgement and an unresolved-request queue are needed when hundreds of tables can call at once.
5. **Round transitions are coordinated workflows.** Across independent table objects, start/end/reset is not one atomic transaction. Save a round operation with a unique ID and expected table generation, dispatch it in bounded batches, record each table's acknowledgement, and retry missing acknowledgements. Show partial progress and failures instead of declaring the whole event ready early. Event closure must reject new joins immediately and reliably close/revoke table seats; reopening advances generations to reject stale actions.
6. **Accounts and permissions before production events.** Organizer access is currently a browser credential. Move ownership/recovery to verified accounts, with scoped staff roles, revocation and audit logs. Separate a public display, a guest seat and a staff dashboard. Apply per-identity limits without treating a store's shared Wi-Fi IP as a single player. Never trust client-supplied role or table IDs.

## Release gates

- Keep the pilot small while collecting real store feedback. Measure response size, CPU time, persistence writes, polling traffic and error rates first.
- Build the independent table service, compact directory and reconnect protocol behind a versioned rollout. Preserve old QR URLs through server routing. Test migration and rollback with archived events before moving live ones.
- Exercise staged 20-, 100- and 500-table environments with synthetic clients. Include 1,000 connected players plus staff/displays, simultaneous round starts, ties, damage bursts, duplicate requests, reconnect storms, background/foreground transitions, server restarts, staff revocation and event deletion.
- Proposed targets, to validate rather than claim today: no lost acknowledged changes; no duplicate damage from retries; ordinary updates visible within one second at p95 on a healthy network; reconnects converge on authoritative state; round transitions show accurate per-table progress. Record p95/p99 latency and failures under sustained and burst loads.
- Record traffic and billing estimates from the staged workload, set usage alerts, and test poor venue Wi-Fi. Do not market 500-table support until these gates pass. Cloud connectivity remains required; local display of a previous value must clearly distinguish disconnected state.

## Official references

- [Cloudflare Durable Objects WebSocket best practices](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Hibernating WebSocket server](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/)

Cloudflare documents support for many WebSocket connections per object, but that does not establish capacity for our event workload. CPU, memory, payload size and persistence behavior still require measurement.
