-- =====================================================================
-- Idli Studios · Client Onboarding Portal
-- Schema, row-level security, public token RPCs and storage policies.
--
-- Security model
--   * Agency team members are Supabase Auth users listed in public.agency_users.
--     They get full access to every table through RLS (is_agency_member()).
--   * Clients never authenticate. They hold an unguessable public_token
--     (144 bits of randomness). The anon role has NO direct table access;
--     it can only call the SECURITY DEFINER functions below, each of which
--     resolves exactly one session from the token. A client therefore can
--     only ever read or write their own session.
--   * Client uploads go to the private "client-assets" bucket under the
--     folder <public_token>/..., enforced by a storage policy. Anon cannot
--     list, read or delete objects; only agency members can.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
do $$ begin
  create type public.onboarding_status as enum
    ('not_started', 'in_progress', 'submitted', 'in_review', 'completed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agency_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reference_kind as enum ('inspiration', 'competitor');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.generate_public_token()
returns text language sql volatile as $$
  -- 18 random bytes → 24 url-safe characters
  select translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_')
$$;

create or replace function public.slugify(p text)
returns text language sql immutable as $$
  select coalesce(
    nullif(trim(both '-' from regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]+', '-', 'g')), ''),
    'client')
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Agency users
-- ---------------------------------------------------------------------
create table if not exists public.agency_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.agency_role not null default 'member',
  created_at  timestamptz not null default now()
);

create or replace function public.is_agency_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.agency_users where id = auth.uid())
$$;

create or replace function public.is_agency_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.agency_users where id = auth.uid() and role = 'admin')
$$;

