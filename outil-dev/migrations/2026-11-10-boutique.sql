-- 2026-11-10 : la boutique. Réservations payées et bons cadeaux.
-- Fiche : docs/chantiers/2026-11-10-boutique.md
-- Les écritures de la boutique passent par les fonctions Netlify, avec la clé
-- de service : aucune règle publique n'ouvre l'écriture d'un paiement.

-- ── Réservations ────────────────────────────────────────────────────────────
alter table inscriptions add column if not exists age integer;
alter table inscriptions add column if not exists montant numeric;
alter table inscriptions add column if not exists paiement_ref text;
alter table inscriptions add column if not exists bon_code text;
alter table inscriptions add column if not exists paye_le timestamptz;
create unique index if not exists inscriptions_paiement_ref_unique on inscriptions (paiement_ref) where paiement_ref is not null;

-- Statuts : en_attente (ancien formulaire), attente_paiement (commande PayPal
-- créée), payee, confirmee (bon cadeau ou validée par JB), annulee.
alter table inscriptions drop constraint if exists inscriptions_statut_connu;
alter table inscriptions add constraint inscriptions_statut_connu
  check (statut in ('en_attente','attente_paiement','payee','confirmee','annulee'));

-- Le formulaire public ne peut pas se déclarer payé.
drop policy if exists inscriptions_public_insert on inscriptions;
create policy inscriptions_public_insert on inscriptions for insert
  with check (statut = 'en_attente');
drop policy if exists inscriptions_admin_write on inscriptions;
create policy inscriptions_admin_write on inscriptions for all
  using (est_admin()) with check (est_admin());

-- Les places prises ne comptent que les réservations payées ou confirmées,
-- et se recalculent aussi quand un statut change.
create or replace function public.update_event_inscrit_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.events
     set nb_inscrits = (select count(*) from public.inscriptions
                         where event_id = coalesce(new.event_id, old.event_id)
                           and statut in ('payee','confirmee'))
   where id = coalesce(new.event_id, old.event_id);
  if tg_op = 'UPDATE' and old.event_id is distinct from new.event_id and old.event_id is not null then
    update public.events
       set nb_inscrits = (select count(*) from public.inscriptions
                           where event_id = old.event_id and statut in ('payee','confirmee'))
     where id = old.event_id;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists on_inscription_change on inscriptions;
create trigger on_inscription_change after insert or update or delete on inscriptions
  for each row execute function update_event_inscrit_count();

-- ── Bons cadeaux ────────────────────────────────────────────────────────────
create table if not exists bons_cadeaux (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  formule_id integer references formules(id) on delete set null,
  libelle text,
  montant numeric,
  acheteur_nom text,
  acheteur_email text,
  beneficiaire text,
  message text,
  paiement_ref text unique,
  statut text not null default 'attente_paiement'
    check (statut in ('attente_paiement','paye','utilise','annule')),
  cree_le timestamptz not null default now(),
  paye_le timestamptz,
  valable_jusqu date,
  utilise_le timestamptz,
  inscription_id uuid references inscriptions(id) on delete set null
);
alter table bons_cadeaux enable row level security;
drop policy if exists bons_cadeaux_admin on bons_cadeaux;
create policy bons_cadeaux_admin on bons_cadeaux for all using (est_admin()) with check (est_admin());
