# WoWLook Static Web Design

## Goal

Build a pure static single-page web version of WoWLook that runs on Cloudflare Pages, reuses the existing `cos-upload` data/assets structure, keeps the current mini program visual style, and works across phone, tablet, and desktop.

## Constraints

- The web app must not introduce a separate data schema.
- Equipment data remains the same `data-4.2.x/*.json` shape used by the mini program.
- Image paths remain compatible with `assets/public`, `assets/icons`, and `assets/zhiye`.
- The deployed Cloudflare folder can contain a copied snapshot of the same `cos-upload` content.
- The app must also support switching the asset/data base URL to the existing Tencent COS endpoint for verification.
- The first version is browser-only: no Worker, no server API, no database.

## Architecture

Create a new `web/` folder containing a no-build static app:

- `index.html` provides the root shell.
- `styles.css` ports the existing dark fantasy UI language into responsive CSS.
- `app.js` contains routing, data loading, filters, detail modal, favorites, build draft, and sharing.
- `i18n.js` contains UI translations and enum labels.
- `config.js` defines data version and asset/data base paths.
- `README.md` documents local preview, Cloudflare deployment, and data sync.

The app loads:

- `./data-4.2.x/overview.json`
- `./data-4.2.x/{classKey}.json`
- `./assets/...`

If local files are not present, `config.js` can be switched to the Tencent COS base.

## UI

The web UI follows the mini program:

- Home view: background image, logo, class emblem grid, announcement/favorites entries.
- Equipment view: sticky top bar, class hero banner, search, spec/stat/source/slot/instance chips, grouped item list.
- Detail modal: item icon, name, item level, stats, effects, tier bonus, source.
- Favorites panel: local browser storage, grouped by class, sorted by slot or time.
- Build request/draft: shareable temporary equipment list based on URL parameters.

Responsive behavior:

- Phone: one-column, touch-first layout similar to mini program.
- Tablet: wider cards and denser filter rows.
- Desktop: centered application frame with two-column equipment layout when space permits.

## Internationalization

Use a lightweight i18n layer keyed by locale. The first supported locales:

- `zh-CN`
- `zh-TW`
- `en-US`
- `en-GB`
- `de-DE`
- `fr-FR`
- `es-ES`
- `es-MX`
- `pt-BR`
- `ko-KR`
- `it-IT`
- `ru-RU`

The i18n layer translates:

- UI labels
- filter labels
- source/view labels
- empty/loading/error messages
- modal and favorites controls

It does not translate equipment names, dungeon names, boss names, or tooltip effect text because those come from the shared Chinese JSON data. If multi-locale game data is added later, the app can load a locale-specific data directory without changing UI state logic.

## Data Flow

1. Home loads `overview.json` and renders class counts.
2. Selecting a class updates URL state and loads `{classKey}.json`.
3. The app flattens `instances[].encounters[].items[]` into runtime item rows.
4. Filters are applied client-side using the same rules as the mini program.
5. Item detail data is derived in-browser from the selected item and current spec.
6. Favorites and build drafts are stored in `localStorage`.
7. Shared favorites are encoded in URL parameters as `classKey:itemId,itemId;...`.

## Deployment

Cloudflare Pages can deploy `web/` directly because it contains `index.html` at the top level. The copied `data-4.2.x` and `assets` folders stay under the file count/size limits for Pages direct upload based on the current repo snapshot.

## Validation

- Run JavaScript syntax check with `node --check web/app.js`.
- Start a local static server from `web/`.
- Verify home, class navigation, filtering, details, favorites, share import, and locale switching.
- Use browser screenshots at phone, tablet, and desktop widths before finishing.
