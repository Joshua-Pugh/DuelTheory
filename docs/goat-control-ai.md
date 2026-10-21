# Goat Control AI prototype

Select **Play → AI Practice → AI opponent → Goat Control**. Chaos Turbo remains available. The opponent uses the existing supported Lolmarcus Goat Control preset, with the ordinary coin flip, single duel or best-of-three, and player-only sideboarding. Both players can use the same deck.

The strategy uses the shared GOAT resource policy, legal-action safeguards and observation boundary, with a separate control scoring profile in `src/ai/goatControl.ts`. It sets Scapegoat for defense or next-turn material, converts tokens/spent Level 1 monsters via Metamorphosis, selects Thousand-Eyes Restrict, absorbs useful threats, and uses Tsukuyomi or Book to reset a spent equipped Restrict when another target remains. It can use matching higher-level Fusions and tribute a spent body for Airknight when appropriate. All actions still require engine legality; Scapegoat never permits another summon on its activation turn.

Strategy reference: [GoatFormat.com — Goat Control](https://www.goatformat.com/goat-control.html). This first control profile is a deterministic heuristic prototype, not a trained or tournament-strength model. The bounded Chaos tactical planner remains specific to that pilot.

`src/ai/pilots.ts` registers deck, label, chooser and version. Game logs, decision feedback and practice records retain the selected pilot version (`goat-control-2026-10-21-v1`), including every sided game. Existing Chaos records keep their original identity. No hidden opposing hand, deck order or face-down identity is supplied to the scoring policy; absorbed hidden cards remain masked after controller changes.

Validation covers the end-phase Scapegoat / next-turn token Metamorphosis / Restrict absorption sequence, target priorities, Tsukuyomi reset, hidden-information invariance, complete autonomous games against Chaos, UI selection, best-of-three continuity and log identity.
