begin;

create or replace function pg_temp.assert_true(value boolean, message text)
returns void
language plpgsql
as $$
begin
  if not coalesce(value, false) then
    raise exception 'assertion failed: %', message;
  end if;
end;
$$;

create or replace function pg_temp.assert_false(value boolean, message text)
returns void
language plpgsql
as $$
begin
  if coalesce(value, false) then
    raise exception 'assertion failed: %', message;
  end if;
end;
$$;

insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'portfolio-admin@example.test', 'test', now(), now(), now(), 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'portfolio-user@example.test', 'test', now(), now(), now(), 'authenticated', 'authenticated'),
  ('33333333-3333-4333-8333-333333333333', 'portfolio-manager@example.test', 'test', now(), now(), now(), 'authenticated', 'authenticated'),
  ('44444444-4444-4444-8444-444444444444', 'portfolio-hierarchy@example.test', 'test', now(), now(), now(), 'authenticated', 'authenticated'),
  ('55555555-5555-4555-8555-555555555555', 'portfolio-bootstrap@example.test', 'test', now(), now(), now(), 'authenticated', 'authenticated');

insert into public.profiles (auth_user_id, email, full_name, display_name, status, role, access_level, hierarchy_level)
values
  ('11111111-1111-4111-8111-111111111111', 'portfolio-admin@example.test', 'Portfolio Admin', 'Portfolio Admin', 'active', 'admin', 'admin', 80),
  ('22222222-2222-4222-8222-222222222222', 'portfolio-user@example.test', 'Portfolio User', 'Portfolio User', 'active', 'viewer', 'viewer', 10),
  ('33333333-3333-4333-8333-333333333333', 'portfolio-manager@example.test', 'Portfolio Manager', 'Portfolio Manager', 'active', 'manager', 'manager', 90),
  ('44444444-4444-4444-8444-444444444444', 'portfolio-hierarchy@example.test', 'Portfolio Hierarchy', 'Portfolio Hierarchy', 'active', 'viewer', 'viewer', 100),
  ('55555555-5555-4555-8555-555555555555', 'portfolio-bootstrap@example.test', 'Portfolio Bootstrap', 'Portfolio Bootstrap', 'active', 'viewer', 'viewer', 10);

insert into public.admin_users (user_id)
values ('55555555-5555-4555-8555-555555555555');

insert into public.portfolio_cases (
  id,
  slug,
  title,
  status,
  categories,
  excerpt,
  content_json,
  cover_storage_bucket,
  cover_storage_path
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'published-case',
    'Published Case',
    'published',
    array['Branding']::text[],
    'Published',
    '{"type":"doc","content":[]}'::jsonb,
    'portfolio-media',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cover.jpg'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'draft-case',
    'Draft Case',
    'draft',
    array['Editorial']::text[],
    'Draft',
    '{"type":"doc","content":[]}'::jsonb,
    'portfolio-drafts',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/draft-cover.jpg'
  );

select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_cases
    where slug = 'draft-case'
      and cover_storage_bucket = 'portfolio-drafts'
  ),
  'draft cover in portfolio-drafts is accepted'
);

insert into public.portfolio_case_media (case_id, source_url, storage_bucket, storage_path, media_type, sort_order)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '', 'portfolio-media', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/hero.jpg', 'image', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'https://cdn.example.test/published.jpg', null, null, 'image', 1),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'https://cdn.example.test/draft.jpg', null, null, 'image', 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '', 'portfolio-drafts', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/draft.jpg', 'image', 1);

