# DuelTheory — GOAT Duel Field Alpha Patch

## Apply
Copy the `src/` folder into your CURRENT Codex-updated DuelTheory working directory and replace matching files. Do not replace your whole project with v3.10.1. No deletions or package dependency changes.

## Modified
- `src/EnginePreview.tsx`: removes the GOAT text-only development battlefield and plugs in the new field; retains current GameService state and action dispatch, confirmation, audit, and undo.
- `src/ashenLayered.css`: adds an overflow guard for the card subtype plaque. Keeps the existing approved layered frame and material rendering.

## New
- `src/DuelField.tsx`: two-sided GOAT board, card zones, hands, decks, graveyards, banished counters, 8,000 LP display, current phase and turn, card inspector, legal-action buttons, history, practice seat switching, and victory display.
- `src/duelField.css`: scoped responsive DuelTheory field visuals.

## Current limits (important)
- GOAT effect automation remains incomplete. The field calls only the existing GameService legal actions and does not claim full GOAT card effect coverage.
- Start is currently a local practice duel using a mirror deck, not online PvP. Practice seat switching is local; not private multiplayer.
- No drag/drop board moves yet; use the engine's legal-action buttons in the right panel. Manual tabletop remains in Creator Studio.
- As of this patch, Ashen card preview cropping and exceptionally long subtype wording might require further data cleanup; labels are constrained to the type bar rather than spilling outside it.
- No changes to existing card lists, user deck saves, engine rules, or Codex ornamental assets.

## Test locally
```
npm install
npm test
npm run build
npm run dev
```
This patch has not passed a full local build in the assistant's environment because npm dependencies were not available offline.
