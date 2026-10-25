# DuelTheory Android preview

The app contains Table Companion, local Ashen Throne Brute/Noble duels, AT private rooms with chat, the AT card library, and rules/keyword references. GOAT runtime modules, card catalogs, and artwork are excluded from the mobile bundle.

## Open and run

Open `C:/Users/joshu/AndroidStudioProjects/DuelTheory` in Android Studio **2025.2.1 or newer**, sync Gradle, and run the `app` configuration. This machine currently has an older Android Studio installed; update it before using the IDE Run button. The command-line build uses the installed JDK 21 and works without upgrading the IDE.

Minimum Android: 9 / API 28. Compile/target SDK: 36. Keep Android System WebView/Chrome updated (version 120 or later).

From the Android Studio project directory:

```powershell
.\gradlew.bat --no-daemon :app:assembleDebug
```

Install `app/build/outputs/apk/debug/app-debug.apk` on a test Android phone. The debug APK is signed for development. The optimized release APK is deliberately unsigned: store signing credentials have not been created or embedded.

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
- Full existing suite: 873 tests passed; focused mobile/transport/wake tests: 27 passed. An additional saved-duel resume check passed; the three mobile UI checks cover table navigation, AT startup and preserving saved hands on resume.
- Native debug and optimized unsigned release builds passed directly in the supplied Android Studio project. The debug APK signature, API 28 minimum, API 36 target and launcher activity were verified.
- Live Android-origin table create/join/read and AT ready/coin/start/chat/leave checks passed.
- The existing Pixel emulator repeatedly reported Android System UI ANRs, including on the Android home screen. APK installation succeeded, but responsive visual/device QA remains incomplete. Test on a physical phone or healthy emulator before release.

No accounts, billing, paid entitlements, cloud artwork sync, push notifications or print-and-play purchasing are included. Native keep-awake is scoped to visible table/AT screens and cleared on backgrounding. Polling pauses in the background and aborts stale reads. Game screens load lazily; the mobile startup JS is about 242 KB before compression. Performance on a physical device has not been measured.
