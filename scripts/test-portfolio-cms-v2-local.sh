#!/usr/bin/env bash
set -euo pipefail

PSQL_BIN="${PSQL_BIN:-/opt/homebrew/opt/libpq/bin/psql}"
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
SCHEMA_FILE="${SCHEMA_FILE:-supabase/schema.sql}"
MIGRATION_FILE="${MIGRATION_FILE:-supabase/migrations/20260710192407_portfolio_cms_v2.sql}"
TEST_FILE="${TEST_FILE:-supabase/tests/portfolio_cms_v2.sql}"

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*) ;;
  *)
    echo "Refusing to run: DB_URL must point to local Supabase at 127.0.0.1:54322." >&2
    exit 1
    ;;
esac

if [[ ! -x "$PSQL_BIN" ]]; then
  echo "psql not found or not executable at: $PSQL_BIN" >&2
  exit 1
fi

for file in "$SCHEMA_FILE" "$MIGRATION_FILE" "$TEST_FILE"; do
  if [[ ! -f "$file" ]]; then
    echo "Required file not found: $file" >&2
    exit 1
  fi
done

echo "Checking local database..."
"$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 -Atc "select 1" >/dev/null

if [[ "$("$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 -Atc "select to_regclass('public.cases') is not null")" != "t" ]]; then
  echo "public.cases not found; applying legacy schema.sql to this local database."
  "$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
fi

echo "Ensuring local legacy storage fixture case-images exists..."
"$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 -c "
insert into storage.buckets (id, name, public)
values ('case-images', 'case-images', true)
on conflict (id) do update
set name = excluded.name,
    public = true;
" >/dev/null

echo "Cleaning Portfolio CMS v2 objects only..."
"$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin;

select set_config('storage.allow_delete_query', 'true', true);

drop policy if exists "Portfolio drafts admin read" on storage.objects;
drop policy if exists "Portfolio drafts admin insert" on storage.objects;
drop policy if exists "Portfolio drafts admin update" on storage.objects;
drop policy if exists "Portfolio drafts admin delete" on storage.objects;
drop policy if exists "Portfolio media public read" on storage.objects;
drop policy if exists "Portfolio media admin insert" on storage.objects;
drop policy if exists "Portfolio media admin update" on storage.objects;
drop policy if exists "Portfolio media admin delete" on storage.objects;

delete from storage.objects where bucket_id in ('portfolio-drafts', 'portfolio-media');
delete from storage.buckets where id in ('portfolio-drafts', 'portfolio-media');

drop table if exists public.portfolio_case_slug_history cascade;
drop table if exists public.portfolio_case_media cascade;
drop table if exists public.portfolio_cases cascade;

drop function if exists public.portfolio_validate_slug_history() cascade;
drop function if exists public.portfolio_validate_media_publication() cascade;
drop function if exists public.portfolio_touch_media_updated_at() cascade;
drop function if exists public.portfolio_record_slug_history() cascade;
drop function if exists public.portfolio_validate_case_publication() cascade;
drop function if exists public.portfolio_validate_case_slug() cascade;
drop function if exists public.portfolio_sync_case_published_at() cascade;
drop function if exists public.portfolio_increment_case_version() cascade;
drop function if exists public.portfolio_touch_case_updated_at() cascade;
drop function if exists public.portfolio_set_case_audit_fields() cascade;
drop function if exists public.can_manage_portfolio() cascade;

commit;
SQL

echo "Applying Portfolio CMS v2 migration..."
"$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"

echo "Running Portfolio CMS v2 SQL tests..."
"$PSQL_BIN" "$DB_URL" -v ON_ERROR_STOP=1 -f "$TEST_FILE"

echo "Portfolio CMS v2 local validation passed."
