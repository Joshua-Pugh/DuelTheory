# Ashen Throne launch and arena presentation

November 5, 2026. This implements the first presentation pass of roadmap milestone 2. It does not claim a rules audit, AI opponent or the five-encounter campaign is complete.

November 6 follow-up: [gameplay flow fixes](ashen-gameplay-flow.md) move normal own-response passing into the shared engine, add seat-scoped Full control, rebuild phone opening-hand inspection, fit the visible browser viewport and provide Home Screen web-app setup. Earlier statements below about unchanged engine commands describe the initial presentation pass.

## Components and boundaries

- `games/ashen/arena/AshenStartScreen.tsx`: game launch modes, existing-art faction selection and play guidance. Local play continues through the existing coin and opening-hand engine. Friend play keeps its existing AT-only room route.
- `AshenDuelArena.tsx`: mode orchestration, local resume and launch. Leaving a local duel refreshes the resume snapshot without changing save keys or dealing new hands.
- `games/ashen/arena/AshenCardInspector.tsx`: one privacy-aware card reader shared by desktop hover and touch actions. Opponent hands/decks and face-down opponent field cards are not rendered by the reader.
- `games/ashen/arena/AshenClashQueue.tsx`: pending effects in the engine's resolution order. Inspection does not pass priority or mutate gameplay.
- `games/ashen/arena/ashenArena.css`: shared web/native viewport layout. Both Frontlines and Stations remain visible. The hand sits below the field on desktop/portrait and beside it on short landscape screens. Crowded card lanes scroll horizontally; the inspector, references and lesson instructions scroll independently.
- `ashenDialogs.css`: retained reference, opening hand, cost and decision styles. The obsolete `ashenDuelRoom.css` and `ashenPhone.css` were replaced; `mobileDuel.css` now owns native host chrome/chat only.

The root battlefield still owns gameplay/controller orchestration. Further controller and zone-component extraction remains work to do. Card frames, artwork mappings, rules actions and backend commands are unchanged.

## Verification

Public tests cover the actual start/coin/native viewport/resume flow and hidden-card reading. Existing opening-hand, phase, combat and practice regressions remain in the AT suite. Build public, mobile and private artifacts because all three reuse AT presentation. No new per-style tests or test package were added.

Manual checks include desktop start/deck choice/opening hands, portrait 390×844 and landscape 844×390 fields, touch card reading, settings/exit, and completing practice situation 1 through play, Burn, deployment, attack, defender selection and combat damage. Check final screenshots after release, and perform a real Android-device pass before a store release.

## Remaining work

Audit pinned rules/card revisions before changing gameplay. Expand combat/Clash playtesting with populated tables, verify real-device touch and safe areas, and refine contextual actions from player feedback. The computer opponent and First Siege campaign remain separate milestones. No new Android store bundle is published by this web release.
