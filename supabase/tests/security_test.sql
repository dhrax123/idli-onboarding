\set ON_ERROR_STOP 1
-- Two agency users (first becomes admin)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'dhiraj@idlistudios.com'),
  ('00000000-0000-0000-0000-000000000002', 'yuveer@idlistudios.com');
select email, role from agency_users order by email;

-- Agency creates two sessions
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select create_onboarding_session('Acme Coffee Co.', 'Website redesign', 'Asha', 'asha@acme.in') as a \gset
select create_onboarding_session('Blue Pine', 'Landing page') as b \gset
select :'a'::jsonb ->> 'public_token' as ta, :'b'::jsonb ->> 'public_token' as tb \gset
select :'a'::jsonb ->> 'slug' as slug_a, length(:'ta') as token_len;
select dashboard_stats();
reset role;

-- Anon: no direct table access
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  perform * from public.onboarding_sessions;
  raise exception 'FAIL: anon read sessions';
exception when insufficient_privilege then raise notice 'ok: anon cannot select sessions'; end $$;
do $$ begin
  perform public.get_session_detail(gen_random_uuid());
  raise exception 'FAIL: anon called agency rpc';
exception when insufficient_privilege then raise notice 'ok: anon cannot call agency rpc'; end $$;
do $$ begin
  perform public._onboarding_payload(gen_random_uuid(), true);
  raise exception 'FAIL: anon called internal helper';
exception when insufficient_privilege then raise notice 'ok: anon cannot call internal helper'; end $$;

-- Anon with token A
select get_onboarding(:'ta') -> 'client' as client_a, get_onboarding(:'ta') -> 'session' ? 'public_token' as leaks_token;
select save_onboarding(:'ta', '{
  "business": {"company_name":"Acme Coffee","about":"Specialty roaster","social_links":["https://instagram.com/acme",""]},
  "project": {"project_types":["corporate","ecommerce"],"launch_date":"2027-02-01"},
  "brand": {"personalities":["minimal","premium"]},
  "typography": {"heading_font":"Playfair Display","body_font":"Inter","accent_font":null},
  "colours": {"primary":"#7c3aed","secondary":"not-a-hex","accent":"#F59E0B","background":"#FFFFFF","text":"#111111","preset":null},
  "layout": {"navigation":"centered","hero":"split"},
  "inspiration": [{"url":"https://linear.app","likes":"Calm"},{"url":"","likes":""}],
  "competitors": {"items":[{"name":"Blue Tokai","url":"https://bluetokaicoffee.com"}],"notes":"avoid clutter"},
  "technical": {"answers":{"own_domain":"yes","seo":"maybe","bad key!":"yes"},"domain_name":"acme.in"}
}'::jsonb, 5, 40) is not null as saved;
select p -> 'colours' as colours, p -> 'business' -> 'social_links' as socials,
       jsonb_array_length(p -> 'inspiration') as n_insp, p -> 'technical' -> 'answers' as answers
from (select get_onboarding(:'ta') p) x;

-- Token B sees only its own data
select get_onboarding(:'tb') -> 'business' ->> 'about' as b_about_is_null;

-- Bad tokens
do $$ begin perform public.get_onboarding('short'); raise exception 'FAIL';
exception when raise_exception then raise notice 'ok: short token rejected (%)', sqlerrm; end $$;
do $$ begin perform public.get_onboarding('aaaaaaaaaaaaaaaaaaaaaaaa'); raise exception 'FAIL';
exception when raise_exception then raise notice 'ok: unknown token rejected (%)', sqlerrm; end $$;

-- Uploads: anon may insert only under a valid token folder
insert into storage.objects (bucket_id, name) values ('client-assets', :'ta' || '/logo.png');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('client-assets', 'someone-else/evil.png');
  raise exception 'FAIL: upload outside token folder';
exception when insufficient_privilege then raise notice 'ok: upload outside token folder blocked'; end $$;
select count(*) as anon_visible_objects from storage.objects;
select register_asset(:'ta', :'ta' || '/logo.png', 'logo.png', 'image/png', 1234, 'logo') ->> 'category' as cat;
reset role;
select set_config('test.ta', :'ta', false), set_config('test.tb', :'tb', false);
set role anon;
do $$ begin
  perform public.register_asset(current_setting('test.tb'), current_setting('test.ta') || '/logo.png', 'x', 'image/png', 1, 'logo');
  raise exception 'FAIL: cross-session asset registration';
exception when raise_exception then raise notice 'ok: cross-session asset rejected (%)', sqlerrm; end $$;

-- Submit: B is incomplete, A completes
do $$ begin perform public.submit_onboarding(current_setting('test.tb')); raise exception 'FAIL';
exception when raise_exception then raise notice 'ok: incomplete submit rejected (%)', sqlerrm; end $$;
select submit_onboarding(:'ta') is not null as submitted;
do $$ begin perform public.save_onboarding(current_setting('test.ta'), '{}'::jsonb, 1, 1); raise exception 'FAIL';
exception when raise_exception then raise notice 'ok: edit after submit rejected (%)', sqlerrm; end $$;
reset role;

-- Agency reads detail, comments, status
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
select status, progress from onboarding_sessions order by created_at;
insert into internal_comments (session_id, author_id, body)
  select id, '00000000-0000-0000-0000-000000000002', 'Love the purple' from onboarding_sessions where public_token = :'ta';
do $$ begin
  insert into internal_comments (session_id, author_id, body)
    select id, '00000000-0000-0000-0000-000000000001', 'spoof' from onboarding_sessions limit 1;
  raise exception 'FAIL: comment spoofing';
exception when insufficient_privilege then raise notice 'ok: cannot comment as someone else'; end $$;
select (get_session_detail(id) -> 'assets' -> 0 ->> 'storage_path') is not null as agency_sees_path
  from onboarding_sessions where public_token = :'ta';
select count(*) as agency_objects from storage.objects;
update onboarding_sessions set status = 'in_review' where public_token = :'ta';
select regenerate_session_token(id) <> :'tb' as rotated from onboarding_sessions where public_token = :'tb';
reset role;

-- Unknown authenticated user (not agency) sees nothing
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ff', false);
select count(*) as outsider_sessions from onboarding_sessions;
do $$ begin perform public.dashboard_stats(); raise exception 'FAIL';
exception when insufficient_privilege then raise notice 'ok: outsider blocked from stats'; end $$;
reset role;
select 'ALL TESTS PASSED' as result;