insert into storage.objects (bucket_id, name, owner, metadata)
values ('portfolio-media', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/public.jpg', null, '{}'::jsonb);

set local role anon;
select pg_temp.assert_true(
  exists (select 1 from public.portfolio_cases where slug = 'published-case'),
  'anon reads published cases'
);
select pg_temp.assert_false(
  exists (select 1 from public.portfolio_cases where slug = 'draft-case'),
  'anon does not read drafts'
);
select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_case_media
    where source_url = 'https://cdn.example.test/published.jpg'
  ),
  'HTTP/HTTPS external media of published case is public'
);
select pg_temp.assert_false(
  exists (
    select 1
    from public.portfolio_case_media
    where source_url = 'https://cdn.example.test/draft.jpg'
  ),
  'external media of draft case is not public'
);
select pg_temp.assert_false(
  exists (
    select 1
    from public.portfolio_case_media
    where storage_bucket = 'portfolio-drafts'
  ),
  'portfolio-drafts media is not public'
);
select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_case_media
    where storage_bucket = 'portfolio-media'
  ),
  'portfolio-media of published case is public'
);
select pg_temp.assert_false(
  exists (
    select 1
    from storage.objects
    where bucket_id = 'portfolio-drafts'
  ),
  'portfolio-drafts bucket has no public read'
);
select pg_temp.assert_true(
  exists (
    select 1
    from storage.objects
    where bucket_id = 'portfolio-media'
      and name = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/public.jpg'
  ),
  'portfolio-media bucket has public read'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select pg_temp.assert_false(public.can_manage_portfolio(), 'common authenticated user is not admin');

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('common-user-write', 'Common User Write', 'draft', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'common authenticated user unexpectedly inserted portfolio case';
exception
  when insufficient_privilege then null;
  when check_violation then null;
end;
$$;

do $$
begin
  insert into storage.objects (bucket_id, name, owner, metadata)
  values ('portfolio-drafts', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/common.jpg', '22222222-2222-4222-8222-222222222222', '{}'::jsonb);
  raise exception 'common authenticated user unexpectedly wrote draft bucket';
exception
  when insufficient_privilege then null;
  when check_violation then null;
end;
$$;

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
select pg_temp.assert_false(public.can_manage_portfolio(), 'manager role/access_level alone is not portfolio admin');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
select pg_temp.assert_false(public.can_manage_portfolio(), 'high hierarchy_level alone is not portfolio admin');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
select pg_temp.assert_true(public.can_manage_portfolio(), 'admin_users fallback remains authorized');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select pg_temp.assert_true(public.can_manage_portfolio(), 'explicit admin profile remains authorized');
select pg_temp.assert_true(
  exists (select 1 from public.portfolio_cases where slug = 'draft-case'),
  'admin reads drafts'
);

insert into public.portfolio_cases (id, slug, title, status, categories, content_json)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'admin-created',
  'Admin Created',
  'draft',
  array['UI/UX Design']::text[],
  '{"type":"doc","content":[]}'::jsonb
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_cases
    where slug = 'admin-created'
      and created_by = '11111111-1111-4111-8111-111111111111'
      and updated_by = '11111111-1111-4111-8111-111111111111'
  ),
  'created_by and updated_by are filled for authenticated admin inserts'
);

update public.portfolio_cases
set title = 'Admin Created Updated'
where slug = 'admin-created';

select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_cases
    where slug = 'admin-created'
      and version = 2
  ),
  'version increments once per update'
);

update public.portfolio_cases
set slug = 'admin-created-renamed'
where slug = 'admin-created';

select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_case_slug_history
    where old_slug = 'admin-created'
  ),
  'legitimate slug change records history'
);

update public.portfolio_cases
set slug = 'admin-created-final'
where slug = 'admin-created-renamed';

select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_case_slug_history
    where old_slug = 'admin-created-renamed'
  ),
  'second legitimate slug change records second history'
);

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('admin-created', 'History Collision', 'draft', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'current slug unexpectedly reused slug history';
exception
  when raise_exception then null;
end;
$$;

insert into public.portfolio_cases (id, slug, title, status, categories, content_json)
values (
  '12121212-1212-4212-8212-121212121212',
  'current-slug-collision',
  'Current Slug Collision',
  'draft',
  array['Branding']::text[],
  '{"type":"doc","content":[]}'::jsonb
);

do $$
begin
  insert into public.portfolio_case_slug_history (case_id, old_slug)
  values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'current-slug-collision');
  raise exception 'history unexpectedly collided with current slug';
exception
  when raise_exception then null;
end;
$$;

insert into public.portfolio_cases (id, slug, title, status, categories, content_json)
values (
  '13131313-1313-4313-8313-131313131313',
  'rollback-source',
  'Rollback Source',
  'draft',
  array['Branding']::text[],
  '{"type":"doc","content":[]}'::jsonb
);

insert into public.portfolio_case_slug_history (case_id, old_slug)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'reserved-target');

do $$
begin
  begin
    update public.portfolio_cases
    set slug = 'reserved-target', title = 'Should Roll Back'
    where id = '13131313-1313-4313-8313-131313131313';
  exception
    when others then null;
  end;

  perform pg_temp.assert_true(
    exists (
      select 1
      from public.portfolio_cases
      where id = '13131313-1313-4313-8313-131313131313'
        and slug = 'rollback-source'
        and title = 'Rollback Source'
    ),
    'slug history collision aborts the whole update operation'
  );
