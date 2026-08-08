-- ═══════════════════════════════════════════════════════════════════════════
--  Le rôle admin n'est pas là où les policies le cherchent
--  Écrit le 8 août 2026. NON APPLIQUÉ. Attend l'accord de Yoan.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── Le constat ─────────────────────────────────────────────────────────────
-- Sept policies sur huit cherchent le rôle applicatif dans le claim de haut
-- niveau du jeton :
--
--     auth.jwt() ->> 'role'
--
-- Supabase met toujours 'authenticated' dans ce claim pour un utilisateur
-- connecté, et 'anon' sinon. Jamais 'admin'. Le rôle applicatif vit dans
-- user_metadata, et c'est bien là que assets/js/admin.js va le chercher :
--
--     const role = user.user_metadata?.role ?? 'client'
--
-- Ces sept policies sont donc fausses en toutes circonstances. Vérifié en base
-- le 8 août, jeton d'admin simulé :
--
--     claim de haut niveau .... 'authenticated'
--     claim user_metadata ..... 'admin'
--     policy actuelle ......... false
--     policy corrigée ......... true
--
-- Contrôle négatif : avec user_metadata.role = 'client', la policy corrigée
-- rend false. Elle sait donc dire non, elle ne dit pas oui à tout le monde.
--
-- Une seule policy emploie le bon chemin, content_admin_write sur site_content.
-- C'est exactement pourquoi le live-editor est la seule fonction d'admin qui
-- ait jamais marché.
--
-- ── Ce que ça empêche aujourd'hui ──────────────────────────────────────────
--   events       JB ne peut ni ouvrir une date, ni la masquer, ni la supprimer,
--                ni en créer une. Toute écriture est refusée par la base.
--   inscriptions JB ne peut pas les lire. Si un client s'inscrivait demain, il
--                ne le verrait jamais. La table compte zéro ligne à ce jour.
--   circuits     aucun ajout de circuit possible.
--   docs         aucune publication de document possible.
--   users        la liste des utilisateurs reste vide.
--   forum        la modération d'un fil dont JB n'est pas l'auteur est refusée.
--
-- Aucune correction du dashboard ne peut fonctionner tant que ceci tient : le
-- code envoie sa requête, la base la refuse.
--
-- ── Ce que ça n'ouvre pas ──────────────────────────────────────────────────
-- Rien de public ne change. Les policies de lecture publique ne sont pas
-- touchées, l'insertion publique dans inscriptions non plus. Un visiteur
-- anonyme n'a pas de user_metadata.role, donc aucune des policies ci-dessous
-- ne lui répond oui.
--
-- Le rôle vient de user_metadata, que l'utilisateur ne peut pas modifier
-- lui-même via l'API publique. Il se règle depuis la console Supabase ou avec
-- la clé de service.
--
-- ── Comment appliquer ──────────────────────────────────────────────────────
-- Console Supabase, SQL Editor, coller ce fichier. Ou par le serveur MCP.
-- Le retour arrière est en fin de fichier.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Une expression unique, écrite une seule fois plutôt que recopiée sept fois.
-- Marquée stable pour que Postgres ne la rappelle pas à chaque ligne.
create or replace function public.est_admin() returns boolean
  language sql stable
  as $$
    select coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '')
             = any (array['admin', 'moderateur'])
  $$;

-- events : tout pour un admin
drop policy if exists events_admin_all on public.events;
create policy events_admin_all on public.events
  for all using (public.est_admin()) with check (public.est_admin());

-- circuits
drop policy if exists circuits_admin_all on public.circuits;
create policy circuits_admin_all on public.circuits
  for all using (public.est_admin()) with check (public.est_admin());

-- docs
drop policy if exists docs_admin_all on public.docs;
create policy docs_admin_all on public.docs
  for all using (public.est_admin()) with check (public.est_admin());

-- inscriptions : lecture seule pour l'admin. L'insertion publique reste
-- ouverte par inscriptions_public_insert, qui n'est pas touchée.
drop policy if exists inscriptions_admin_read on public.inscriptions;
create policy inscriptions_admin_read on public.inscriptions
  for select using (public.est_admin());

-- users
drop policy if exists users_admin_read on public.users;
create policy users_admin_read on public.users
  for select using (public.est_admin());

-- forum : l'auteur garde son propre fil, l'admin modère les autres
drop policy if exists threads_auth_update on public.forum_threads;
create policy threads_auth_update on public.forum_threads
  for update using (auth.uid() = author_id or public.est_admin());

drop policy if exists replies_auth_update on public.forum_replies;
create policy replies_auth_update on public.forum_replies
  for update using (auth.uid() = author_id or public.est_admin());

commit;

-- ── Vérification à lancer juste après ──────────────────────────────────────
-- Doit rendre 0 ligne. Toute ligne rendue est une policy encore fausse.
--
--   select c.relname, p.polname
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   join pg_policy p on p.polrelid = c.oid
--   where n.nspname = 'public'
--     and coalesce(pg_get_expr(p.polqual, p.polrelid), '')
--       || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')
--         like '%jwt() ->> ''role''%';

-- ── Retour arrière ─────────────────────────────────────────────────────────
-- Rétablit les policies telles qu'elles étaient le 8 août 2026, défaut compris.
--
--   begin;
--   drop policy if exists events_admin_all on public.events;
--   create policy events_admin_all on public.events for all
--     using ((auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop policy if exists circuits_admin_all on public.circuits;
--   create policy circuits_admin_all on public.circuits for all
--     using ((auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop policy if exists docs_admin_all on public.docs;
--   create policy docs_admin_all on public.docs for all
--     using ((auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop policy if exists inscriptions_admin_read on public.inscriptions;
--   create policy inscriptions_admin_read on public.inscriptions for select
--     using ((auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop policy if exists users_admin_read on public.users;
--   create policy users_admin_read on public.users for select
--     using ((auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop policy if exists threads_auth_update on public.forum_threads;
--   create policy threads_auth_update on public.forum_threads for update
--     using (auth.uid() = author_id
--            or (auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop policy if exists replies_auth_update on public.forum_replies;
--   create policy replies_auth_update on public.forum_replies for update
--     using (auth.uid() = author_id
--            or (auth.jwt() ->> 'role') = any (array['admin','moderateur']));
--   drop function if exists public.est_admin();
--   commit;
