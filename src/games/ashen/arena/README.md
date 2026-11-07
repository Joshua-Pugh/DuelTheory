# Ashen Throne arena ownership

Arena components present an existing `Battlefield`; they do not decide damage or legal moves.

| Module | Owns |
|---|---|
| `AshenBattlefieldCard.tsx` | Card face/privacy, current stats, readiness and combat affordances; emits callbacks only |
| `combatView.ts` | Read-only selection/link projection using the engine's legality inspections |
| `AshenCombatConnections.tsx` | SVG geometry, resize/scroll observation and listener cleanup |
| `AshenCombatFeedback.tsx` | Short damage/destruction feedback from authoritative receipts, without replay on load/undo |
| `AshenCombatSummary.tsx` | Accessible assignments, damage order and actual result; explicit close and Escape |
| `ashenCombat.css` | Combat indicators and reduced-motion presentation; card assets are unchanged |
| `useArenaDisplay.ts` | Visible-viewport and user-requested browser fullscreen behavior |

`../duel.ts` owns timing, attack selection, legal blocks, blocker removal and combat resolution. `../combatReport.ts` is the serialized receipt contract, containing only public combat data. The same `matches/ashenCommands.ts` path validates network commands against the authenticated seat. Presentation must never mutate a remote snapshot or invent a damage forecast.

The root `src/AshenBattlefield.tsx` remains the controller for local selection, card actions and network dispatch. Card rendering was extracted in this pass; extracting its remaining zones/controller work is deferred until useful, rather than rewriting working code wholesale.

Use the focused `arenaCombat.test.tsx` regressions for readiness/Standfast, Soar restrictions, single-assignment ownership, direct touch controls and actual combat receipts. Existing effect/phase tests remain. The local-only populated review at `tools/ashen-arena-review/` is not a public route or release asset.
