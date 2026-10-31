# Event Hub store demo

Open `https://dueltheory.com/#/event-hub` or Table Tools → Event Hub demo.

1. On the organizer laptop, choose 4–6 tables, 2–8 seats per table, and a game profile. Edit its starting life, counters, damage sources and tap/hold amounts as needed. Create the hub.
2. Select a table. Show its QR on screen, open the read-only table display on a separate device, or choose Print table QR cards and print the invitations. The central directory QR lets players choose a table.
3. Players use separate phones or browsers to scan, enter a name and join without accounts. The organizer device is deliberately not a player. Players can occupy only one seat per event device token.
4. When a table is full, the organizer chooses Lock seats & roll. Each player rolls a server-generated die. Ties require another roll. Life controls appear when the first player is known.
5. Demonstrate life changes, custom amounts, counters, named source damage, undo, optional turn passing, timer, shared Table Title, colors and recorded sounds. A player can Call organizer; the dashboard highlights that table. Post an announcement to the room.
6. New game resets the same players. New group archives the previous session and frees every seat. The physical table QR remains unchanged, and former seats lose access. The last three games appear in the dashboard. Older archived games remain on the server and are included in Download event history. Current game logs contain up to 80 recent entries.
7. Refresh the organizer page to demonstrate persistence. Back to hubs lists hubs created in this browser.

## Pilot limits

- Online, browser-first demo. No Android release is needed to try it on phones.
- Event data and table identities persist on the server. Organizer access is a random device credential stored in the creating browser; it is not yet attached to the Supabase account. Do not clear that browser's saved data. Sharing an ordinary event/table link never shares organizer access.
- No paid subscriptions, staff roles, pairings, brackets, automatic card effects or match-result reporting. Organizer corrections require a logged explanation. Players change only their own trackers. Event player colors work; uploaded background sharing remains in the regular Table Companion.
- Visible pages refresh every two seconds with cancellation and backoff. Hidden/offline screens stop polling. Values change only after the server confirms a write; repeated network retries share a request ID.
- Current game logs are limited to 80 recent entries; archived game snapshots are stored separately. This is not a complete tournament audit system. Do not use this pilot as the sole record of an official event.

## Verification

`npm test` covers ordinary tracker regression behavior and event authorization, separate tables, unseated organizer controls, session generations, replay protection, assistance and archives.

With the local Worker running, `node scripts/check-event-hub.mjs` checks actual HTTP creation, guest joining, authorization, random dice, large life changes, retry deduplication, help, archives and old-seat rejection. It creates a disposable local hub. Set `EVENT_TEST_API` explicitly only when intentionally testing a remote service.

The public search landing pages remain crawlable. Their copy is written for players, their navigation launches the actual tools, and links to them appear only on the main website home footer, not the tracker.

See [the store walkthrough](event-hub-store-walkthrough.md) for the two-phone round demonstration.
