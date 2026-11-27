-- 2026-11-07 : formules karting et dates rattachées à une formule.
-- Fiche : docs/chantiers/2026-11-07-dashboard-karting.md
-- Appliquée en base le 7 novembre 2026 (migration « formules_karting »).

alter table formules drop constraint formules_nature_check;
alter table formules add constraint formules_nature_check
  check (nature = any (array['coaching','roulage','box','autre','karting','groupe']));

alter table formules add column if not exists description text;
alter table formules add column if not exists places_defaut integer;
alter table formules add column if not exists bon_cadeau boolean not null default false;

-- La future boutique lit les formules actives sans être connectée.
drop policy if exists formules_public_read on formules;
create policy formules_public_read on formules for select using (actif = true);

alter table events add column if not exists formule_id integer references formules(id) on delete set null;

insert into formules (cle, libelle, nature, unite, prix_conseille, places_defaut, bon_cadeau, actif, ordre, description) values
  ('karting-enfant-journee', 'Karting enfant, la journée', 'karting', 'journee', 195, 6, true, true, 100,
   'Dès 7 ans et 1,30 m. De 10 h à 18 h : kart 4 temps, piste, encadrement, théorie, sept sessions et repas du midi.'),
  ('karting-adulte-journee', 'Karting adulte, la journée', 'karting', 'journee', 195, 6, true, true, 110,
   'Débutant ou déjà pilote. De 10 h à 18 h : kart 4 temps, piste, encadrement, théorie, sept sessions et repas du midi.'),
  ('karting-groupe-endurance', 'Karting en groupe, endurance de 2 heures', 'groupe', 'forfait', 390, null, false, true, 120,
   'Entreprises, CE, colonies. Prix par équipe.'),
  ('karting-electrique-decouverte', 'Karting électrique, découverte de 4 à 6 ans', 'karting', 'session', null, null, false, true, 130,
   'Une découverte en kart électrique, selon la formule. Prix à fixer par JB.')
on conflict (cle) do nothing;
