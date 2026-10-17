# Historical GOAT card faces

The selected target is English text valid at the August 17, 2005 GOAT cutoff, including contemporary corrections. It is not necessarily the earliest English printing.

## Sources and verification

- Use the photographed/ scanned card on an exact TCGplayer printing listing to transcribe printed wording. Record the set code and listing URL. A marketplace's Product Details text is not proof of what is printed on its image.
- Cross-check corrections against the historical Card Errata section on GoatFormat.com. A printed card can predate a correction valid in 2005.
- Distinguish original Invasion of Chaos from its 25th Anniversary reprint. Both have similarly named listings and different rules text.
- Retain the original image and modern catalog description. Only replace display text/images after the individual historical record is verified.
- Historical display text and engine implementation coverage are separate audits. Changing a card face does not implement its effect.

## Confirmed examples

| Card | Historical reference | Scan lookup |
| --- | --- | --- |
| Sangan | https://www.goatformat.com/rulings7.html (Card Errata) | Dark Beginning 2 / Metal Raiders; check correction rather than earliest print |
| Sinister Serpent | https://www.goatformat.com/rulings7.html (Card Errata) | SDD-002 |
| Night Assailant | https://www.goatformat.com/rulings5.html (Card Errata) | AST-080 |
| Dark Magician of Chaos | https://www.goatformat.com/rulings2.html (Card Errata) | https://www.tcgplayer.com/product/23152/yugioh-invasion-of-chaos-dark-magician-of-chaos (IOC-065) |
| Ring of Destruction | https://www.goatformat.com/rulings6.html (Card Errata) | PGD-000 |

The original IOC-065 TCGplayer listing's Product Details differs from the GOAT historical errata in its summoning and leaving-field clauses. This is why scan transcription alone cannot establish cutoff-correct wording.

## Rendering design

Use a reversible code-generated overlay covering only the interior of the rules box, matched to the card's paper color and texture. Preserve its frame, art, type line, and monster statistics. Fit a serif font within the available rectangle and check short/long monster, spell, and trap examples at viewer and thumbnail sizes. Supply the same verified text to readable descriptions and search.

Prefer a clean era-correct scan where available; use an overlay when the available scan contains a later erratum. Label reconstructed faces as GOAT text overlays, not original scans. Keep provenance accessible in the viewer. Cards that have not been checked must remain explicitly unverified.

## Status (2026-10-17)

Implemented the five historical Card Errata corrections above. The historical entries are stored verbatim (with whitespace normalized and the source's `card'sATK` spacing repaired) in `src/data/goatHistoricalText.json`, with source section, cutoff, review date, and original scan checksum. These use the historical corrections, including where they differ from an earlier physical printing. They are not advertised as literal reproductions of a particular printed edition.

`scripts/build-goat-text-overlays.py` builds standalone SVG faces in `public/cards/goat/`, embedding each unchanged original scan and covering only its rules-text interior. Ordinary rebuilding is offline; `--refresh-text` retrieves the explicitly listed entries for review. Use Python with Pillow and Times New Roman installed (or pass `--font`). Refreshing a source is not an automatic approval of later website changes; review the JSON diff before committing.

The catalog is adapted once for presentation, so thumbnails, the library, deck builder, duel field, pickers, animations, and readable descriptions use consistent images/text. Viewer notes link the historical source and preserved original image. Unreviewed cards retain their existing images/text and explicitly report that historical wording has not yet been verified. Engine paraphrases no longer override the historical transcriptions in the duel inspector. Card IDs and engine mechanics have not changed.

Validation: 219 tests across 43 files pass; GitHub Pages build passes. Browser checks covered the long Dark Magician of Chaos monster overlay and the Ring of Destruction trap overlay in the library/deck builder. Tests also verify all five source-image checksums, self-contained image data, and overlay bounds protecting type/stat regions.

The complete 1,709-card catalog has **not** been verified. Exact era wording for the other cards remains an individual printing/errata audit; the five implemented corrections must not be treated as a certification of the whole catalog. No live deployment was triggered; the repository's Pages workflow remains manual.
