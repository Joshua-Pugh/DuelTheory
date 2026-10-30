# Internal release 1.0.3 (4)

Published October 30, 2026 at 6:12 PM Eastern. Play Console confirms Active and Available to internal testers, version 1.0.3 / code 4. Release review showed Ready to release. The signed bundle verified with jarsigner, and all 75 web assets matched the tested build. Native assembleDebug and website deployment passed. Preserved signed copy: ../releases/table-companion-20261028/DuelTheory-internal-v4-signed.aab; 20,101,189 bytes; SHA256 d40bc21bf0e23c79f9d21c3979ac1a736826fcb327c48c812dfe2fe56132424f.

- Confirmed guest departure removes their seat; replacement players can join a started table. Host must transfer ownership or close the room.
- App navigation exposes Home, Table, Account and Settings. Email-code account creation remains available without requiring guest sign-in.
- Recorded dice and life adjustment sounds: bundled Kenney CC0 clips, controlled by existing mute/volume settings. See public/audio/table/SOURCES.md.
- Host chooses the shared table theme; players choose their life-panel colors and upload a background. Images are resized, bounded, authenticated room-member-only, and removed on departure/closure/expiry. Reusable images stay on the uploading device, not in account cloud storage. Saved account setups support colors/themes.
- Backend deployed and local/live customization integration passed, including unauthorized access, malformed/oversized images, departure and replacement seats.
- Full suite: 941 tests passed; subsequent expired-room regression: all 6 lifecycle tests passed. Mobile/web TypeScript production builds and native verification recorded separately during release preparation.

Existing internal testers can update through Google Play. Google says publication usually appears within one hour and can take longer.
