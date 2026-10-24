# Shared duel controls

`src/duelUi` contains presentation components without game rules or card IDs:

- `PhaseSelector` renders a game's phases and legal transitions. GOAT and AT supply their own labels, current step, disabled states, and commands.
- `CardActionMenu` displays supplied actions in a bounded native modal with an accessible close control. AT uses it in local and private duels. The reader remains separate from actions.
- `ResourcePool` renders positive resources with an icon and count. Three types fit in its viewport; additional types scroll without dropping data.

AT's `AshenPhaseControls` maps its rules to the common selector. Entering SP replaces the main strip with attacker, blocker, damage, and return-to-main controls. It does not create phase-skipping rules.

`inspectAshenAction` shares preparation and payment validation with `submitAshenAction`. Inspection does not mutate the table. Submission remains authoritative, including on the private-room Worker; menu availability never replaces server validation.

Other games can provide their own action descriptors, resources, and phase mappings without importing GOAT or AT card data. The existing GOAT card menu remains independent; it has not been migrated to the shared action menu in this pass.
