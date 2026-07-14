-- Permet aux enseignants de gerer les ressources uniquement pour les sequences de leurs cours.

DROP POLICY IF EXISTS "Enseignants gerent leurs ressources" ON public.ressources_pedagogiques;

CREATE POLICY "Enseignants gerent leurs ressources"
ON public.ressources_pedagogiques
FOR ALL
TO authenticated
USING (
  sequence_id IN (
    SELECT s.id
    FROM public.sequences_pedagogiques s
    JOIN public.cours c ON c.id = s.cours_id
    JOIN public.enseignants e ON e.id = c.enseignant_id
    WHERE e.user_id = auth.uid()
  )
)
WITH CHECK (
  sequence_id IN (
    SELECT s.id
    FROM public.sequences_pedagogiques s
    JOIN public.cours c ON c.id = s.cours_id
    JOIN public.enseignants e ON e.id = c.enseignant_id
    WHERE e.user_id = auth.uid()
  )
);
