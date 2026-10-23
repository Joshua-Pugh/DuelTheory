# End Phase responses

GOAT's local, AI and private duels share an End Phase response opportunity. When the turn player tries to finish the End Phase, the engine checks the opponent's current legal free responses. If any exist, turn progression stops and the responding seat sees **Respond before turn ends**, its legal card buttons and **Pass · allow turn to end**. The other private-room seat sees a waiting status. Phase shortcuts use the same validation and cannot bypass the opportunity.

Passing does not activate a card. If both players pass, the turn player can finish the turn. If a chain starts, it resolves in the End Phase; a later end-turn attempt checks the changed position again. Empty opportunities and off-turn Quick-Play Spells still in hand do not interrupt progression. Full manual mode keeps its manual phase controls.

This also supplies the actual response window Goat Control's existing End Phase Scapegoat policy needs. Activating Scapegoat on the opponent's turn leaves tokens available for next-turn Metamorphosis without imposing Scapegoat's summon restriction on that next turn. See the [official card text](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4818&ope=2).

The private match authority must be deployed with the shared engine change; updating the static frontend alone does not update online room rules. Tests cover authority gating, phase shortcuts, private seat projection, response labels, AI Scapegoat setup, fresh windows after resolution, and no-response continuation.
