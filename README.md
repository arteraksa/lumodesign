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

The admin interface is available at `http://localhost:4173/admin/`.

## Supabase admin setup

The Supabase project is configured at `https://yzivkrotylwyglavtnho.supabase.co`.
The admin UI reads this URL from `admin/supabase-config.js`.

To enable browser access, add the project's public `anon`/publishable key to
`admin/supabase-config.js`:

```js
window.RAKSA_SUPABASE = {
  url: "https://yzivkrotylwyglavtnho.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY",
};
```

The database uses `public.cases` for portfolio persistence and
`public.admin_users` to decide who can write. After creating a Supabase Auth user,
grant admin access with:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'admin@example.com';
```

The SQL applied to Supabase is tracked in `supabase/schema.sql`.

## Project layout

- `index.html` is the exported page, rewritten to use local mirrored asset paths.
- `framerusercontent.com/`, `res.cloudinary.com/`, `_DataURI/`, and `vendor/` contain the mirrored assets and runtime files used by the public site.
- `scripts/serve.mjs` serves the static site and falls back to `index.html` for Framer routes such as `/cases`.
- `scripts/check-assets.mjs` checks that local static references across the export exist.
- `scripts/audit-framer-links.mjs` checks the reachable runtime graph for external Framer module/script dependencies.
- `scripts/generate-admin-cases.mjs` regenerates the initial admin case data from the static case pages.
- `admin/` contains the admin interface for case management. It uses Supabase Auth and persists cases in `public.cases` when configured, with local JSON/browser storage as a fallback while the public key is missing.

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