-- Every Auth user becomes an agency member. Public sign-ups MUST be disabled
-- in Supabase (Authentication → Providers → Email → "Allow new users to sign up" off)
-- so the only way in is an invite from the Supabase dashboard. The very first
-- user becomes admin.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.agency_users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.agency_users) then 'member'::public.agency_role
         else 'admin'::public.agency_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- Clients & sessions
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null check (char_length(company_name) between 1 and 160),
  contact_name  text check (char_length(contact_name) <= 160),
  email         text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         text check (char_length(phone) <= 40),
  industry      text check (char_length(industry) <= 120),
  notes         text check (char_length(notes) <= 4000),
  created_by    uuid references public.agency_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.onboarding_sessions (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients (id) on delete cascade,
  project_name      text not null check (char_length(project_name) between 1 and 160),
  slug              text not null,
  public_token      text not null unique default public.generate_public_token(),
  status            public.onboarding_status not null default 'not_started',
  current_step      smallint not null default 0 check (current_step between 0 and 10),
  progress          smallint not null default 0 check (progress between 0 and 100),
  welcome_message   text check (char_length(welcome_message) <= 1000),
  expires_at        timestamptz,
  first_opened_at   timestamptz,
  last_activity_at  timestamptz,
  submitted_at      timestamptz,
  created_by        uuid references public.agency_users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists onboarding_sessions_client_idx on public.onboarding_sessions (client_id);
create index if not exists onboarding_sessions_status_idx on public.onboarding_sessions (status);
create index if not exists onboarding_sessions_created_idx on public.onboarding_sessions (created_at desc);

-- ---------------------------------------------------------------------
-- Response tables (one row per session unless noted)
-- ---------------------------------------------------------------------
create table if not exists public.business_responses (
  session_id        uuid primary key references public.onboarding_sessions (id) on delete cascade,
  company_name      text check (char_length(company_name) <= 160),
  about             text check (char_length(about) <= 5000),
  industry          text check (char_length(industry) <= 160),
  offerings         text check (char_length(offerings) <= 5000),
  target_audience   text check (char_length(target_audience) <= 5000),
  differentiators   text check (char_length(differentiators) <= 5000),
  has_website       text check (has_website in ('yes', 'no')),
  website_url       text check (char_length(website_url) <= 500),
  social_links      text[] not null default '{}' check (cardinality(social_links) <= 20),
  updated_at        timestamptz not null default now()
);

create table if not exists public.project_requirements (
  session_id        uuid primary key references public.onboarding_sessions (id) on delete cascade,
  project_types     text[] not null default '{}',
  other_type        text check (char_length(other_type) <= 300),
  objective         text check (char_length(objective) <= 5000),
  functionality     text check (char_length(functionality) <= 5000),
  integrations      text check (char_length(integrations) <= 5000),
  timeline          text check (char_length(timeline) <= 300),
  launch_date       date,
  expected_outcome  text check (char_length(expected_outcome) <= 5000),
  budget_range      text check (char_length(budget_range) <= 120),
  updated_at        timestamptz not null default now()
);

create table if not exists public.design_preferences (
  session_id          uuid primary key references public.onboarding_sessions (id) on delete cascade,
  brand_personalities text[] not null default '{}',
  brand_notes         text check (char_length(brand_notes) <= 3000),
  competitor_notes    text check (char_length(competitor_notes) <= 5000),
  updated_at          timestamptz not null default now()
);

create table if not exists public.typography_selections (
  session_id          uuid primary key references public.onboarding_sessions (id) on delete cascade,
  heading_font        text not null default 'Inter' check (char_length(heading_font) <= 80),
  body_font           text not null default 'Inter' check (char_length(body_font) <= 80),
  accent_font         text check (char_length(accent_font) <= 80),
  saved_combinations  jsonb not null default '[]'::jsonb check (jsonb_typeof(saved_combinations) = 'array'),
  updated_at          timestamptz not null default now()
);

create table if not exists public.colour_selections (
  session_id   uuid primary key references public.onboarding_sessions (id) on delete cascade,
  primary_hex     text not null default '#111111' check (primary_hex ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_hex   text not null default '#6B7280' check (secondary_hex ~ '^#[0-9A-Fa-f]{6}$'),
  accent_hex      text not null default '#2563EB' check (accent_hex ~ '^#[0-9A-Fa-f]{6}$'),
  background_hex  text not null default '#FFFFFF' check (background_hex ~ '^#[0-9A-Fa-f]{6}$'),
  text_hex        text not null default '#0A0A0A' check (text_hex ~ '^#[0-9A-Fa-f]{6}$'),
  preset          text check (char_length(preset) <= 40),
  updated_at      timestamptz not null default now()
);

create table if not exists public.layout_preferences (
  session_id   uuid primary key references public.onboarding_sessions (id) on delete cascade,
  navigation   text check (char_length(navigation) <= 40),
  hero         text check (char_length(hero) <= 40),
  buttons      text check (char_length(buttons) <= 40),
  cards        text check (char_length(cards) <= 40),
  sections     text check (char_length(sections) <= 40),
  images       text check (char_length(images) <= 40),
  footer       text check (char_length(footer) <= 40),
  notes        text check (char_length(notes) <= 3000),
  updated_at   timestamptz not null default now()
);

create table if not exists public.technical_requirements (
  session_id         uuid primary key references public.onboarding_sessions (id) on delete cascade,
  answers            jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  domain_name        text check (char_length(domain_name) <= 255),
  hosting_provider   text check (char_length(hosting_provider) <= 255),
  integration_notes  text check (char_length(integration_notes) <= 5000),
  notes              text check (char_length(notes) <= 5000),
  updated_at         timestamptz not null default now()
);

create table if not exists public.website_references (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.onboarding_sessions (id) on delete cascade,
  kind        public.reference_kind not null,
  position    smallint not null default 0,
  name        text check (char_length(name) <= 200),
  url         text check (char_length(url) <= 500),
  likes       text check (char_length(likes) <= 3000),
  avoid       text check (char_length(avoid) <= 3000),
  comment     text check (char_length(comment) <= 3000),
  created_at  timestamptz not null default now()
);
create index if not exists website_references_session_idx on public.website_references (session_id, kind, position);

create table if not exists public.uploaded_assets (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.onboarding_sessions (id) on delete cascade,
  storage_path  text not null unique,
  file_name     text not null check (char_length(file_name) <= 255),
  mime_type     text check (char_length(mime_type) <= 120),
  size_bytes    bigint check (size_bytes >= 0),
  category      text not null default 'other'
                check (category in ('logo', 'brand_guidelines', 'document', 'image', 'other')),
  created_at    timestamptz not null default now()
);
create index if not exists uploaded_assets_session_idx on public.uploaded_assets (session_id);

create table if not exists public.internal_comments (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.onboarding_sessions (id) on delete cascade,
  author_id   uuid references public.agency_users (id) on delete set null,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);
create index if not exists internal_comments_session_idx on public.internal_comments (session_id, created_at);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['clients','onboarding_sessions','business_responses','project_requirements',
    'design_preferences','typography_selections','colour_selections','layout_preferences','technical_requirements']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Each new session gets its empty response rows so every later write is an update.
create or replace function public.init_session_rows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.business_responses (session_id, company_name)
    select new.id, c.company_name from public.clients c where c.id = new.client_id;
  insert into public.project_requirements (session_id) values (new.id);
  insert into public.design_preferences (session_id) values (new.id);
  insert into public.typography_selections (session_id) values (new.id);
  insert into public.colour_selections (session_id) values (new.id);
  insert into public.layout_preferences (session_id) values (new.id);
  insert into public.technical_requirements (session_id) values (new.id);
  return new;
end $$;

drop trigger if exists init_session_rows on public.onboarding_sessions;
create trigger init_session_rows
  after insert on public.onboarding_sessions
  for each row execute function public.init_session_rows();

-- ---------------------------------------------------------------------
-- Row-level security: agency members only. No anon policies at all.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['agency_users','clients','onboarding_sessions','business_responses',
    'project_requirements','design_preferences','typography_selections','colour_selections',
    'layout_preferences','technical_requirements','website_references','uploaded_assets','internal_comments']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;

  foreach t in array array['clients','onboarding_sessions','business_responses',
    'project_requirements','design_preferences','typography_selections','colour_selections',
    'layout_preferences','technical_requirements','website_references','uploaded_assets']
  loop
    execute format('drop policy if exists "agency full access" on public.%I', t);
    execute format('create policy "agency full access" on public.%I for all to authenticated
                    using (public.is_agency_member()) with check (public.is_agency_member())', t);
  end loop;
end $$;

drop policy if exists "agency reads team" on public.agency_users;
create policy "agency reads team" on public.agency_users for select to authenticated
  using (public.is_agency_member());
drop policy if exists "admin manages team" on public.agency_users;
create policy "admin manages team" on public.agency_users for all to authenticated
  using (public.is_agency_admin()) with check (public.is_agency_admin());

drop policy if exists "agency reads comments" on public.internal_comments;
create policy "agency reads comments" on public.internal_comments for select to authenticated
  using (public.is_agency_member());
drop policy if exists "agency writes own comments" on public.internal_comments;
create policy "agency writes own comments" on public.internal_comments for insert to authenticated
  with check (public.is_agency_member() and author_id = auth.uid());
drop policy if exists "author deletes own comments" on public.internal_comments;
create policy "author deletes own comments" on public.internal_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_agency_admin());

-- ---------------------------------------------------------------------
-- Payload builder (shared by client + agency RPCs). Not exposed directly.
-- ---------------------------------------------------------------------
create or replace function public._onboarding_payload(p_session_id uuid, p_include_internal boolean)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'session', jsonb_build_object(
        'id', s.id, 'project_name', s.project_name, 'slug', s.slug, 'status', s.status,
        'current_step', s.current_step, 'progress', s.progress, 'welcome_message', s.welcome_message,
        'submitted_at', s.submitted_at, 'last_activity_at', s.last_activity_at,
        'created_at', s.created_at, 'updated_at', s.updated_at)
      || case when p_include_internal then jsonb_build_object(
        'public_token', s.public_token, 'expires_at', s.expires_at,
        'first_opened_at', s.first_opened_at, 'client_id', s.client_id) else '{}'::jsonb end,
    'client', jsonb_build_object('company_name', c.company_name, 'contact_name', c.contact_name)
      || case when p_include_internal then jsonb_build_object(
        'id', c.id, 'email', c.email, 'phone', c.phone, 'industry', c.industry, 'notes', c.notes)
        else '{}'::jsonb end,
    'business', to_jsonb(b) - 'session_id' - 'updated_at',
    'project', to_jsonb(p) - 'session_id' - 'updated_at',
    'brand', jsonb_build_object('personalities', d.brand_personalities, 'notes', d.brand_notes),
    'typography', jsonb_build_object('heading_font', t.heading_font, 'body_font', t.body_font,
                    'accent_font', t.accent_font, 'saved_combinations', t.saved_combinations),
    'colours', jsonb_build_object('primary', co.primary_hex, 'secondary', co.secondary_hex,
                    'accent', co.accent_hex, 'background', co.background_hex, 'text', co.text_hex,
                    'preset', co.preset),
    'layout', to_jsonb(l) - 'session_id' - 'updated_at',
    'inspiration', coalesce((select jsonb_agg(jsonb_build_object('url', r.url, 'likes', r.likes,
                    'comment', r.comment) order by r.position)
                    from public.website_references r where r.session_id = s.id and r.kind = 'inspiration'), '[]'::jsonb),
    'competitors', jsonb_build_object(
        'items', coalesce((select jsonb_agg(jsonb_build_object('name', r.name, 'url', r.url,
                    'likes', r.likes, 'avoid', r.avoid) order by r.position)
                    from public.website_references r where r.session_id = s.id and r.kind = 'competitor'), '[]'::jsonb),
        'notes', d.competitor_notes),
    'technical', jsonb_build_object('answers', tr.answers, 'domain_name', tr.domain_name,
                    'hosting_provider', tr.hosting_provider, 'integration_notes', tr.integration_notes,
                    'notes', tr.notes),
    'assets', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'file_name', a.file_name,
                    'mime_type', a.mime_type, 'size_bytes', a.size_bytes, 'category', a.category,
                    'created_at', a.created_at)
                    || case when p_include_internal then jsonb_build_object('storage_path', a.storage_path)
                       else '{}'::jsonb end
                    order by a.created_at)
                    from public.uploaded_assets a where a.session_id = s.id), '[]'::jsonb)
  )
  from public.onboarding_sessions s
  join public.clients c on c.id = s.client_id
  join public.business_responses b on b.session_id = s.id
  join public.project_requirements p on p.session_id = s.id
  join public.design_preferences d on d.session_id = s.id
  join public.typography_selections t on t.session_id = s.id
  join public.colour_selections co on co.session_id = s.id
  join public.layout_preferences l on l.session_id = s.id
  join public.technical_requirements tr on tr.session_id = s.id
  where s.id = p_session_id
