# GitHub hosting

See [GitHub Pages setup](docs/github-pages.md) to deploy this application without running a local development server.

## Android development preview

The Android app bundles Table Companion and Ashen Throne. See [Android app setup and validation](docs/android-app.md) for the Android Studio project, APK build commands, architecture, and remaining device checks.

## v3.9.3 — Dependency security update

- Set Vite to `^6.4.3` to avoid the vulnerable Vite 6.4.2-and-earlier range.
- Set Vitest to `^5.0.5` to move to the patched test-toolchain version suggested by the audit.
- Requires Node.js `>=22.12.0`. No gameplay changes.
- After extraction run `npm install`, `npm test`, `npm run build`, and `npm audit`; these have **not** been verified in this environment.
- Do not use `npm audit fix --force` without examining the impact.

## v3.9.1 — Damage Step test alignment

- Updated two `GameService` regression tests to explicitly advance through Start, Flip, Calculate, and End following a passed attack response.
- Preserved the real Damage Step state machine; damage is not applied at the attack-response pass.
- Check `npm test` in a dependency-installed environment.

# DuelTheory v3.9 — Creator Studio collection and decks

- Creator Studio has a dedicated top-level navigation destination, separate from the rules-assisted Duel Arena.
- Creator projects now have editable card records (type, faction, resource cost, attack, defense, effect text, frame-template selection and optional embedded artwork).
- Each project can configure two different playtest decks using independent quantities.
- Legacy v3.8 projects without deck lists are supported: their existing cards are treated as one copy in each deck until edited.
- Manual sessions continue to use the shared CreatorTabletop service and are not rules-validated.
- Current artwork upload limit is 700 KB per card; JSON export includes embedded image data. Browser storage may fill quickly, so export projects regularly.
- Template selection is stored on creator cards, but the detailed rendering system still needs to be connected to custom-card previews; the editor currently shows a functional simplified card preview.
- Full application test/build requires running npm install locally; no full build verification in this environment.

# DuelTheory v3.7.1

- Replaced the generic Creator Studio set mark with the new Ashen Throne broken-crown icon.
- Added the icon asset at `public/icons/ashen-broken-crown.png`.
- The icon is now recolored by rarity and used in Ashen Throne card frames.

# DuelTheory v3.0 — D.D. Warrior Lady post-damage calculation effect

- Reusable `toBanished` operation updates monster/spell zones, controller/owner and banished lists.
- Battle damage is calculated before offering the optional D.D. Warrior Lady trigger.
- Battle destruction is deferred until the post-calculation trigger is accepted or declined.
- Accepting creates a chain; both passes resolve the banish effect, and the Damage Step can then conclude.
- Declining performs ordinary battle destruction when the Damage Step ends.
- Focused regression tests added. This is an intentionally bounded Damage Step slice, not complete historical Damage Step timing.

## DuelTheory v2.6 — Optional battle-trigger slice

- Added a battle-destruction reason to the shared Graveyard operation, without changing default effect/cost destruction behavior.
- Added optional trigger choices alongside mandatory trigger scheduling. Mandatory triggers are placed first, followed by supported optional triggers in turn-player order.
- Implemented Mystic Tomato (passcode 83011277): when destroyed by battle and sent from the field to the Graveyard, its owner may decline or Special Summon a DARK monster with 1500 or less ATK from the Deck in face-up Attack Position. The search result is checked again on resolution; the Deck is shuffled on successful resolution.
- Added four regression tests in `src/engine/optionalTriggers.test.ts`.
- This is a **bounded implementation**, not full optional-trigger SEGOC / chain-blocking or historical Damage Step rules. Effects for Apprentice Magician, D.D. Warrior Lady, etc., remain unsupported.
- Engine-only TypeScript source check passed. Full Vite build and Vitest suite must be executed locally (`npm test && npm run build`).

## DuelTheory v2.4 — Damage Step and Flip Effects

Adds an explicit START → FLIP → CALCULATE → END Damage Step with face-down reveal, basic damage and destruction, and queued Magician of Faith/Dekoichi Flip Effects (even when destroyed by battle). The `ADVANCE_DAMAGE_STEP` legal action is used to advance one checkpoint at a time.

**Limits:** Does not support Damage Step chains, damage-modifying effects, battle-destruction triggers, simultaneous triggers, or all GOAT timing/rulings. The current damage checkpoints are a scaffold rather than a full tournament-accurate simulation. The UI exposes the legal actions through the rules-assisted preview.

