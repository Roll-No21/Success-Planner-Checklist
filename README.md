# Success Planner

A subject-by-subject progress tracker: Biology (Botany / Zoology), Chemistry
(Physical / Organic / Inorganic), and Physics. Plain HTML/CSS/JS, no build
step — open `index.html` or host as a static site (e.g. GitHub Pages).

## Folder structure
```
index.html                 → home page (subject boxes, cherry blossoms)
css/main.css                → site-wide theme + home page styles
css/table.css                → editable table + editor mode styles
js/config.js                  → Google Client ID + GitHub repo settings
js/util.js                    → click sound, toasts, date formatting
js/storage.js                 → localStorage + optional GitHub sync
js/progress-store.js          → combined % summary used on the home page
js/auth.js                    → Google sign-in, GitHub connect, editor toggle
js/cherry-blossom.js          → falling petal effect
js/table-engine.js            → the reusable editable table (used by every subject page)
js/main.js                    → home page logic
pages/subject-table.html      → generic table page shell, loads a subject's *-data.js
Biology/  Chemistry/  Physics/  → per-subject html/css/js + chapter data
images/, sounds/, data/        → see the README in each folder
```

## One-time setup

**1. Add your images and sound file** — see `images/README.md` and
`sounds/README.md` for exact filenames. The app still works without them
(images/sound are simply skipped).

**2. Google Sign-In** (required for anyone to interact with the tables —
signed-out visitors get read-only preview):
- Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs &
  Services → Credentials → **Create OAuth client ID** → Web application.
- Add your site's URL (e.g. `https://decodingm-bit.github.io`) under
  *Authorized JavaScript origins*.
- Paste the client ID into `js/config.js` → `GOOGLE_CLIENT_ID`.

**3. GitHub sync (optional, per user)** — once signed in with Google, each
visitor can click **Connect GitHub** and paste their own personal access
token (Settings → Developer settings → Personal access tokens, `repo`
scope on this repository). The token is kept only in that browser tab's
session memory — it is never written into a file or sent anywhere but
`api.github.com`. Without connecting GitHub, progress still saves locally
in the browser via `localStorage`.

**4. Hosting** — this is a static site. GitHub Pages (Settings → Pages →
deploy from the `main` branch) works out of the box.

## How it works

- **Signed out:** preview only — subject boxes and tables render but
  clicking a cell does nothing.
- **Signed in:** click any cell to cycle empty → ✅ → ❌ → ✅ …
- **Editor mode** (pencil icon, next to sign-in, once signed in): rename
  titles/chapters/columns, add or remove rows/columns, drag column headers
  to reorder, recolor rows/columns with the swatch, Shift+click a cell to
  clear it back to empty, and use the Undo/Redo buttons.
- Progress % is calculated automatically from ticked cells and shown on
  every subject box and table page.

## Notes on the starter data

- Botany, Physical Chemistry, and Physics chapter lists came from the
  brief. Organic Chemistry, Inorganic Chemistry, and Zoology weren't fully
  specified, so standard NCERT/NEET chapter lists were used as a starting
  point — edit freely in Editor mode.