$$;

-- Resolve a token to a live session id, or raise.
create or replace function public._session_for_token(p_token text, p_for_write boolean)
returns public.onboarding_sessions language plpgsql stable security definer set search_path = public as $$
declare s public.onboarding_sessions;
begin
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 64 then
    raise exception 'invalid_link' using errcode = 'P0001';
  end if;
  select * into s from public.onboarding_sessions where public_token = p_token;
  if not found or s.status = 'archived' or (s.expires_at is not null and s.expires_at < now()) then
    raise exception 'invalid_link' using errcode = 'P0001';
  end if;
  if p_for_write and s.status not in ('not_started', 'in_progress') then
    raise exception 'already_submitted' using errcode = 'P0001';
  end if;
  return s;
end $$;

-- ---------------------------------------------------------------------
-- Public client RPCs (callable by anon with a token)
-- ---------------------------------------------------------------------
create or replace function public.get_onboarding(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare s public.onboarding_sessions;
begin
  s := public._session_for_token(p_token, false);
  update public.onboarding_sessions
     set first_opened_at = coalesce(first_opened_at, now())
   where id = s.id and first_opened_at is null;
  return public._onboarding_payload(s.id, false);
end $$;

create or replace function public._txt(p jsonb, k text, max_len int)
returns text language sql immutable as $$
  select nullif(left(trim(coalesce(p ->> k, '')), max_len), '')
$$;

create or replace function public._txt_array(p jsonb, max_items int, max_len int)
returns text[] language sql immutable as $$
  select coalesce(array_agg(left(trim(v), max_len)) filter (where trim(v) <> ''), '{}')
  from (select v from jsonb_array_elements_text(
          case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) as v limit max_items) x
$$;

create or replace function public._hex(p jsonb, k text, fallback text)
returns text language sql immutable as $$
  select case when (p ->> k) ~ '^#[0-9A-Fa-f]{6}$' then upper(p ->> k) else fallback end
$$;

-- Autosave. p_data has the same shape as the payload returned by get_onboarding.
-- Any top-level section that is absent is left untouched.
create or replace function public.save_onboarding(p_token text, p_data jsonb, p_current_step int, p_progress int)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  s public.onboarding_sessions;
  x jsonb;
  item jsonb;
  i int;
begin
  s := public._session_for_token(p_token, true);
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'invalid_payload' using errcode = 'P0001';
  end if;
  if octet_length(p_data::text) > 200000 then
    raise exception 'payload_too_large' using errcode = 'P0001';
  end if;

  if p_data ? 'business' then
    x := p_data -> 'business';
    update public.business_responses set
      company_name    = public._txt(x, 'company_name', 160),
      about           = public._txt(x, 'about', 5000),
      industry        = public._txt(x, 'industry', 160),
      offerings       = public._txt(x, 'offerings', 5000),
      target_audience = public._txt(x, 'target_audience', 5000),
      differentiators = public._txt(x, 'differentiators', 5000),
      has_website     = case when x ->> 'has_website' in ('yes', 'no') then x ->> 'has_website' end,
      website_url     = public._txt(x, 'website_url', 500),
      social_links    = public._txt_array(x -> 'social_links', 20, 500)
    where session_id = s.id;
  end if;

  if p_data ? 'project' then
    x := p_data -> 'project';
    update public.project_requirements set
      project_types    = public._txt_array(x -> 'project_types', 12, 60),
      other_type       = public._txt(x, 'other_type', 300),
      objective        = public._txt(x, 'objective', 5000),
      functionality    = public._txt(x, 'functionality', 5000),
      integrations     = public._txt(x, 'integrations', 5000),
      timeline         = public._txt(x, 'timeline', 300),
      launch_date      = case when (x ->> 'launch_date') ~ '^\d{4}-\d{2}-\d{2}$' then (x ->> 'launch_date')::date end,
      expected_outcome = public._txt(x, 'expected_outcome', 5000),
      budget_range     = public._txt(x, 'budget_range', 120)
    where session_id = s.id;
  end if;

  if p_data ? 'brand' or p_data ? 'competitors' then
    update public.design_preferences set
      brand_personalities = case when p_data ? 'brand'
        then public._txt_array(p_data -> 'brand' -> 'personalities', 8, 60) else brand_personalities end,
      brand_notes = case when p_data ? 'brand'
        then public._txt(p_data -> 'brand', 'notes', 3000) else brand_notes end,
      competitor_notes = case when p_data ? 'competitors'
        then public._txt(p_data -> 'competitors', 'notes', 5000) else competitor_notes end
    where session_id = s.id;
  end if;

  if p_data ? 'typography' then
    x := p_data -> 'typography';
    update public.typography_selections set
      heading_font = coalesce(public._txt(x, 'heading_font', 80), heading_font),
      body_font    = coalesce(public._txt(x, 'body_font', 80), body_font),
      accent_font  = public._txt(x, 'accent_font', 80),
      saved_combinations = case
        when jsonb_typeof(x -> 'saved_combinations') = 'array'
             and jsonb_array_length(x -> 'saved_combinations') <= 12
        then x -> 'saved_combinations' else saved_combinations end
    where session_id = s.id;
  end if;

  if p_data ? 'colours' then
    x := p_data -> 'colours';
    update public.colour_selections set
      primary_hex    = public._hex(x, 'primary', primary_hex),
      secondary_hex  = public._hex(x, 'secondary', secondary_hex),
      accent_hex     = public._hex(x, 'accent', accent_hex),
      background_hex = public._hex(x, 'background', background_hex),
      text_hex       = public._hex(x, 'text', text_hex),
      preset         = public._txt(x, 'preset', 40)
    where session_id = s.id;
  end if;

  if p_data ? 'layout' then
    x := p_data -> 'layout';
    update public.layout_preferences set
      navigation = public._txt(x, 'navigation', 40),
      hero       = public._txt(x, 'hero', 40),
      buttons    = public._txt(x, 'buttons', 40),
      cards      = public._txt(x, 'cards', 40),
      sections   = public._txt(x, 'sections', 40),
      images     = public._txt(x, 'images', 40),
      footer     = public._txt(x, 'footer', 40),
      notes      = public._txt(x, 'notes', 3000)
    where session_id = s.id;
  end if;

  if p_data ? 'technical' then
    x := p_data -> 'technical';
    update public.technical_requirements set
      answers = coalesce((
        select jsonb_object_agg(k, v)
        from jsonb_each_text(case when jsonb_typeof(x -> 'answers') = 'object' then x -> 'answers' else '{}'::jsonb end) e(k, v)
        where k ~ '^[a-z_]{1,40}$' and v in ('yes', 'no', 'unsure')
      ), '{}'::jsonb),
      domain_name       = public._txt(x, 'domain_name', 255),
      hosting_provider  = public._txt(x, 'hosting_provider', 255),
      integration_notes = public._txt(x, 'integration_notes', 5000),
      notes             = public._txt(x, 'notes', 5000)
    where session_id = s.id;
  end if;

  if p_data ? 'inspiration' and jsonb_typeof(p_data -> 'inspiration') = 'array' then
    delete from public.website_references where session_id = s.id and kind = 'inspiration';
    i := 0;
    for item in select value from jsonb_array_elements(p_data -> 'inspiration') limit 10 loop
      if public._txt(item, 'url', 500) is not null or public._txt(item, 'likes', 3000) is not null then
        insert into public.website_references (session_id, kind, position, url, likes, comment)
        values (s.id, 'inspiration', i, public._txt(item, 'url', 500),
                public._txt(item, 'likes', 3000), public._txt(item, 'comment', 3000));
        i := i + 1;
      end if;
    end loop;
  end if;

  if p_data ? 'competitors' and jsonb_typeof(p_data -> 'competitors' -> 'items') = 'array' then
    delete from public.website_references where session_id = s.id and kind = 'competitor';
    i := 0;
    for item in select value from jsonb_array_elements(p_data -> 'competitors' -> 'items') limit 10 loop
      if public._txt(item, 'name', 200) is not null or public._txt(item, 'url', 500) is not null then
        insert into public.website_references (session_id, kind, position, name, url, likes, avoid)
        values (s.id, 'competitor', i, public._txt(item, 'name', 200), public._txt(item, 'url', 500),
                public._txt(item, 'likes', 3000), public._txt(item, 'avoid', 3000));
        i := i + 1;
      end if;
    end loop;
  end if;

  update public.onboarding_sessions set
    status           = 'in_progress',
    current_step     = greatest(0, least(10, coalesce(p_current_step, current_step))),
    progress         = greatest(0, least(100, coalesce(p_progress, progress))),
    last_activity_at = now()
  where id = s.id;

  return jsonb_build_object('saved_at', now());
end $$;

create or replace function public.submit_onboarding(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  s public.onboarding_sessions;
  missing text[] := '{}';
begin
  s := public._session_for_token(p_token, true);

  if not exists (select 1 from public.business_responses where session_id = s.id
                 and company_name is not null and about is not null) then
    missing := missing || 'business'::text;
  end if;
  if not exists (select 1 from public.project_requirements where session_id = s.id
                 and cardinality(project_types) > 0) then
    missing := missing || 'project'::text;
  end if;
  if not exists (select 1 from public.design_preferences where session_id = s.id
                 and cardinality(brand_personalities) > 0) then
    missing := missing || 'brand'::text;
  end if;
  if cardinality(missing) > 0 then
    raise exception 'incomplete:%', array_to_string(missing, ',') using errcode = 'P0001';
  end if;

  update public.onboarding_sessions
     set status = 'submitted', submitted_at = now(), progress = 100, last_activity_at = now()
   where id = s.id;
  return jsonb_build_object('submitted_at', now());
end $$;

-- Called after the browser has uploaded a file to client-assets/<token>/...
create or replace function public.register_asset(
  p_token text, p_storage_path text, p_file_name text, p_mime_type text, p_size_bytes bigint, p_category text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  s public.onboarding_sessions;
  a public.uploaded_assets;
begin
  s := public._session_for_token(p_token, true);
  if p_storage_path is null or position(s.public_token || '/' in p_storage_path) <> 1
     or p_storage_path like '%..%' then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'client-assets' and name = p_storage_path) then
    raise exception 'upload_not_found' using errcode = 'P0001';
  end if;
  if (select count(*) from public.uploaded_assets where session_id = s.id) >= 50 then
    raise exception 'too_many_files' using errcode = 'P0001';
  end if;
  insert into public.uploaded_assets (session_id, storage_path, file_name, mime_type, size_bytes, category)
  values (s.id, p_storage_path, left(coalesce(nullif(trim(p_file_name), ''), 'file'), 255),
          left(p_mime_type, 120), p_size_bytes,
          case when p_category in ('logo', 'brand_guidelines', 'document', 'image', 'other')
               then p_category else 'other' end)
  returning * into a;
  update public.onboarding_sessions set last_activity_at = now() where id = s.id;
  return jsonb_build_object('id', a.id, 'file_name', a.file_name, 'mime_type', a.mime_type,
    'size_bytes', a.size_bytes, 'category', a.category, 'created_at', a.created_at);
end $$;

create or replace function public.remove_asset(p_token text, p_asset_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare s public.onboarding_sessions;
begin
  s := public._session_for_token(p_token, true);
  delete from public.uploaded_assets where id = p_asset_id and session_id = s.id;
  -- Clients have no storage read/delete permission (a token-scoped read policy would
  -- let anon list every active folder). The orphaned object stays private and is
  -- removed when the agency deletes the session folder from the dashboard.
end $$;

-- ---------------------------------------------------------------------
-- Agency RPCs
-- ---------------------------------------------------------------------
create or replace function public.create_onboarding_session(
  p_company_name text, p_project_name text, p_contact_name text default null,
  p_email text default null, p_phone text default null, p_industry text default null,
  p_notes text default null, p_welcome_message text default null, p_client_id uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_client_id uuid := p_client_id;
  v_session public.onboarding_sessions;
begin
  if not public.is_agency_member() then
    raise exception 'not_authorised' using errcode = '42501';
  end if;
  if coalesce(trim(p_project_name), '') = '' then
    raise exception 'project_name_required' using errcode = 'P0001';
  end if;

  if v_client_id is null then
    if coalesce(trim(p_company_name), '') = '' then
      raise exception 'company_name_required' using errcode = 'P0001';
    end if;
    insert into public.clients (company_name, contact_name, email, phone, industry, notes, created_by)
    values (trim(p_company_name), nullif(trim(p_contact_name), ''), nullif(trim(p_email), ''),
            nullif(trim(p_phone), ''), nullif(trim(p_industry), ''), nullif(trim(p_notes), ''), auth.uid())
    returning id into v_client_id;
  end if;

  insert into public.onboarding_sessions (client_id, project_name, slug, welcome_message, created_by)
  select v_client_id, trim(p_project_name), public.slugify(c.company_name),
         nullif(trim(p_welcome_message), ''), auth.uid()
  from public.clients c where c.id = v_client_id
  returning * into v_session;

  if v_session.id is null then
    raise exception 'client_not_found' using errcode = 'P0001';
  end if;

  return jsonb_build_object('id', v_session.id, 'slug', v_session.slug, 'public_token', v_session.public_token);
end $$;

create or replace function public.get_session_detail(p_session_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_agency_member() then
    raise exception 'not_authorised' using errcode = '42501';
  end if;
  return public._onboarding_payload(p_session_id, true);
end $$;

create or replace function public.regenerate_session_token(p_session_id uuid)
returns text language plpgsql volatile security definer set search_path = public as $$
declare v text;
begin
  if not public.is_agency_member() then
    raise exception 'not_authorised' using errcode = '42501';
  end if;
  update public.onboarding_sessions set public_token = public.generate_public_token()
   where id = p_session_id returning public_token into v;
  return v;
end $$;

create or replace function public.dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_agency_member() then
    raise exception 'not_authorised' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'total_clients', (select count(*) from public.clients),
      'total_sessions', count(*),
      'pending', count(*) filter (where status in ('not_started', 'in_progress')),
      'not_started', count(*) filter (where status = 'not_started'),
      'in_progress', count(*) filter (where status = 'in_progress'),
      'completed', count(*) filter (where status in ('submitted', 'in_review', 'completed')),
      'submitted_this_week', count(*) filter (where submitted_at > now() - interval '7 days')
    )
    from public.onboarding_sessions where status <> 'archived'
  );
end $$;

-- Lock function execution down: internal helpers are not callable from the API.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_onboarding(text) to anon, authenticated;
grant execute on function public.save_onboarding(text, jsonb, int, int) to anon, authenticated;
grant execute on function public.submit_onboarding(text) to anon, authenticated;
grant execute on function public.register_asset(text, text, text, text, bigint, text) to anon, authenticated;
grant execute on function public.remove_asset(text, uuid) to anon, authenticated;

grant execute on function public.is_agency_member() to authenticated;
grant execute on function public.is_agency_admin() to authenticated;
grant execute on function public.create_onboarding_session(text, text, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.get_session_detail(uuid) to authenticated;
grant execute on function public.regenerate_session_token(uuid) to authenticated;
grant execute on function public.dashboard_stats() to authenticated;
-- Needed by default expressions / triggers / RLS evaluated as the calling role.
grant execute on function public.generate_public_token() to authenticated;
grant execute on function public.slugify(text) to authenticated;
grant execute on function public.touch_updated_at() to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------------------------------------------------------------------
-- Storage: private bucket, token-scoped client uploads
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-assets', 'client-assets', false, 26214400, array[
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/postscript', 'application/illustrator', 'image/vnd.adobe.photoshop',
  'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'text/plain'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_upload_to(p_object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.onboarding_sessions s
    where s.public_token = split_part(p_object_name, '/', 1)
      and s.status in ('not_started', 'in_progress')
      and (s.expires_at is null or s.expires_at > now())
  )
$$;
grant execute on function public.can_upload_to(text) to anon, authenticated;

drop policy if exists "client uploads with token" on storage.objects;
create policy "client uploads with token" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'client-assets' and public.can_upload_to(name));

drop policy if exists "agency reads assets" on storage.objects;
create policy "agency reads assets" on storage.objects for select to authenticated
  using (bucket_id = 'client-assets' and public.is_agency_member());

drop policy if exists "agency deletes assets" on storage.objects;
create policy "agency deletes assets" on storage.objects for delete to authenticated
  using (bucket_id = 'client-assets' and public.is_agency_member());