Run `npm install`, `npm test`, `npm run build`, `npm run dev`.

## v2.1 Battle Declaration Window

- Adds a separate declaration and defender response step to each supported basic attack.
- `PASS_ATTACK_RESPONSE` resolves the basic combat after the defender passes. No attack-response Trap effects are automated yet.
- Does not implement Damage Step activation, attack replay, or damage-related triggered effects.
- All project sections and source files are cumulative.

# DuelTheory v1.9 — Ashen Throne Builder

This cumulative release extends v1.8 with a **Command Siege prototype deck editor**. Within Ashen Throne, open **Command Siege Builder**. Load either Brute or Noble source deck, adjust quantities, duplicate drafts, save drafts in your browser, or export deck JSON. The two source decklists currently contain 57 and 58 document-derived cards, respectively, rather than the required 60. No missing cards or extra quantities are invented.

**Deck validation:** 60 cards and a corresponding faction Command Station; the 16–22 Ley Font range is a recommendation, not a hard rule. The uploaded Command Siege document does not establish a general card copy limit, so the editor does not invent one. Unit, Relic, Rune, Tactic, Strategy and Ley Font data stay specific to Ashen Throne and do not use GOAT deck rules.

**Important:** This is a local deck construction and rules reference feature, not a completed Ashen Throne duel engine. The source catalog has 86 distinct entries, with many incomplete effect transcriptions. Some names, rarity labels, printed cost icons, and card descriptions require comparison to the original DOCX card sheets. The card renderer remains an art-free prototype. Exported JSON is archival; import and sharing flows are future work.

**Install:** `npm install`, `npm test`, `npm run build`, `npm run dev`. A network connection is needed for the initial dependency install; `npm run sync:cards` fetches the separate YGO catalog.

**Checks performed here:** independent TypeScript check of `ashenDecks.ts`, TSX syntax transpilation, package integrity. Full React build/test suite unavailable because npm dependencies are not cached in this environment.

---

# DuelTheory v1.5 — Cumulative Prototype

**Build. Simulate. Master.** Independent TCG strategy sandbox; GOAT is the first ruleset. Not affiliated with Konami.

## Install

```sh
npm install
npm run sync:cards
npm test
npm run build
npm run dev
```

The project preserves the legacy `ygo-sandbox-*` localStorage keys so decks saved under earlier versions on the **same browser origin** remain accessible. Export important decks as `.ydk` or JSON before changing browser/origin.

## v1.5 improvements

- Product-wide DuelTheory name and metadata. Original card-back and favicon SVG assets in `public/branding/` (card back is a future arena asset).
- Deck Builder: duplicate a deck to test variations without overwriting originals.
- Deck Builder: type filters and hide-forbidden option for search.
- Hover a deck card or search result to see the full-size inspector in the builder; add directly from the inspector.
- Copy-limit enforcement and save, load, delete, import/export are retained.

## What is NOT complete

The duel engine is a limited rules prototype; do not assume every card effect, battle procedure, or timing window is automated. Historical card-pool eligibility and banlist require continued auditing. The deck builder provides functional editing but the full app needs end-to-end browser verification. The visual duel field is deferred until the engine is ready.

## Future game adapters

Do **not** encode a second TCG into the GOAT engine. Future games should implement a separate rules adapter and card schema while reusing UI shell, saved deck manager, simulation runner, and card inspector.

---

# YGO Sandbox v1.2 — Visual Deck Builder and Card Inspector

This is a **cumulative** release based on v1.1.2. No previous release is required.

## New in v1.2
- Main/Side/Fusion Decks display card artwork in a compact visual grid. Click a card image to pin a detailed Card Inspector. Hover to temporarily preview it. Hover-only previews do not intercept mouse clicks.
- The inspector displays a larger image plus accessible, real HTML effect text, sourced from the synced card catalog. Press Escape or the close icon to unpin.
- Search results in the deck builder have an inspect (eye) button and a hover preview on the thumbnail. Each grid card has a remove button that appears on hover (always visible on small screens).
- No duel engine rules or card effects were altered in this UI release. The duel board has not yet been replaced by a full visual field.

## Local install
```
npm install
npm run sync:cards
npm test
npm run build
npm run dev
```

**Verification note:** The archive and source files were checked, but the full React build and tests were not run here because dependency installation timed out. The user should execute `npm run build` locally to verify TypeScript and Vite.

