# Internal release 3 — host lifecycle

Prepared Android version 1.0.2 / code 3; not signed or uploaded yet. Accounts remain enabled for this internal build. Android Studio sync backup: android-starter-backup-20261029-175327. Native assembleDebug passed.

Removed PREVIEW from the app banner. Shared web/app table UI now offers Close table & leave for the host, and a host-only transfer selector. Transfers use the authenticated current host, an existing target seat and an expected room revision. The former host immediately loses host-only authority. Closing a room marks it closed, pauses its timer and rejects later joins, resets or mutations. Existing seats can read the closure; updated clients clear their reconnection entries and return to join/create. A failed close leaves the host connected. Guest disconnect preserves its reconnectable seat.

Closure is explicit, not inferred from losing connectivity, backgrounding, browser closure or switching screens. Active clients receive it on the next regular poll; background clients receive it on resume. Closed-room history expires on the existing 24-hour storage schedule. Earlier app versions need the update for automatic UI disconnection; the server still rejects their writes after closure.

Validation: 932 tests across 145 files passed, website/mobile production builds passed, packaged app banner/hosting UI inspected in browser. Live disposable-room integration passed transfer, former-host rejection, host-only closure, closure reads by both seats, duplicate request handling and blocked late join/reset. Deployed table Worker: b8d8b28c-292b-4652-8244-199fa70a83fa.

Not part of this release: Google sign-in, passwords, uploaded backgrounds or live player themes. Account player setups currently save display name and accent; the accent is not yet applied to live panels. No ads or billing SDKs are enabled.

Next priorities: apply player accents and readable themes; add bounded image uploads with deliberate storage/access/deletion rules and cloud syncing; configure Google sign-in across web and Android; test the complete flow with two physical devices; then complete store disclosures/listing and the required closed test before production. Passwordless email remains available.
