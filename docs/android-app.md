# DuelTheory Android preview

The app contains Table Companion, local Ashen Throne Brute/Noble duels, AT private rooms with chat, the AT card library, and rules/keyword references. GOAT runtime modules, card catalogs, and artwork are excluded from the mobile bundle.

## Open and run

Open `C:/Users/joshu/AndroidStudioProjects/DuelTheory` in Android Studio **2025.2.1 or newer**, sync Gradle, and run the `app` configuration. The updated Studio installation has synced this project successfully. Both the IDE's local Java setting and Gradle point to the installed JDK 21; use that JDK rather than the new IDE's bundled Java 25 for this Gradle version.

Minimum Android: 9 / API 28. Compile/target SDK: 36. Keep Android System WebView/Chrome updated (version 120 or later).

From the Android Studio project directory:

```powershell
.\gradlew.bat --no-daemon :app:assembleDebug
```

Install `app/build/outputs/apk/debug/app-debug.apk` on a test Android phone. The debug APK is signed for development. The optimized release APK is deliberately unsigned: store signing credentials have not been created or embedded.

AT duels request sensor landscape orientation and hide system bars while active. Exiting restores normal app orientation and navigation. The mobile board uses unlimited Frontline, Rune/Relic and Font lanes, a compact basin and piles, and a side control rail. Tap a card for actions, then choose **View card** for the large reading overlay. Help opens on demand instead of consuming board space. Browser previews show a rotate-to-landscape message when native orientation locking is unavailable.

## Where the code lives

- `src/mobile`: app navigation, home screen, card reader and AT room UI.
- `src/TableCompanion.tsx`: shared table tool.
- `src/games/ashen`: original AT rules/effects.
- `src/duelUi`: shared card backs, controls and presentation.
- `src/platform`: request cancellation, foreground polling, native wake support and public invite URLs.
- `android`: canonical native Kotlin launcher and Android resources.

The UI is bundled locally through Capacitor, not loaded from GitHub Pages at startup. AT local play and references work without a connection. Shared rooms use the existing Cloudflare services; the app's `https://localhost` origin is explicitly allowed, without a wildcard CORS policy. Invite links point to the public website so browser users can join too. Room codes can also be entered in the app.

The standalone Android Studio folder references Capacitor packages in this repository's `node_modules`. Keep this repository in place, or re-run the sync script after moving it.

## Update the Android Studio project

From the web repository:

```powershell
npm ci
npm run android:sync
powershell -ExecutionPolicy Bypass -File scripts/sync-android-studio.ps1
```

The sync script backs up the previous Android project, excludes build caches, and updates the user-provided project folder. Run it with access to that folder. Do not edit generated JS assets directly.

## Validation and remaining work

- Mobile and website production builds pass.
- Full suite: 877 tests passed across 129 files. Four mobile UI checks cover table navigation, AT startup, preserving saved hands on resume, and duel-mode entry/exit restoring the app viewport.
- Native debug and optimized unsigned release builds passed directly in the supplied Android Studio project. The debug APK signature, API 28 minimum, API 36 target and launcher activity were verified.
- Live Android-origin table create/join/read and AT ready/coin/start/chat/leave checks passed.
- Android 15 emulator checks passed for table creation, second-player synchronization, the ready gate and tied-dice reroll, life adjustment, undo, QR generation and an active native wake lock. AT checks confirmed coin/start/resume, Font placement, an on-screen card action menu, landscape/fullscreen entry, the reading overlay, and portrait/navigation restoration on exit. The earlier Android 14 emulator had System UI ANRs; a clean Android 15 test device with hardware graphics was used instead. Physical-phone QA is still required before store release.

No accounts, billing, paid entitlements, cloud artwork sync, push notifications or print-and-play purchasing are included. Native keep-awake is scoped to visible table/AT screens and cleared on backgrounding. Polling pauses in the background and aborts stale reads. Game screens load lazily; the mobile startup JS is about 243 KB before compression. WebView inspection follows Capacitor's debug-build flag and remains disabled in release builds. Performance on a physical device has not been measured.

## October 25 preview update

The app now matches the website’s ivory, forest-green and gold palette and uses the approved Forge Crest launcher/splash artwork. Table Companion displays six-faced animated dice using the authoritative room result, including browser users, and retains first-player results with turn order. Reduced-motion devices show the result without tumbling. The bundle also includes the latest AT opening redraws and battlefield sizing.
