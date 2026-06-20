-- VALIDATION ACTIVITES PEDAGOGIQUES
-- Ajoute la tracabilite du workflow de validation.

ALTER TABLE public.activites_pedagogiques
  ADD COLUMN IF NOT EXISTS commentaire_validation TEXT,
  ADD COLUMN IF NOT EXISTS validee_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_validation TIMESTAMPTZ;

UPDATE public.activites_pedagogiques
SET statut_validation = CASE
    WHEN valide = true THEN 'approuve'
    WHEN statut_validation IS NULL THEN 'en_attente'
    ELSE statut_validation
  END,
  date_validation = CASE
    WHEN valide = true AND date_validation IS NULL THEN now()
    ELSE date_validation
  END;
