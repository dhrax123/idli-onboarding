-- Minimal stand-in for Supabase's auth/storage schemas so the migration can be
-- tested on a plain Postgres. Not used in production.
do $$ begin create role anon nologin; create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth; create schema storage; create schema extensions;
grant usage on schema public, storage, auth, extensions to anon, authenticated;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
grant select, insert, delete on storage.objects to anon, authenticated;
