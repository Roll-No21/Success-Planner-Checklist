# Data folder

This folder is where synced progress gets written when a signed-in user
connects GitHub (see the "Connect GitHub" button next to Editor mode).

Each table writes its own file, e.g.:
- `data/botany:botany.json`
- `data/zoology:zoology.json`
- `data/physical:physical.json`
- `data/home-progress.json` (combined % summary shown on the home page)

Nothing needs to be added here manually — it's created automatically the
first time a signed-in, GitHub-connected user edits a table.
