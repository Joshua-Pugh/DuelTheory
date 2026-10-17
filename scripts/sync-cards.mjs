/** DuelTheory card sync now repairs only missing GOAT manifest entries / images.
 * Existing metadata and images are retained; no full pool or bulk image sync.
 * Use --dry-run to preview; --repair-images to also fill missing images for all existing cards.
 */
import './sync-goat-missing.mjs';
