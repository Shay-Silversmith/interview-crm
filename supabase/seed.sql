-- =============================================================================
-- InterviewFlow — seed.sql
-- Minimal local-dev seed: creates one demo user + Maya Cohen profile.
-- For richer demo data, use the admin-only Load Demo loader in the app.
--
-- Prereqs: supabase db reset (runs 0001_initial_schema then 0002 / 0003).
-- Safe to re-run; uses ON CONFLICT DO NOTHING.
-- =============================================================================

-- Test user
do $$
begin
  if not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000001') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'maya.cohen@example.com',
      crypt('password', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Maya"}'::jsonb,
      false,
      ''
    );
  end if;
end $$;

-- profiles row (the on_auth_user_created trigger from 0003 also creates this;
-- the upsert below covers the case where this seed runs without the trigger).
insert into profiles (id, email, display_name, name, university, bio, skills)
values (
  '00000000-0000-0000-0000-000000000001',
  'maya.cohen@example.com',
  'Maya',
  'Maya Cohen',
  'Bar-Ilan University',
  'Third-year Industrial Engineering & Management student looking for product and data internships.',
  array['Python','SQL','Data Analysis','Tableau','React','TypeScript']
)
on conflict (id) do update set
  display_name = excluded.display_name,
  name         = excluded.name,
  university   = excluded.university,
  bio          = excluded.bio,
  skills       = excluded.skills;
