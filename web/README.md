# WoWLook Web

Pure static single-page web version for Cloudflare Pages.

## Local Preview

```powershell
cd web
python -m http.server 8787
```

Open `http://localhost:8787`.

To test against Tencent COS instead of local copied files:

```text
http://localhost:8787/?remote=1
```

## Data and Assets

This web app intentionally reuses the same structure as `cos-upload`:

```text
web/
  data-4.2.x/
    overview.json
    monk.json
    ...
  assets/
    public/
    icons/
    zhiye/
```

When the season data changes:

1. Regenerate `cos-upload/data-4.2.x` and `cos-upload/assets`.
2. Upload that same content to the mini program COS bucket.
3. Copy the same folders into `web/`.
4. Update `seo.config.json` if the data directory, version, cache bust, or locale URL map changed.
5. Regenerate static SEO pages:

```powershell
node generate-seo-pages.js
```

6. Deploy `web/` to Cloudflare Pages.

## Multilingual SEO Pages

SEO pages are generated from `seo.config.json`, `data-4.2.x/`, and `locales/*/data/`.

Default English URLs stay short:

```text
/
/warrior/
```

Localized URLs use language prefixes:

```text
/de/
/de/warrior/
/ko/
/ko/warrior/
/zh-cn/
/zh-cn/warrior/
```

The generator also writes `sitemap.xml` and `robots.txt`. Run it after any data or locale overlay update.

## English Data Overlay

The base data remains the same Chinese JSON used by the mini program. Official English item text can be generated into an optional overlay:

```powershell
$env:BLIZZARD_CLIENT_ID='your-client-id'
$env:BLIZZARD_CLIENT_SECRET='your-client-secret'
node ..\scripts\fetch-blizzard-en-localization.js --class=warlock --limit=5
```

The generated file is loaded from:

```text
web/locales/en-US/data/warlock.json
```

Do not commit API secrets. Keep them in environment variables only.

## Cloudflare Pages

Deploy `web/` as a static HTML site. No build command is required. If using Git integration, set:

```text
Build command: exit 0
Build output directory: web
```

If using Direct Upload, upload the `web/` folder.
