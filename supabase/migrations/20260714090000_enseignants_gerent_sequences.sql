-- Permet aux enseignants de gerer les sequences uniquement pour les cours qui leur sont assignes.

DROP POLICY IF EXISTS "Enseignants gerent leurs sequences" ON public.sequences_pedagogiques;

CREATE POLICY "Enseignants gerent leurs sequences"
ON public.sequences_pedagogiques
FOR ALL
TO authenticated
USING (
  cours_id IN (
    SELECT c.id
    FROM public.cours c
    JOIN public.enseignants e ON e.id = c.enseignant_id
    WHERE e.user_id = auth.uid()
  )
)
WITH CHECK (
  cours_id IN (
    SELECT c.id
    FROM public.cours c
    JOIN public.enseignants e ON e.id = c.enseignant_id
    WHERE e.user_id = auth.uid()
  )
);
