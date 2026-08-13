-- Appliquee le 11 aout 2026. Conservee pour trace.
--
-- Une source rattachee a un circuit donne ce circuit a toutes ses lignes.
--
-- Constat : 87 candidats sur 145 n'avaient ni pays ni nom de circuit, et
-- c'etaient exactement ceux du Circuit du Var et de Ledenon. Le filtre pays
-- s'ouvrant sur « France », les deux circuits de proximite de JB etaient
-- masques par defaut.
--
-- La regle est generale : `veille_sources.circuit_id` existe deja et dit ou se
-- passe ce que la source publie. Ce que la ligne porte deja l'emporte, un
-- agregateur qui nomme lui-meme son circuit sait mieux.

create or replace function public.veille_classer_ligne()
returns trigger
language plpgsql
as $$
declare c record;
begin
  new.discipline := public.classer('discipline', new.titre, new.resume);
  new.genre      := public.classer('genre',      new.titre, new.resume);

  if new.circuit_nom is null or new.pays is null or new.region is null then
    select ci.nom, ci.pays, ci.region into c
      from public.veille_sources s
      join public.circuits ci on ci.id = s.circuit_id
     where s.id = new.source_id;
    if found then
      new.circuit_nom := coalesce(new.circuit_nom, c.nom);
      new.pays        := coalesce(new.pays,        c.pays);
      new.region      := coalesce(new.region,      c.region);
    end if;
  end if;

  return new;
end $$;

-- La repasse complete. Elle refait le classement ET l'heritage du circuit, pour
-- que rejouer la regle sur l'existant donne le meme resultat qu'a l'insertion.
create or replace function public.veille_reclasser()
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare n integer;
begin
  update veille_candidats c
     set discipline  = public.classer('discipline', c.titre, c.resume),
         genre       = public.classer('genre',      c.titre, c.resume),
         circuit_nom = coalesce(c.circuit_nom, ci.nom),
         pays        = coalesce(c.pays,        ci.pays),
         region      = coalesce(c.region,      ci.region)
    from veille_sources s
    left join circuits ci on ci.id = s.circuit_id
   where s.id = c.source_id;
  get diagnostics n = row_count;
  return n;
end $$;
