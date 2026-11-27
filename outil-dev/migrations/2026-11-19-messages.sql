-- 2026-11-19 : les messages du formulaire de contact. Appliquée le 19 novembre
-- (migration « messages_contact »). Remplace le projet du 8 août
-- (2026-08-08-table-messages.sql, jamais appliqué) : l'écriture passe par la
-- fonction Netlify contact-envoyer (clé de service, anti-robot), il n'y a donc
-- plus de règle d'écriture publique.
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  prenom      text        not null,
  nom         text        not null,
  email       text        not null,
  telephone   text,
  sujet       text,
  message     text        not null,
  statut      text        not null default 'nouveau' check (statut in ('nouveau','lu','repondu','archive')),
  created_at  timestamptz not null default timezone('utc', now())
);
create index if not exists messages_recents on public.messages (created_at desc);
alter table public.messages enable row level security;
drop policy if exists messages_public_insert on public.messages;
drop policy if exists messages_admin_read on public.messages;
drop policy if exists messages_admin_write on public.messages;
drop policy if exists messages_admin on public.messages;
create policy messages_admin on public.messages for all using (public.est_admin()) with check (public.est_admin());
