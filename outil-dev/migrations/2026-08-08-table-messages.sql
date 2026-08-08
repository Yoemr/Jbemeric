-- ═══════════════════════════════════════════════════════════════════════════
--  Une table pour les messages du formulaire de contact
--  Écrit le 8 août 2026. NON APPLIQUÉ. Attend l'accord de Yoan.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── À quoi ça sert ─────────────────────────────────────────────────────────
-- Le formulaire de contact ne perd plus les messages : il ouvre la messagerie
-- du visiteur avec le texte déjà écrit, et propose le téléphone en repli. Ça
-- marche aujourd'hui, sans rien installer.
--
-- Ça ne marche pas pour tout le monde. Un visiteur qui lit son courrier dans
-- un navigateur, sans logiciel de messagerie configuré, clique sur le bouton
-- et il ne se passe rien. C'est fréquent sur ordinateur de bureau.
--
-- Cette table ferme ce trou : le message part directement dans Supabase, JB le
-- retrouve dans son dashboard, et la messagerie devient un simple confort.
--
-- ── Ce qu'il faudra faire en plus ──────────────────────────────────────────
-- Appliquer cette migration ne suffit pas. Il faudra ensuite :
--   1. brancher assets/js/contact-form.js sur un POST vers cette table, sur le
--      modèle de l'inscription dans track-render.js, avec le même principe :
--      on n'annonce l'envoi que s'il a eu lieu ;
--   2. ajouter une section Messages au dashboard de JB.
--
-- Sans le point 2, un message arrive quelque part que personne ne regarde.
-- C'est pourquoi cette migration attend, plutôt que d'être appliquée seule.
--
-- ── Sécurité ───────────────────────────────────────────────────────────────
-- Mêmes règles que inscriptions : n'importe qui écrit, seul un admin relit.
-- Un visiteur ne doit jamais pouvoir lire les messages des autres.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  prenom      text        not null,
  nom         text        not null,
  email       text        not null,
  telephone   text,
  sujet       text,
  message     text        not null,
  statut      text        not null default 'nouveau',
  created_at  timestamptz not null default timezone('utc', now())
);

-- Le tri du dashboard se fait toujours du plus récent au plus ancien.
create index if not exists messages_recents on public.messages (created_at desc);

alter table public.messages enable row level security;

-- N'importe quel visiteur écrit, comme pour une inscription.
drop policy if exists messages_public_insert on public.messages;
create policy messages_public_insert on public.messages
  for insert with check (true);

-- Seul JB relit. est_admin() vient de la migration des policies du 8 août.
drop policy if exists messages_admin_read on public.messages;
create policy messages_admin_read on public.messages
  for select using (public.est_admin());

drop policy if exists messages_admin_write on public.messages;
create policy messages_admin_write on public.messages
  for update using (public.est_admin()) with check (public.est_admin());

commit;

-- ── Vérification à lancer juste après ──────────────────────────────────────
-- Un anonyme doit pouvoir écrire, et ne rien relire. Transaction annulée.
--
--   do $$
--   declare vues int; r text := '';
--   begin
--     set local role anon;
--     perform set_config('request.jwt.claims', '{"role":"anon"}', true);
--     insert into messages (prenom, nom, email, message)
--       values ('Essai','Annule','essai@exemple.invalid','essai');
--     select count(*) into vues from messages;
--     r := 'ecriture acceptee, relecture par un anonyme : ' || vues;
--     reset role;
--     set local role authenticated;
--     perform set_config('request.jwt.claims',
--       '{"role":"authenticated","user_metadata":{"role":"admin"}}', true);
--     select count(*) into vues from messages;
--     r := r || ', relecture par JB : ' || vues;
--     reset role;
--     raise exception 'ESSAI TERMINE, RIEN N EST CONSERVE >>> %', r;
--   end $$;

-- ── Retour arrière ─────────────────────────────────────────────────────────
--   drop table if exists public.messages;
