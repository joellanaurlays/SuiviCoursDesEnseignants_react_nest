-- Module 3 : calendrier (dates) sur les annees universitaires et les semestres.
-- Inutile si TypeORM `synchronize` est actif en developpement (les colonnes sont ajoutees seules).
ALTER TABLE public.annee_universitaire ADD COLUMN IF NOT EXISTS "dateDebut" date;
ALTER TABLE public.annee_universitaire ADD COLUMN IF NOT EXISTS "dateFin" date;
ALTER TABLE public.semestre ADD COLUMN IF NOT EXISTS "dateDebut" date;
ALTER TABLE public.semestre ADD COLUMN IF NOT EXISTS "dateFin" date;

-- Renseigne les dates des anciennes annees (1er octobre -> 30 septembre).
UPDATE public.annee_universitaire
SET "dateDebut" = make_date(substr(libelle, 1, 4)::int, 10, 1),
    "dateFin"   = make_date(substr(libelle, 6, 4)::int, 9, 30)
WHERE "dateDebut" IS NULL;