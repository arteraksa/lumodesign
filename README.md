# RAKSA Design Site

Static export of the RAKSA Design website, organized to run outside Framer hosting.
The current `index.html` and site runtime modules were synced against the live
`raksadesign.com` publication so copy, animations, and visual behavior match the
published site.

## Run locally

```sh
npm run dev
```

Then open `http://localhost:4173`.

## Project layout

- `index.html` is the exported page, rewritten to use local mirrored asset paths.
- `framerusercontent.com/`, `res.cloudinary.com/`, `_DataURI/`, and `vendor/` contain the mirrored assets and runtime files used by the public site.
- `scripts/serve.mjs` serves the static site and falls back to `index.html` for Framer routes such as `/cases`.
- `scripts/check-assets.mjs` checks that local static references across the export exist.
- `scripts/audit-framer-links.mjs` checks the reachable runtime graph for external Framer module/script dependencies.

## Notes

The public editor bar and Framer analytics scripts were removed because they are
not part of the visible site. Runtime assets, fonts, CMS data, and the Phosphor
icons used by the export are served from local paths.

Some external links intentionally remain external, such as WhatsApp and email.
If the Framer project is published again, sync the updated HTML/runtime files
before deploying this static copy.

Run the full local verification with:

```sh
npm run verify
```
