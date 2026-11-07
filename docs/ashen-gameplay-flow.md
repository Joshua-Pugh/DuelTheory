# Ashen Throne gameplay flow — November 6, 2026

This pass addresses response interruptions, phone opening hands and player-facing wording. It does not redesign combat or claim native iPhone validation.

## Responses

Ordinary play now passes a player's opportunity to respond to their own card/effect in the shared engine, before rendering a prompt. The old page-side auto-pass effect has been removed. Opposing cards/effects still allow legal responses; combat windows, effect selections and trigger ordering remain intact. Windows with no legal responses continue automatically.

Full control in duel settings restores own-response windows for that seat. Its serialized `holdResponses` preference and `responseMode` command use the same authority in local and network games. A client can change only its authenticated seat. Missing preferences in older saves default to normal play. Rule-effect fixtures deliberately opt into full control to retain regression coverage of every timing boundary; separate tests exercise normal production defaults.

## Opening hands and display

The opening dialog has a bounded card area and a separate footer for Keep/Redraw. Read a card without committing the hand, browse adjacent cards, or return to the hand. Opposing hands remain hidden during network waiting and local handoff. The existing free six-card redraw and subsequent reductions are unchanged.

The arena follows the visible viewport's dimensions and offsets so browser bars do not push gameplay below the screen. Pinch zoom is not disabled. Short-landscape coin toss layout keeps Begin/Exit reachable. A supported browser can enter fullscreen from an explicit settings button; landscape locking is attempted after fullscreen and failure leaves usable controls and a message.

The public web manifest uses standalone display and the existing DT icons. iPhone users can add DuelTheory to their Home Screen and open it as a web app, removing Safari's normal bars. This is not a popup, an App Store release, an offline-game promise or a universal orientation lock. No service worker/cache layer was introduced. See [Apple's instructions](https://support.apple.com/en-bw/guide/iphone/iphea86e5236/ios) and [orientation API requirements](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).

## Copy and verification

Deck pages describe actual current starter lists, faction/size checks and on-device saving. Internal transcription and executable-rule disclaimers have been removed. The builder states that duels currently use starters; this update does not connect custom builder lists to match registration.

Public AT/shared/Companion tests and all three builds cover this release. Browser checks include 844×300 usable landscape space, 390×650 portrait, card reading, free redraw, reduced redraw and local handoff. Real iPhone Safari/Home Screen and Android-device verification remain necessary before store publication. Existing older tabs may require one reload; previous screenshots showing 91 library entries predate the current 70-card starter pool.
