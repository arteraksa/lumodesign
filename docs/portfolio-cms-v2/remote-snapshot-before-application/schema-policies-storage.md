# Remote Snapshot Before Portfolio CMS v2 Application

Captured at: 2026-07-11T00:14:27Z  
Project ref: `yzivkrotylwyglavtnho`  
Project: `raksadesign`

## Existing Buckets

| bucket | public |
| --- | --- |
| `case-images` | true |

`portfolio-drafts` and `portfolio-media` did not exist before applying the v2 migration.

## Relevant Counts

| object | count |
| --- | ---: |
| `public.cases` | 40 |
| `public.admin_users` | 2 |
| `public.profiles` | 2 |
| `public.budgets` | 1 |
| `public.clients` | 1 |
| `public.products` | 1 |
| `public.projects` | 0 |
| `public.service_orders` | 0 |

## `public.cases` Policies

| policy | command | roles | expression |
| --- | --- | --- | --- |
| `Cases are readable by everyone` | SELECT | public | `((published = true) OR is_admin())` |
| `Admins can insert cases` | INSERT | authenticated | `with check (is_admin())` |
| `Admins can update cases` | UPDATE | authenticated | `using (is_admin()) with check (is_admin())` |
| `Admins can delete cases` | DELETE | authenticated | `using (is_admin())` |

## `public.is_admin()`

The function existed before applying v2. It is `LANGUAGE sql`, `STABLE`, `search_path TO 'public'`, and authorizes through:

- `public.is_super_admin()`;
- `public.admin_users.user_id = auth.uid()`;
- active `public.profiles` with `role = 'admin'`, `access_level = 'admin'`, or `hierarchy_level >= 90`.

The v2 migration does not alter this function.

## `public.profiles` Relevant Structure

Relevant columns confirmed before application:

| column | type | nullable | default |
| --- | --- | --- | --- |
| `id` | uuid | no | `gen_random_uuid()` |
| `auth_user_id` | uuid | yes | null |
| `role` | text | no | `'viewer'::text` |
| `access_level` | text | no | `'viewer'::text` |
| `hierarchy_level` | integer | no | `10` |
| `status` | text | no | `'active'::text` |
| `created_at` | timestamptz | no | `now()` |
| `created_by` | uuid | yes | null |
| `updated_at` | timestamptz | no | `now()` |
| `updated_by` | uuid | yes | null |
| `preferences` | jsonb | no | project default object |

PII columns such as email, phone, CPF and address exist but were not exported into this snapshot.

## `public.admin_users` Structure

| column | type | nullable | default |
| --- | --- | --- | --- |
| `user_id` | uuid | no | null |
| `created_at` | timestamptz | no | `now()` |

## `storage.objects` Policies Related To `case-images`

Before application, `case-images` had write policies using `public.admin_users` directly:

- `Admins can upload case images`: INSERT for authenticated users, bucket `case-images`, image extension check, and `admin_users` membership.
- `Admins can update case images`: UPDATE for authenticated users, bucket `case-images`, image extension check, and `admin_users` membership.
- `Admins can delete case images`: DELETE for authenticated users, bucket `case-images`, and `admin_users` membership.

The v2 migration does not alter `case-images` or these policies.

## Snapshot Limitations

The requested full raw export of `public.cases` was not saved as a complete JSON artifact because the public anon client failed against the legacy policy path with `permission denied for table profiles`, and the full MCP SQL JSON payload exceeded the reliable response size for a single artifact. The companion `public-cases-hash-inventory.json` stores the count, the four `novo-case-*` count, the aggregate md5 of all rows ordered by slug, and a per-row hash inventory for all 40 cases. Post-application validation compares those values to prove the legacy rows stayed intact.
