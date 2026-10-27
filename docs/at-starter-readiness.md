# AT two-deck starter review

This records verification work, not a declaration that the paid starter is ready.

## Reviewed in this pass

- Every current catalog card has an implemented Brute/Noble effect definition. This is a coverage check, not proof that every effect is correct.
- The complete automated suite passes: 898 tests across 134 files. Existing AT tests cover opening redraws, legal phase shortcuts, effect continuations, fatigue, attack triggers, blocking, damage, Noble interactions, and private-room choice masking.
- Card wording uses `Frontline`, including presentation of older saved descriptions.
- Keyword emphasis distinguishes `Command` from `Command Station`.
- The walkthrough has five shared decision lessons, two Brute lessons, and three Noble lessons. Answers explain consequences and give a concrete action to try in the real duel. It is a reference, not an automated practice opponent or a scripted game.
- Browser checks exercised incorrect-answer feedback, lesson navigation, faction selection, and all eight Noble lesson pages.
- Walkthrough rulings were checked against the supplied Command Siege v0.3.9 document and keyword appendix, current catalog costs, engine reference, and later creator clarifications. In particular, AT Sacrifice destroys a friendly card as a cost; it is not treated as a different game's sacrifice rule.

## Gates before charging

- Play complete Brute/Noble games with both factions going first, and both mirror matches; record the results and investigate mismatches.
- Repeat on a real phone, including changing orientation and opening/closing rules while a choice is pending.
- Exercise a two-device private match, reconnecting during a choice, passing priority, finishing a match, and agreeing to a rematch.
- Have a new player use the walkthrough without coaching. Note where they cannot identify a legal action, the acting player, a target, a cost, or what changed after resolution.
- Freeze and version the rules and both starter lists after those checks, then verify the print-and-play uses the same wording and costs.

The remaining gates require observed match results and beginner feedback; passing tests alone does not substitute for them.

## Interactive practice update

The initial question-and-answer reference has been replaced in the public UI by a separate practice workspace, entered from AT setup. Four prepared engine-backed situations cover the first Brute attack, Refine and Bastion choices, the two Rune trigger chains, and Command payment/Fortify. Completion is checked against actual game state. Practice disables the normal local-duel save effect. All four goals complete in automated engine tests.

Opening redraws now clear the face-down flag on dealt cards. The renderer also displays a player’s own hand independently of stale field-facing flags, preserving opponent-hand and face-down battlefield concealment. The regression suite passes 902 tests across 135 files.
