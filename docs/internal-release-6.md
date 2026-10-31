# Internal release 1.0.5 / code 6 — lesson refinements

Published October 30, 2026 at 8:21 PM Eastern. Play Console confirms Active and Available to internal testers, version 1.0.5 / code 6. Website deployment of af21a8b passed and the live preset list and 21-step lesson were verified. Signed AAB verified with jarsigner and all 75 web assets matched the tested build. Preserved copy: ../releases/table-companion-20261028/DuelTheory-internal-v6-signed.aab; 19,995,509 bytes; SHA256 6c5290a93d56089c3bbf284f54e2a58c8b5c5d2334915deab96a0f594dc946ba. Publication proof: ../internal-release-1-0-5.png.

- The reuse step says: No friends or other accounts are needed for this lesson.
- Removed MTG Commander from built-in profile choices and moved lesson data out of the preset module. Commander remains a teaching example; user-saved profiles are preserved.
- The lesson now has 21 steps, including configuring a Scout title/reminder, claiming it, transferring it to a simulated player and clearing it. These actions must complete before finishing. Instructions remain visible inside the table menu.
- Revised lesson/title copy, including a neutral title-holder notification that reads correctly with the practice player's name You.
- Full suite before the final copy/focus refinement: 949 tests passed across 148 files. Browser walkthrough verified profile choices, reuse wording, and title configuration/claim/transfer; native assembleDebug passed before final resync. Final focused suite: 16 tests passed across 4 files. Web/mobile production builds and final native assembleDebug passed. Final Android Studio backup: android-starter-backup-20261030-201635. Browser walkthrough also verified clearing the title unlocks completion; screenshot ../title-lesson-1.0.5.png.
