# Internal release 1.0.3 (4)

Prepared October 30, 2026. Signed bundle still requires the owner’s private keystore.

- Confirmed guest departure removes their seat; replacement players can join a started table. Host must transfer ownership or close the room.
- App navigation exposes Home, Table, Account and Settings. Email-code account creation remains available without requiring guest sign-in.
- Recorded dice and life adjustment sounds: bundled Kenney CC0 clips, controlled by existing mute/volume settings. See public/audio/table/SOURCES.md.
- Host chooses the shared table theme; players choose their life-panel colors and upload a background. Images are resized, bounded, authenticated room-member-only, and removed on departure/closure/expiry. Reusable images stay on the uploading device, not in account cloud storage. Saved account setups support colors/themes.
- Backend deployed and local/live customization integration passed, including unauthorized access, malformed/oversized images, departure and replacement seats.
- Full suite: 941 tests passed; subsequent expired-room regression: all 6 lifecycle tests passed. Mobile/web TypeScript production builds and native verification recorded separately during release preparation.

Use Build > Generate Signed Bundle / APK > Android App Bundle in Android Studio after syncing. Do not reuse the previous 1.0.2 bundle.
