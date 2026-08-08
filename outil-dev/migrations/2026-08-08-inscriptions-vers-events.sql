-- ═══════════════════════════════════════════════════════════════════════════
--  Le formulaire d'inscription n'a jamais pu écrire une seule ligne
--  Écrit le 8 août 2026. NON APPLIQUÉ. Attend l'accord de Yoan.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── Le constat ─────────────────────────────────────────────────────────────
-- La colonne inscriptions.event_id porte une clé étrangère vers track_days,
-- pas vers events. Or track-render.js envoie l'identifiant de l'événement tel
-- qu'il vient de la table events :
--
--     event_id: window._currentEventId || null
--
-- La base refuse donc toute inscription venue du site, avec
--
--     insert or update on table "inscriptions" violates foreign key
--     constraint "inscriptions_event_id_fkey"
--
-- C'est la raison pour laquelle la table compte zéro ligne depuis toujours.
-- Ni les droits, ni le formulaire : une contrainte qui vise la mauvaise table.
--
-- Vérifié en base le 8 août, dans une transaction annulée, rôle anon :
--
--     identifiant venu de events ....... REFUSÉ
--     sans identifiant du tout ......... accepté
--     identifiant venu de track_days ... accepté
--
-- Le deuxième et le troisième essai sont les contrôles : ils montrent que
-- l'insertion elle-même fonctionne, et que seule la cible de la contrainte
-- fait échouer le premier.
--
-- ── Pourquoi viser events ──────────────────────────────────────────────────
-- track_days est morte. Une seule ligne, créée le 24 mars 2026, pour une date
-- du 15 juin 2026 déjà passée, avec une colonne votes_count héritée du système
-- de vote retiré le 8 août. Aucun fichier du dépôt ne la nomme.
--
-- events porte les onze dates réelles, le dashboard, la page publique et le
-- cahier des charges des Événements.
--
-- ── Risque ─────────────────────────────────────────────────────────────────
-- Nul sur les données : inscriptions compte zéro ligne, il n'y a rien à
-- migrer. La contrainte change de cible, c'est tout.
--
-- track_days n'est pas supprimée. Supprimer une table est irréversible et
-- demande une validation à part.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Garde-fou : si des inscriptions existaient et pointaient vers track_days,
-- la migration s'arrête plutôt que de casser un lien.
do $$
declare orphelines int;
begin
  select count(*) into orphelines
  from inscriptions i
  where i.event_id is not null
    and not exists (select 1 from events e where e.id = i.event_id);

  if orphelines > 0 then
    raise exception
      'Migration interrompue : % inscription(s) pointent vers une ligne absente de events. A traiter a la main.',
      orphelines;
  end if;
end $$;

alter table public.inscriptions
  drop constraint if exists inscriptions_event_id_fkey;

alter table public.inscriptions
  add constraint inscriptions_event_id_fkey
  foreign key (event_id) references public.events (id)
  on delete set null;

commit;

-- ── Vérification à lancer juste après ──────────────────────────────────────
-- Doit rendre « events ».
--
--   select cible.relname
--   from pg_constraint con
--   join pg_class cible on cible.oid = con.confrelid
--   where con.conname = 'inscriptions_event_id_fkey';

-- ── Retour arrière ─────────────────────────────────────────────────────────
--   begin;
--   alter table public.inscriptions drop constraint if exists inscriptions_event_id_fkey;
--   alter table public.inscriptions
--     add constraint inscriptions_event_id_fkey
--     foreign key (event_id) references public.track_days (id);
--   commit;