end;
$$;

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('published-case', 'Duplicate Slug', 'draft', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'duplicate slug unexpectedly succeeded';
exception
  when unique_violation then null;
end;
$$;

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('invalid-status', 'Invalid Status', 'review', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'invalid status unexpectedly succeeded';
exception
  when check_violation then null;
end;
$$;

insert into storage.objects (bucket_id, name, owner, metadata)
values (
  'portfolio-drafts',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc/admin-draft.jpg',
  '11111111-1111-4111-8111-111111111111',
  '{}'::jsonb
);

select pg_temp.assert_true(
  exists (
    select 1
    from storage.objects
    where bucket_id = 'portfolio-drafts'
      and name = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/admin-draft.jpg'
  ),
  'admin writes draft bucket'
);

insert into storage.objects (bucket_id, name, owner, metadata)
values (
  'portfolio-media',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc/admin-public.jpg',
  '11111111-1111-4111-8111-111111111111',
  '{}'::jsonb
);

select pg_temp.assert_true(
  exists (
    select 1
    from storage.objects
    where bucket_id = 'portfolio-media'
      and name = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/admin-public.jpg'
  ),
  'admin writes public bucket'
);

insert into public.portfolio_cases (slug, title, status, categories, content_json)
values ('atitus-educação', 'Unicode Slug', 'draft', array['Desenvolvimento']::text[], '{"type":"doc","content":[]}'::jsonb);

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('bad/slug', 'Bad Slash', 'draft', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'slash slug unexpectedly succeeded';
exception
  when check_violation then null;
end;
$$;

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('bad?slug', 'Bad Query', 'draft', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'query slug unexpectedly succeeded';
exception
  when check_violation then null;
end;
$$;

do $$
begin
  insert into public.portfolio_cases (slug, title, status, categories, content_json)
  values ('bad#slug', 'Bad Hash', 'draft', array['Branding']::text[], '{"type":"doc","content":[]}'::jsonb);
  raise exception 'hash slug unexpectedly succeeded';
exception
  when check_violation then null;
end;
$$;

insert into public.portfolio_cases (id, slug, title, status, categories, content_json, cover_storage_bucket, cover_storage_path)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'draft-cover-case',
  'Draft Cover Case',
  'draft',
  array['Branding']::text[],
  '{"type":"doc","content":[]}'::jsonb,
  'portfolio-drafts',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd/cover.jpg'
);

do $$
declare
  failed boolean := false;
begin
  begin
    update public.portfolio_cases
    set status = 'published'
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  exception
    when others then
      failed := true;
  end;

  perform pg_temp.assert_true(failed, 'published case with portfolio-drafts cover fails');
end;
$$;

insert into public.portfolio_cases (id, slug, title, status, categories, content_json, cover_storage_bucket, cover_storage_path)
values (
  '66666666-6666-4666-8666-666666666666',
  'publish-media-cover',
  'Publish Media Cover',
  'published',
  array['Branding']::text[],
  '{"type":"doc","content":[]}'::jsonb,
  'portfolio-media',
  '66666666-6666-4666-8666-666666666666/cover.jpg'
);

insert into public.portfolio_cases (id, slug, title, status, categories, content_json, cover_storage_bucket, cover_storage_path)
values (
  '77777777-7777-4777-8777-777777777777',
  'publish-case-images-cover',
  'Publish Case Images Cover',
  'published',
  array['Branding']::text[],
  '{"type":"doc","content":[]}'::jsonb,
  'case-images',
  'cases/legacy/cover.jpg'
);

insert into public.portfolio_cases (id, slug, title, status, categories, content_json, cover_url)
values (
  '88888888-8888-4888-8888-888888888888',
  'publish-external-cover',
  'Publish External Cover',
  'published',
  array['Branding']::text[],
  '{"type":"doc","content":[]}'::jsonb,
  'https://cdn.example.test/cover.jpg'
);

do $$
begin
  insert into public.portfolio_cases (id, slug, title, status, categories, content_json, cover_url)
  values (
    '99999999-9999-4999-8999-999999999999',
    'invalid-cover-url',
    'Invalid Cover URL',
    'published',
    array['Branding']::text[],
    '{"type":"doc","content":[]}'::jsonb,
    'ftp://cdn.example.test/cover.jpg'
  );
  raise exception 'invalid cover_url protocol unexpectedly published';
exception
  when raise_exception then null;
  when check_violation then null;
end;
$$;

insert into public.portfolio_case_media (case_id, source_url, storage_bucket, storage_path, media_type, sort_order)
values
  ('66666666-6666-4666-8666-666666666666', 'https://cdn.example.test/external-ok.jpg', null, null, 'image', 0),
  ('66666666-6666-4666-8666-666666666666', '', 'case-images', 'cases/legacy/gallery.jpg', 'image', 1);

do $$
begin
  insert into public.portfolio_case_media (case_id, source_url, storage_bucket, storage_path, media_type, sort_order)
  values ('66666666-6666-4666-8666-666666666666', 'ftp://cdn.example.test/bad.jpg', null, null, 'image', 2);
  raise exception 'invalid external media protocol unexpectedly succeeded';
exception
  when check_violation then null;
end;
$$;

reset role;
set local request.jwt.claim.sub = '';

insert into public.portfolio_cases (id, slug, title, status, categories, content_json)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'migration-insert',
  'Migration Insert',
  'draft',
  array['Editorial']::text[],
  '{"type":"doc","content":[]}'::jsonb
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.portfolio_cases
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      and created_by is null
      and updated_by is null
  ),
  'created_by and updated_by stay nullable for administrative inserts without JWT'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

delete from public.portfolio_cases
where slug = 'admin-created-final';

select pg_temp.assert_false(
  exists (select 1 from public.portfolio_cases where slug = 'admin-created-final'),
  'admin deletes cases'
);

reset role;
set local request.jwt.claim.sub = '';

select pg_temp.assert_true(to_regclass('public.cases') is not null, 'legacy public.cases remains');
select pg_temp.assert_true(
  exists (select 1 from storage.buckets where id = 'case-images'),
  'legacy case-images bucket remains'
);

rollback;
