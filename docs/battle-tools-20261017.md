# Breaker, tabletop tools and battle shortcuts — October 17, 2026

Breaker now asks **Place a Spell Counter on Breaker?** in both rules-assisted modes. After resolution its field card shows a high-contrast counter badge. Existing engine rules still add 300 ATK and consume the counter for destruction. Hidden cards never show counter badges.

Enable **Tabletop tools** for center-field Roll and Counter controls. Drag the counter onto your own face-up field card, or click Counter then the card. Right-click offers add/remove counters, position changes, Set, Special Summon, card activation, and movement as appropriate to card type/location. Legal engine actions remain listed above the manual overrides. An override never automatically pays a cost or applies an effect. Manual rolls are visible, logged and deterministic under replay/Undo; they do not execute Zorc or another effect.

Manual changes are highlighted as **Possible illegal move · … Legality not verified** in History, and the replay reports manual actions. The service still enforces state integrity, ownership, valid empty zones and pending-choice locks. It permits counter-limit overrides (including Breaker above one) with the warning. Counter counts are currently Spell Counters, 0–99; named counter types are future work.

The Manual preference now pauses automatic draws, chain passes, and Damage Step progression. Explicit rules-assisted actions are marked in the menu and remain opt-in. Activate card in the manual section only places/flips the card; the player then moves affected cards. Required choices created by opting into an engine action still need completion. This is a tabletop foundation, not a complete replacement manual rules engine; additional tools such as LP adjustment, arbitrary counter types and guided manual target-only effect workflows remain to be added.

In guided/competitive Battle Phase, click an eligible attacker to attack directly or select a highlighted legal target. Right-click always opens the menu. The sword badge marks eligible attackers. **Attack with all** appears against an empty opposing monster field and queues one attack for each currently eligible monster, in legal-action order. Each attack uses the ordinary engine action and Damage Step. Empty response windows pass automatically; card responses and triggers pause progression. Stop attacks cancels remaining attacks. The queue stops on a defender appearing, phase/turn changes, game end, Undo, or when no queued attacker remains legal. It does not spend extra attacks automatically.

Validation: 178 tests across 37 files and production build pass. Browser checked Breaker's prompt and badge, right-click menus, add/remove counter override warnings, animated tabletop die, click-to-attack and two remaining attacks through Attack with all. Three attackers dealt 1900 + 1400 + 300, reducing the opponent from 8000 to 4400. Replay verified all 45 actions, including manual moves and die roll. Existing Vite main-chunk size advisory remains.

Files changed:

- `src/DuelField.tsx`
- `src/EnginePreview.tsx`
- `src/DuelEffectAnimations.tsx`
- `src/PreferencesPanel.tsx`
- `src/duelField.css`
- `src/services/GameService.ts`
- `src/battleShortcuts.ts` (new)
- `src/battleTools.test.tsx` (new)
- `docs/battle-tools-20261017.md` (new)
- `docs/duel-roadmap.md`
