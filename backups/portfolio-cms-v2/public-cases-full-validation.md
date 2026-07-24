# Public cases full backup validation

Date: 2026-07-11

Method: read-only hybrid export. REST/PostgREST with the versioned publishable key and no Authorization bearer was used for the 39 public/published rows and columns granted to anon. The single draft row, which triggers the legacy admin policy, was read through Supabase MCP with a SELECT-only query. The four REST column-level blocked fields on published rows (title, published, featured_on_home, home_order) were merged from the MCP row-hash inventory after confirming the current remote aggregate md5 still equals `df5e661ec75fc031582def13cba7382a`. No remote writes were performed.

Total: 40
Columns: `id`, `slug`, `title`, `tags`, `description`, `cover`, `images`, `updated_at`, `created_at`, `excerpt`, `published`, `featured_on_home`, `home_order`, `content_blocks`, `client_id`, `external_url`
Published: 39
Drafts: 1
Featured: 9
novo-case-* records: `novo-case-1779977160261`, `novo-case-1780068948570`, `novo-case-1780074762889`, `novo-case-1780960017640`
Unique ids: 40
Unique slugs: 40
Payload markers/truncation markers: 0
SHA-256: `13e1754324ff23716023b8fe8ccab4781ab54f89e0270a86699ebdbab1d79dd1`

Remote aggregate md5 confirmed before export: `df5e661ec75fc031582def13cba7382a`
Remote aggregate sha256 confirmed before export: `1828dcaec05ac7d650fde3b1c90bfff4e2377115b48b1cb0113dc6b63757dae9`

Credentials: no credential value, DSN, token, or service role key was written to this report.