**Card text notice:** Text comes from the currently synced card catalog and may reflect modern errata, not historic April 2005 behavior.

---

## v1.1.1 test correction

Corrected the MST-versus-Pot of Greed test: the final hand size is the starting hand size minus the activated Pot plus the two cards drawn (net +1). Added an assertion that Pot leaves hand when activated. No gameplay mechanics were changed.

# YGO Sandbox v1.1 — cumulative local prototype

This folder is a **complete project**, not an incremental patch. It contains the card library, local deck builder, .ydk/JSON import and export, multiple saved decks, opening-hand analytics, experimental Deck Coach, legacy manual sandbox, and the strict rules-assisted duel preview developed through v1.0. No earlier ZIP is needed.

## Install and run

Node.js 22.12+ recommended (Node 20.19+ also supported by this Vite release):

```bash
npm install
npm run sync:cards
npm test
npm run build
npm run dev
```

Open the local address printed by Vite (typically http://localhost:5173). `sync:cards` requires internet access to YGOPRODeck. It now downloads card **metadata for an expanded early-product candidate pool**, rather than only the original ~40-card starter subset. It downloads artwork for a selected starter set. **For all available candidate card artwork**, optionally run `npm run sync:all-images`. This can be slow and create substantial disk usage. The downloaded catalog and images remain in `public/` for subsequent offline local app launches.

If you have an older version, extract this ZIP as a new folder instead of overlaying files. Your browser's localStorage might be origin-specific; export important decks as `.ydk` files from the previous build and import them into the new one. Back up the working folder before replacing it.

## What is usable today

- Browse and search GOAT-era **candidate** cards by name/type; card detail text and local images where cached.
- Build, name, save, load and delete multiple local decks; import/export `.ydk` / JSON. Each save is a snapshot in browser localStorage, not a cloud backup. Export `.ydk` regularly.
- Run repeatable opening-hand simulations and experimental, **heuristic** Deck Coach reports. Results do not claim duel win rates or fully validated combos.
- Try a manual duel-state sandbox or the separate rules-assisted legal-action preview. The strict preview mirrors your chosen Main Deck as both players' decks and shows all hands for debugging. It is not yet a polished tournament duel client.

## What is NOT finished

- Every card's complete executable effects. The full card metadata sync **does not** automatically convert effect text into rule logic.
- Complete GOAT-period legal pool certification, historical text/errata, every promotional exception, and full banlist verification. A product/set filter is only a candidate filter, not tournament approval.
- Full battle/damage step, open-game response windows, SEGOC/simultaneous trigger ordering, continuous effects, historical ignition priority, user-friendly full-board drag/drop play, AI opponent, or trustworthy match-win probabilities.
- Automatic download/install of npm dependencies without internet access.

## Architecture

`src/engine/model.ts`: game state and per-copy card instances. `src/engine/rules.ts`: legal action generation, dispatch and chain resolution. `src/engine/operations.ts`: reusable card operations. `src/engine/rituals.ts`: exact / at-least Level requirements, Zorc and Shinato supported. `src/engine/synergy.ts`: explicitly labeled synergy hypotheses. `src/core/`: deck and probability systems. The strict engine allows only implemented effects; other effects remain manual.

## Cautions

YGOPRODeck metadata/card images are used for local fan prototyping, not as proof of rights to commercial redistribution. Before a public launch, confirm intellectual property and image-use permissions. Source information: https://ygoprodeck.com/api-guide/ and https://www.goatformat.com/cardpool.html.

## Verification

Run `npm test` and `npm run build` after installation. Packaging/source checks alone do not verify browser behavior. See prior `src/engine/*.test.ts` and `src/core/*.test.ts` for implemented regression cases.

## v1.1.2 TypeScript build corrections
- Narrow ACTIVATE_CONTRACT actions before reading ritual materials in rituals.test.ts.
- Remove unused mstActions inChain parameter.
- Remove unused summoning test imports.
- Changes are compile-only; no gameplay rule changes.


## v1.2.1 High-resolution on-card reading

The v1.2 sync cached `image_url_small` thumbnails and enlarged them in the Card Inspector. `npm run sync:cards` now downloads **both** thumbnails (`public/cards/<id>.jpg`) and full card scans (`public/cards/full/<id>.jpg`) for the starter set. The inspector prefers full scans and displays them up to 385px wide; deck grids continue to use thumbnails. `npm run sync:all-images` downloads both variants for the full candidate pool and can be bandwidth-heavy.

Run `npm run sync:cards` again after upgrading. Existing thumbnails will stay cached and missing full scans will be downloaded. Full images may still have limited small-print resolution; adding high-fidelity card-face text rendering is a separate future feature. Historical text can differ from current image text.

## v1.3 Builder improvements
- Adding cards now enforces April 2005 copy limits across Main, Side, and Fusion Decks. Existing imported illegal decklists remain visible and flagged; additions are blocked.
- Inline feedback shows added cards and reasons a card cannot be added; Add controls disable at the applicable limit.
- The Card Library now directs users into the Deck Builder rather than silently modifying a deck.
- The builder includes a persistent, high-resolution card viewer when inspecting a search result.
- Historical eligibility remains advisory rather than fully certified.


## v1.4 — Visual deck workspace

- Larger 10-column Main/Side/Fusion card grids on wide desktops (responsive down to five columns on mobile).
- Collapsible search panel, with the deck canvas expanding to use the space.
- Full-resolution card inspector placed beneath the card grid, accessible by selecting any deck or search card.
- Existing deck saving, `.ydk` import/export, and copy-limit protections retained.
- Project branding is still provisional; official card-back art is not included.


## v1.6 builder workspace

Top navigation replaces the side rail. Builder features a sticky full-resolution viewer on the left, grouped Monster/Spell/Trap sections plus Fusion and Side Deck in the center, and searchable cards on the right. Drag a search card into its valid destination or move cards between Main and Side zones. Click + to add, or − to remove. All drops reuse `additionIssue` and `addCard`; dragging between zones removes the old instance first to avoid copy-limit false positives. Drag-and-drop is intended for desktop; buttons remain available for touch devices. Changing the order *within* one group is not implemented in this pass.


## v1.7 — Ashen Throne prototype hub

The top navigation includes an **Ashen Throne** section. It contains separate tabs for Command Siege v0.3.9 and Battle Siege v1.8. Command Siege includes a condensed rules overview, its Ley Font / Essence system, phases, combat, Clash, keyword glossary, and descriptions of the two source prototype decks. This is a **reference interface**, not an executable Ashen Throne engine or imported card catalog. Both card documents retain their Ashen Forge Games prototype attribution; hosting them does not transfer IP ownership. Original source rules and card definitions are not changed.

Next: import vetted prototype card data into a game-scoped card registry, generate art-free card faces, add a per-game deck builder, and implement a separate Command Siege rules adapter.

## v1.8 — Ashen Throne digital prototype hub

Open **Ashen Throne** in the top navigation. It now has its own ivory/bronze/ash theme, three views (Rules Reference, Card Catalog, Prototype Decks), interactive art-free card faces, faction/type search, and a card inspection panel.

The catalog `src/ashenCatalog.json` was extracted from the supplied Brute and Noble Word prototype files. It contains **86 distinct faction-specific card entries**; the displayed roster counts are **57 Brute** and **58 Noble** excluding Command Stations. These are *extracted rows*, not certified complete 60-card decklists. Some Word text is stored in floating shapes, so only a few effects are manually transcribed; other effect entries explicitly say **Text review**. We must verify all costs, symbols, rules text, and quantities against the actual prototypes before enforcing card behavior.

Command Siege and Battle Siege remain separate. The Ashen Throne catalog is not part of the Yu-Gi-Oh GOAT card pool, and no Ashen Throne cards are yet executable in the duel engine. SVG/HTML art-free card faces do not depend on pre-existing artwork.

**Ownership:** Ashen Forge Games is retained as the attribution present on the source prototype cards. Hosting in DuelTheory does not assign, license, or transfer copyright.

To run: `npm install`, `npm run dev`. Validate with `npm test` and `npm run build`. Dependency installation was not available offline in the packaging environment, so a full React build was not run here.

## v1.9.1 Command Siege source deck reconciliation

Both included starter decks are now 60-card main decks, with the Command Station separate. Brute: 24 Units, 3 Runes, 5 Relics, 4 Strategies, 6 Tactics, 18 Ley Fonts. Noble: 20 Units, 4 Runes, 4 Relics, 5 Strategies, 5 Tactics, 22 Ley Fonts. Restored omitted card entries: Ashen Warhawk, Warband of Bloodfire, Ashen Strike, Ashenfield War Ram, and Ashenfield Lance. The five restored cards remain flagged for effect transcription review where needed.

Click **Load Brute** or **Load Noble** to load the corrected built-in starter. Previously saved custom decks remain untouched and may still reflect older counts; reload the source starter and save if you want to replace an old version.


## v2.0.0 — Session GameService and first battle loop

- `src/services/GameService.ts` owns isolated in-memory GOAT sessions and exposes create/getState/getLegalActions/dispatch/getHistory/close. The React strict-engine preview uses this service instead of calling engine reducers directly.
- First **restricted** Battle Phase slice: direct attacks, face-up monster combat, simple facedown defense combat, ATK/DEF damage, battle destruction, LP loss, and winner declaration. A monster may attack once per turn; first-turn attacking is blocked.
- Deck-out already ends the duel on a required draw; normal turn advancement and the initial chain and summoning actions remain.
- The strict-engine preview shows current monster zones and LP. Manual mode is unchanged.
- **Important:** This is not yet a fully GOAT-accurate battle engine. Attack-response windows, Damage Step chains, battle flip-effect activation, replays, simultaneous timing, continuous ATK modifiers, effect-based summoning locks, and complete priority rules are not implemented. Known battle Flip Effects are blocked rather than silently resolved incorrectly. Other unsupported battlefield effects may still affect legality, so treat the strict preview as experimental.
- No multiplayer backend or cross-refresh session persistence is included. The service is per app instance and can manage multiple sessions, not a global shared duel singleton.
- Source-level engine TypeScript check passed using global `tsc`. `npm test` could not execute because Vitest is not installed here. Full Vite/React build is unverified; run `npm install && npm test && npm run build` locally.


## v2.2 Attack-declaration Trap slice

- Attack declaration response window supports set Mirror Force and Sakuretsu Armor via the existing chain.
- Chain resolves in reverse order after two response passes; destruction cancels the pending attack.
- A target leaving the field currently ends the attack with `REPLAY_REQUIRED` logged; full attack replay choice and Damage Step timing remain **not implemented**.
- This is still not a complete GOAT chain/priority scheduler. Attack responses beyond the two added traps and limited MST interactions remain unsupported.
- New tests: `src/engine/attackTraps.test.ts`. Run `npm test && npm run build` on a dependency-equipped machine.


## v2.3 — Attack replay decisions

Added legal `REPLAY_ATTACK` and `CANCEL_REPLAY` actions when a target disappears or the defending field changes during a resolving chain. The attacker may choose a legal replacement target (or direct attack if no monsters remain) or cancel the attack; canceling consumes the attack. A replay selection returns to the simplified defender response window. Regression tests added in `src/engine/replay.test.ts`.

**Limitations:** This is a transitional implementation, not a tournament-complete Battle Step or Damage Step. Damage-step windows, face-down Flip Effect timing, and full chain/timing rules are still outstanding.


## v2.5 — Mandatory trigger batch scheduler

- Simultaneous **mandatory** triggers are built into one chain before either player receives a response opportunity.
- The turn player's mandatory triggers are placed first, followed by the non-turn player's; each player chooses the order among their own triggers.
- Sangan's field-to-Graveyard trigger and supported battle-revealed Flip Effects can coexist in a chain batch.
- During active Damage Step checkpoints, unrelated Main Phase actions and general chains are not offered. Full historical Damage Step activation windows, optional triggers, and SEGOC remain future work.
- Engine state is cloned per dispatch; GameService retains separate session histories.


## v2.5.1 Brand assets
The main header now uses `/public/branding/dueltheory-crest.png` and `dueltheory-wordmark.png`. The browser favicon uses `icon-32.png` and iOS home-screen icon uses `icon-180.png`. Source files are separate transparent PNGs; existing game logic is unchanged.


## v2.7 — Shining Angel and shared battle recruiters

- Shining Angel (95956346) uses the existing Mystic Tomato optional battle-recruiter chain pathway, changing the qualifying Attribute to LIGHT while keeping the 1500 ATK ceiling and face-up Attack Position.
- Optional triggers may be declined even when no eligible monster/zone exists.
- Added four focused recruiter regression tests.
- Independent engine TypeScript check and compiled runtime smoke test passed. Full Vitest/Vite checks could not run because npm packages are not installed and offline installation failed.
- **Known limitations:** battle-trigger window timing, full simultaneous optional-trigger sequencing, D.D. Warrior Lady's Damage Step effect, and Apprentice Magician's special behavior are not yet implemented. This is not a full GOAT tournament-rules certification.

## v2.8 — Position system foundation

- Added a reusable `placeMonster` helper with explicit effect-defined permitted positions.
- Normal Summon is face-up Attack; Set is face-down Defense; Tribute Set follows the same position policy.
- Added once-per-turn manual battle-position changes on a later turn, except after attacking or summoning that turn.
- Ritual Summons and Mystic Tomato/Shining Angel continue to summon face-up Attack only under their currently supported effects. Other Special Summon position choices must be supplied by the corresponding card effect and are **not** automatically legal.
- Position tests added in `src/engine/positions.test.ts`.
- Future work: broader Special Summon effects, position-change Spell effects, and historical GOAT card-specific position restrictions.

## v2.9 — Quick-Play position-effect foundation

- Added Book of Moon (14087893) to the strict GOAT engine using an explicit targeted Spell Speed 2 chain effect.
- Activatable from hand during the controlling player's open Main Phase; previously Set copies may activate in valid response windows on later turns, but not the same turn they were Set.
- On resolution, a face-up monster becomes face-down Defense Position; a pending attack by that monster ends without damage.
- Added `bookOfMoon.test.ts` regression tests for attack cancellation, Set-turn restrictions, and face-down targeting.
- Scope: this update does **not** implement D.D. Warrior Lady or full Damage Step priority/activation timing. The present Battle Step response model is still deliberately limited.


## v3.1 — Apprentice Magician and Integrated Battle Regression

- Apprentice Magician's optional battle-destruction effect reuses the trigger/chain scheduler to Special Summon a Level 2 or lower Spellcaster from the Deck in **face-down Defense Position**. Targets can be declined.
- Summoned Apprentice Magician now offers its counter effect only when a modeled, eligible face-up counter recipient is on the field; initially modeled recipient IDs are Breaker, Royal Magical Library, Skilled Dark Magician, and Skilled White Magician. Counter capacity and supported recipient catalog require further audit.
- Includes a 5-test Apprentice suite with integrated battle-declaration → Damage Step → optional trigger → chain → face-down Special Summon scenario.
- **Limitations:** complete GOAT simultaneous triggers, historical counter interactions, battle responses, and comprehensive full-duel validation remain incomplete. The build still requires dependency-based verification.


## v3.2 — Local player preferences / Guided Mode foundation

- Preferences page stores mode and learning preferences under `dueltheory.preferences.v1` in browser localStorage. No login, backend, or migration of deck keys.
- Guided mode shows authored, deterministic explanations for supported engine action types and selected target hints. Competitive mode retains the same game legality with reduced explanation UI.
- An optional confirmation step prevents accidental clicks on legal actions; the engine remains authoritative.
- Manual mode currently points players toward the *existing separate basic manual sandbox*. This is **not** unified with the verified GameService, and manual resolutions are not safe to treat as accurate simulations.
- No additional card-effect automation is claimed in this release. Next engine milestone is state-invariant replay testing and typed manual override actions with isolated provenance.
- Browser localStorage is device/browser-specific and can be cleared; backups/export of decks remain important.

## DuelTheory v3.3 — deterministic replay and checked manual session operations

- `GameService.verifyReplay(sessionId)` rebuilds state from the original seeded starting snapshot and the full ordered action stream, including explicit manual moves. It reports whether replay matches the current session and whether the session is still entirely rules-verified.
- `GameService.rewind(sessionId, actionCount)` restores a prior snapshot for **local solo practice** and discards subsequent actions. It must not be offered in ranked multiplayer or after hidden-information events without a suitable disclosure policy.
- `GameService.dispatchManual` provides explicit zone-safe manual moves, logged as `MANUAL_OVERRIDE`. These actions never go through or masquerade as GOAT legality checks. A manual action marks the session as not rules-verified.
- `auditDuelState` checks for duplicate/missing instances, zone mismatches, and basic ownership consistency. The service audits after rules and manual actions before committing.
- Rules-assisted preview includes replay verification and solo undo controls. The pre-existing separate manual sandbox is retained. A fully integrated manual drag-and-drop Arena is **not** claimed complete.
- Added regression tests covering replay, rewind, manual overrides, and state integrity.
- Full React/Vitest build must be run locally; independent TypeScript module checks were run in the release environment.

## v3.4 — Creator Studio groundwork (local-only)

- The **Duel Arena** now contains a shared rules-neutral manual tabletop for GOAT and Ashen Throne Command Siege, replacing the older separate primitive manual preview. The rules-assisted GOAT Engine Preview remains intact below it.
- Data-driven `GameDefinition` declares zones, starting hands, and starting health. The Ashen Throne Command Station starts in its own station zone, outside the 60-card draw deck.
- Explicit movement, draws, flipping, rotation, counters, health adjustments, pass-turn, and a limited in-memory Undo action are available. Both drag/drop and click-to-select then click-to-move are supported.
- Sessions autosave using a **new localStorage key** (`dueltheory-creator-tabletop-v1`) and can be exported as JSON. Starting another table replaces the stored manual session. Older GOAT and Ashen deck saves remain under their existing keys.
- **Limitations:** this is a single-browser, two-seat manual playtest surface. No user-uploaded arbitrary game definitions, custom rule scripting, true online rooms, permission isolation, automated Command Siege rules, or simulation-valid match results yet. Manual actions are explicitly unverified. Undo history is memory-only and does not survive refresh. Card piles are not yet a polished individual slot grid. This build does not expose creator project publishing.
- **Checks:** pure TypeScript `CreatorTabletop.ts` strict compile and standalone runtime smoke checks passed. Additional Vitest regressions added but not run. Full React/TypeScript build was not run because offline npm could not retrieve React types; run `npm install && npm test && npm run build` in a connected environment.


## v3.5 — Ashen Throne frame integration
- Added a reusable `AshenCardFrame` renderer powered by the grayscale ornate frame asset.
- Applied faction-tinted frame treatments for Brute and Noble cards.
- Removed rarity text from the middle type line and replaced it with a color-coded set icon.
- Added live framed previews to the Ashen Throne catalog, deck builder, and creator tabletop inspect panel.
- Copied the frame master into `public/ashen/ashen-frame-base.png` so the site can render prototype cards without external tooling.

## v3.6 — Creator card templates, artwork, set symbol
- Six selectable layouts in the Ashen Throne card catalog: Ashen Ornate (the grayscale metal-frame master), Classic Fantasy, Modern Minimal, Full Art, Tactical, and Print & Play. The five generic layouts are drawn in CSS and require no template image.
- New original set symbol is rendered as an SVG shield/spire and uses the card rarity (Iron, Bronze, Silver, Legendary) for metal color. No rarity wording appears on the middle type line.
- Artist artwork uploads (PNG/JPEG/WebP, maximum 8 MB each) store as binary Blob entries in browser IndexedDB, keyed by Ashen card ID. Images appear immediately in the selected card preview.
- Template choice saves in browser localStorage. Clear artwork removes that card's locally saved image. Exporting the deck does not embed the binary artwork; it remains in the browser until later creator-project export support.
- The Ashen card inspector and deck-builder preview use the same renderer; selected cards in the manual Arena can use the same frame renderer. Nonselected gallery thumbnails use art placeholders for efficiency.
- These are *prototype* card layouts and should be reviewed at actual print size before relying on them for production.

## v3.7 — Creator frame polish and customization
- Six-template visual comparison in the Ashen Throne card catalog.
- Live accent and parchment colors; artwork zoom and horizontal/vertical crop adjustment.
- Preferences saved locally with bounded numeric values and validated hex colors.
- Reusable `FrameLook` render settings separate from card rules and card data.
- Regression test for color validation and artwork crop constraints.
- The ornate frame retains its grayscale source image. Other templates remain code-rendered prototypes, not final professionally illustrated assets.
- Artwork and preferences are device/browser-local. There is no print-ready export or full creator frame editor yet.


## v3.8 Creator Projects
- Local Game Definition Editor in the manual Arena: create zones, card roster, starting health and hand.
- Open custom projects in the existing shared manual tabletop; GOAT and Ashen Throne demos remain available.
- Local save/load plus project JSON export/import and validation.
- Custom games remain manual-only; no rules enforcement, online sharing, or art upload in this editor.


## v3.9.2 — TypeScript regression test repair
- Fixed TypeScript narrowing in Apprentice Magician, Mystic Tomato, and Shining Angel regression tests by filtering to `ACTIVATE_TRIGGER` actions before reading `choiceId` and `monsterZone`.
- No runtime game logic was changed.
- Run `npm test`, `npm run build`, and `npm audit` locally to verify. The full build was not runnable in the offline packaging environment.

