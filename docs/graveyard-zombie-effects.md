# Graveyard hate and Zombie effect coverage

These imported decks remain user decks; this patch does not publish presets.
The support gate checks both Main Decks and the six-card Graveyard hate Side Deck.

New automated cards: Gren Maju Da Eiza, Bazoo the Soul-Eater, D.D. Scout Plane,
Banisher of the Light, Soul Release, Return from the Different Dimension,
D.D. Survivor, Berserk Gorilla, Pyramid Turtle, Giant Rat, Ryu Kokki,
Vampire Lord, Injection Fairy Lily, and Book of Life.

## Shared behavior

- All duel modes use the same effect module and legal actions, including the
  private-room authority. New choices are projected only to the choosing seat.
- Movement distinguishes destruction, battle, costs, discards, and non-destruction
  sends. Vampire Lord tracks opposing destruction; linked Call/Premature
  destruction belongs to the controller of the linked card.
- Simultaneous destruction snapshots graveyard replacement. A Banisher destroyed
  in the same batch does not banish that batch; attachment side effects do not
  change a batch already being moved.
- End/Standby triggers persist in room state. D.D. returns are bounded to once
  per End Phase, with legal destination/position choices. Turning a Return
  monster face-down clears its delayed banishment.
- Lily pauses automated damage calculation for an explicit pay/decline choice.
  Both Lilies decide in turn-player order and join a Damage Step chain. Ordinary
  Spell/Trap responses are not offered during this calculation window.
- Recruiters shuffle after searching. Vampire Lord's deck-send selection belongs
  to the damaged player, with private-room deck-order masking preserved.

## GOAT-era references

The following rulings collections reproduce period individual-card FAQs:

- [A–C: Banisher, Bazoo, Berserk Gorilla, Book of Life](https://www.goatformat.com/rulings1.html)
- [D–E: D.D. Scout Plane and D.D. Survivor](https://www.goatformat.com/rulings2.html)
- [F–H: Giant Rat and Gren Maju](https://www.goatformat.com/rulings3.html)
- [I–K: Injection Fairy Lily](https://www.goatformat.com/rulings4.html)
- [P–R: Pyramid Turtle, Return, Ryu Kokki](https://www.goatformat.com/rulings6.html)
- [U–Z: Vampire Lord](https://www.goatformat.com/rulings8.html)

Regression coverage includes the exact supplied lists, movement invariants,
replacement/destruction timing, temporary stats, revival restrictions, damage
calculation choices, UI controls, private-room commands and selection privacy.
