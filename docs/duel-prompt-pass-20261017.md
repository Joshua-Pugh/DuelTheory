# Summon responses, optional effects, and field orientation

Optional effect decisions now offer **No · skip effect**, which dispatches the legal decline action immediately. Kycoo's early-return action generator was missing that action; it now supports declining without picking targets or starting a chain. Required effects use explicit required-effect wording instead of asking whether to use them. Tsukuyomi and Breaker's summon-counter trigger remain mandatory in guided play. An activated Spell or chain cannot be canceled by declining a response; **No response · continue** passes priority and lets resolution proceed.

Summon response windows show direct activation buttons for the responding player's legal cards, including Torrential Tribute. If the current local viewing seat differs from the responder, **View your response cards** switches the view without passing priority or revealing face-down identities to the other seat. The window explains that passing ends the Torrential opportunity for that summon. Tests exercise both players' Torrential in response to a Normal Summon and as a chain to Breaker's mandatory counter trigger. Newly Set traps and expired summon windows are rejected.

Routine phase changes no longer open a blocking Book of Moon/MST prompt. Set Quick-Play Spells and free-chain traps remain accessible through their legal card-menu actions during the other player's idle phases. The draw-phase checkpoint for a live Trap Dustshoot is retained. Chain/draw response decisions use a compact response panel rather than a large effect popup. Summon and attack response opportunities remain explicit so meaningful timing windows are not silently skipped.

Opponent field artwork and card backs rotate 180 degrees relative to the viewing player. Defense-position cards retain their quarter turn; zone labels and counter badges stay readable. Switching viewing seats automatically reverses which field is rotated.

The browser test also exposed a played-card visibility problem during delayed animation cleanup. Arrival now uses a finite opacity animation instead of `visibility:hidden` tied to a JavaScript timer. Both draw and hand-to-field flights clean themselves up on animation end as well as the fallback timer. The real card becomes visible when the CSS arrival finishes even if timer cleanup is delayed.

## Verification

- 215 tests across 41 files, including nine focused summon/decline/response tests.
- Production and GitHub Pages builds.
- Browser scenario: Chaos Turbo, seed 1047, P1 sets Torrential and Normal Summons Spy, then P2 Normal Summons Mystic Tomato. P1 switches into its response view, activates Torrential directly, and both fields clear. Opponent artwork computes to a 180-degree rotation; field cards remain visible after their arrival animation.
- Proof screenshot: `../duel-summon-response-20261017.png` is saved outside the repository in the parent DT workspace.

Historical reference: https://www.goatformat.com/rulings7.html (Tsukuyomi's mandatory effect and Torrential timing); https://www.goatformat.com/basics.html (GOAT priority).

The AT duel area is the next design discussion. This pass does not change AT rules or introduce an AT duel implementation.
