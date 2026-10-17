# Run DuelTheory on GitHub Pages

The repository contains the current application source and public card/frame assets. Installed dependencies and generated builds are excluded.

1. Open repository **Settings → Pages** and choose **GitHub Actions** as the source.
2. Open **Actions → Deploy DuelTheory to GitHub Pages → Run workflow** on `main`.
3. Wait for the build and deploy jobs. The deployment link will be `https://joshua-pugh.github.io/DuelTheory/` once deployment succeeds.

Deployment is manual; pushing the source alone does not publish the site. The workflow installs dependencies, runs the tests, builds with the `/DuelTheory/` base, prepares dynamic card/image paths and deploys the static output. No development server needs to run on your PC. The game still runs in the visitor's browser; AI and online multiplayer are not added by hosting it.

Local development: `npm ci`, then `npm run dev`. Production check: `npm run build`. Pages build: `npm run build:pages`.

Decks, Creator Studio projects and uploaded artwork saved in browser storage are local to their site address. Existing localhost saves will not automatically appear on the hosted address; export/import them using the app where supported. Source catalog cards and the latest code changes are included in the repository.
