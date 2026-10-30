import { cp, mkdir, rename, readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
await rename("dist-mobile/mobile/index.html", "dist-mobile/index.html");
for (const dir of ["ashen/layers", "ashen/costs", "ashen/artwork", "branding"]) {
  await mkdir(`dist-mobile/${dir}`, { recursive: true });
  if (dir === "branding") {
    for (const name of [
      "dueltheory-crest.png",
      "dt-forge-crest.svg",
      "dt-coin-crest.svg",
      "dt-wordmark.svg",
      "dt-forge-icon.svg",
      "dueltheory-wordmark.png",
      "icon-512.png",
      "favicon.svg",
    ])
      await cp(`public/${dir}/${name}`, `dist-mobile/${dir}/${name}`);
  } else await cp(`public/${dir}`, `dist-mobile/${dir}`, { recursive: true });
}
await mkdir("dist-mobile/icons", { recursive: true });
await cp(
  "public/icons/ashen-broken-crown.png",
  "dist-mobile/icons/ashen-broken-crown.png",
);
await cp("public/table-privacy.html", "dist-mobile/table-privacy.html");
await cp("public/account-deletion.html", "dist-mobile/account-deletion.html");
await cp("public/audio", "dist-mobile/audio", { recursive: true });
const manifest = JSON.parse(
  await readFile("dist-mobile/.vite/manifest.json", "utf8"),
);
const entry = manifest["mobile/index.html"];
assert.ok(entry);
const bytes = (await stat("dist-mobile/" + entry.file)).size;
assert.ok(bytes < 250000, `Startup JS exceeds 250 KB: ${bytes}`);
console.log(
  `Mobile startup JS: ${bytes} bytes. Original game assets only; large game screens load on demand.`,
);
