-- Deduit automatiquement le niveau de ressource depuis l'action pedagogique.
-- Le volume horaire reste calcule avec les baremes actifs.

ALTER TABLE public.activites_pedagogiques
ADD COLUMN IF NOT EXISTS action_pedagogique TEXT;

CREATE OR REPLACE FUNCTION public.niveau_ressource_depuis_action(_action TEXT)
RETURNS public.niveau_ressource
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _action
    WHEN 'support_cours' THEN 'niveau_1'::public.niveau_ressource
    WHEN 'video_pedagogique' THEN 'niveau_1'::public.niveau_ressource
    WHEN 'quiz' THEN 'niveau_1'::public.niveau_ressource
    WHEN 'evaluation' THEN 'niveau_2'::public.niveau_ressource
    WHEN 'activite_interactive' THEN 'niveau_2'::public.niveau_ressource
    WHEN 'simulation' THEN 'niveau_3'::public.niveau_ressource
    ELSE 'niveau_1'::public.niveau_ressource
  END;
$$;

CREATE OR REPLACE FUNCTION public.calc_volume_horaire()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  coef NUMERIC := 0;
BEGIN
  IF NEW.action_pedagogique IS NOT NULL THEN
    NEW.niveau_ressource := public.niveau_ressource_depuis_action(NEW.action_pedagogique);
  END IF;

  SELECT coefficient
  INTO coef
  FROM public.baremes_activites
  WHERE type_activite = NEW.type_activite
    AND niveau_ressource = NEW.niveau_ressource
    AND actif = true
  LIMIT 1;

  IF coef IS NULL THEN
    RAISE EXCEPTION 'Aucun bareme actif trouve pour type=% niveau=%', NEW.type_activite, NEW.niveau_ressource;
  END IF;

  NEW.volume_horaire_calcule := NEW.nombre_heures_ressource * coef;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Enseignants declarent leurs activites" ON public.activites_pedagogiques;
CREATE POLICY "Enseignants declarent leurs activites"
ON public.activites_pedagogiques
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.enseignants e
    WHERE e.id = enseignant_id
      AND e.user_id = auth.uid()
  )
  AND (
    cours_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.cours c
      WHERE c.id = cours_id
        AND c.enseignant_id = enseignant_id
    )
  )
  AND valide = false
  AND COALESCE(statut_validation, 'en_attente') = 'en_attente'
);

DROP POLICY IF EXISTS "Enseignants modifient leurs activites non approuvees" ON public.activites_pedagogiques;
CREATE POLICY "Enseignants modifient leurs activites non approuvees"
ON public.activites_pedagogiques
FOR UPDATE
TO authenticated
USING (
  COALESCE(statut_validation, 'en_attente') <> 'approuve'
  AND EXISTS (
    SELECT 1
    FROM public.enseignants e
    WHERE e.id = enseignant_id
      AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  COALESCE(statut_validation, 'en_attente') <> 'approuve'
  AND EXISTS (
    SELECT 1
    FROM public.enseignants e
    WHERE e.id = enseignant_id
      AND e.user_id = auth.uid()
  )
  AND (
    cours_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.cours c
      WHERE c.id = cours_id
        AND c.enseignant_id = enseignant_id
    )
  )
);

DROP POLICY IF EXISTS "Enseignants suppriment leurs activites non approuvees" ON public.activites_pedagogiques;
CREATE POLICY "Enseignants suppriment leurs activites non approuvees"
ON public.activites_pedagogiques
FOR DELETE
TO authenticated
USING (
  COALESCE(statut_validation, 'en_attente') <> 'approuve'
  AND EXISTS (
    SELECT 1
    FROM public.enseignants e
    WHERE e.id = enseignant_id
      AND e.user_id = auth.uid()
  )
);
