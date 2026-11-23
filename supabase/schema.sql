-- Mia 🍓 Analytics — schéma Supabase
-- À coller une seule fois dans Supabase → SQL Editor → New query → Run.
--
-- Avant de lancer :
--   1. Authentication → Users → Add user : crée TON compte (e-mail + mot de passe).
--   2. Remplace ton@email.com tout en bas par cet e-mail.
--   3. Authentication → Sign In / Providers → Email : désactive « Allow new users to sign up ».
--
-- Droits obtenus :
--   visiteurs (clé anon)  : enregistrer une vue ou un clic, lire les liens et les réglages publics
--   toi (admin connecté)  : tout lire, modifier les liens et réglages, supprimer des données

create extension if not exists pgcrypto;

-- ───── admins ─────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───── évènements (vues + clics) ─────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('view', 'click')),
  link text check (link in ('onlyfans', 'instagram', 'x', 'reddit', 'threads')),
  referrer text check (char_length(referrer) <= 40),
  ref_host text check (char_length(ref_host) <= 120),
  device text check (device in ('mobile', 'desktop')),
  country text check (char_length(country) <= 8),
  path text check (char_length(path) <= 200),
  sid text check (char_length(sid) <= 40),
  is_demo boolean not null default false,
  check ((type = 'click') = (link is not null))
);
create index if not exists events_created_at_idx on public.events (created_at);
alter table public.events enable row level security;

drop policy if exists "visiteurs : ajout" on public.events;
create policy "visiteurs : ajout" on public.events
  for insert to anon
  with check (is_demo = false and created_at between now() - interval '1 minute' and now() + interval '1 minute');

drop policy if exists "admin : lecture" on public.events;
create policy "admin : lecture" on public.events for select to authenticated using (public.is_admin());

drop policy if exists "admin : ajout" on public.events;
create policy "admin : ajout" on public.events for insert to authenticated with check (public.is_admin());

drop policy if exists "admin : suppression" on public.events;
create policy "admin : suppression" on public.events for delete to authenticated using (public.is_admin());

-- ───── liens ─────
create table if not exists public.links (
  key text primary key check (key in ('onlyfans', 'instagram', 'x', 'reddit', 'threads')),
  label text not null,
  url text not null check (url ~ '^https://' and char_length(url) <= 300),
  enabled boolean not null default true,
  position int not null default 0
);
alter table public.links enable row level security;

drop policy if exists "public : lecture" on public.links;
create policy "public : lecture" on public.links for select to anon, authenticated using (true);

drop policy if exists "admin : modification" on public.links;
create policy "admin : modification" on public.links
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.links (key, label, url, enabled, position) values
  ('onlyfans',  'OnlyFans',  'https://onlyfans.com/itsmiaabby',  true, 0),
  ('instagram', 'Instagram', 'https://instagram.com/itsmiaabby', true, 1),
  ('x',         'X',         'https://x.com/itsmiaabby',         true, 2),
  ('reddit',    'Reddit',    'https://reddit.com/u/itsmiaabby',  true, 3),
  ('threads',   'Threads',   'https://threads.net/@itsmiaabby',  true, 4)
on conflict (key) do nothing;

-- ───── réglages de la landing ─────
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;

drop policy if exists "public : lecture" on public.settings;
create policy "public : lecture" on public.settings for select to anon, authenticated using (true);

drop policy if exists "admin : modification" on public.settings;
create policy "admin : modification" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.settings (id, data) values (1, '{
  "name": "Mia 🍓",
  "handle": "@itsmiaabby",
  "badge": "10K+ Followers",
  "accent": "rose",
  "accentPink": "#ff6b9d",
  "accentRose": "#c44569",
  "blocks": "rounded",
  "gate": true
}'::jsonb)
on conflict (id) do nothing;

-- ───── droits de table (la RLS ci-dessus filtre ensuite ligne par ligne) ─────
grant insert on public.events to anon;
grant select, insert, delete on public.events to authenticated;
grant select on public.links, public.settings to anon, authenticated;
grant update on public.links, public.settings to authenticated;

-- ───── toi = admin (remplace l'e-mail) ─────
insert into public.admins (user_id)
select id from auth.users where email = 'ton@email.com'
on conflict do nothing;
