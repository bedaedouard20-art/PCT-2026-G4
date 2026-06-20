-- Durcissement RLS selon les profils:
-- admin: acces complet
-- secretaire: gestion administrative/pedagogique hors comptes et annees academiques
-- enseignant: lecture limitee a ses donnees metier

DROP POLICY IF EXISTS "Profils visibles par tous les connectes" ON public.profiles;
DROP POLICY IF EXISTS "Profils visibles par tous les connectés" ON public.profiles;
DROP POLICY IF EXISTS "Profils visibles par tous les connectÃ©s" ON public.profiles;
DROP POLICY IF EXISTS "Profils visibles par tous les connectÃƒÂ©s" ON public.profiles;
DROP POLICY IF EXISTS "Profils visibles par admin secretaire ou proprietaire" ON public.profiles;
CREATE POLICY "Profils visibles par admin secretaire ou proprietaire"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'secretaire')
);

DROP POLICY IF EXISTS "Enseignants visibles a tous connectes" ON public.enseignants;
DROP POLICY IF EXISTS "Enseignants visibles à tous connectés" ON public.enseignants;
DROP POLICY IF EXISTS "Enseignants visibles Ã  tous connectÃ©s" ON public.enseignants;
DROP POLICY IF EXISTS "Enseignants visibles ÃƒÂ  tous connectÃƒÂ©s" ON public.enseignants;
DROP POLICY IF EXISTS "Enseignants visibles selon role" ON public.enseignants;
CREATE POLICY "Enseignants visibles selon role"
ON public.enseignants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'secretaire')
);

DROP POLICY IF EXISTS "Admin/Secretaire gerent annees" ON public.annees_academiques;
DROP POLICY IF EXISTS "Admin/Secrétaire gèrent années" ON public.annees_academiques;
DROP POLICY IF EXISTS "Admin/SecrÃ©taire gÃ¨rent annÃ©es" ON public.annees_academiques;
DROP POLICY IF EXISTS "Admin/SecrÃƒÂ©taire gÃƒÂ¨rent annÃƒÂ©es" ON public.annees_academiques;
DROP POLICY IF EXISTS "Admins gerent annees" ON public.annees_academiques;
CREATE POLICY "Admins gerent annees"
ON public.annees_academiques
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Cours visibles" ON public.cours;
DROP POLICY IF EXISTS "Cours visibles selon role" ON public.cours;
CREATE POLICY "Cours visibles selon role"
ON public.cours
FOR SELECT
TO authenticated
USING (
  enseignant_id IN (
    SELECT e.id
    FROM public.enseignants e
    WHERE e.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'secretaire')
);

DROP POLICY IF EXISTS "Sequences visibles" ON public.sequences_pedagogiques;
DROP POLICY IF EXISTS "Séquences visibles" ON public.sequences_pedagogiques;
DROP POLICY IF EXISTS "SÃ©quences visibles" ON public.sequences_pedagogiques;
DROP POLICY IF EXISTS "SÃƒÂ©quences visibles" ON public.sequences_pedagogiques;
DROP POLICY IF EXISTS "Sequences visibles selon role" ON public.sequences_pedagogiques;
CREATE POLICY "Sequences visibles selon role"
ON public.sequences_pedagogiques
FOR SELECT
TO authenticated
USING (
  cours_id IN (
    SELECT c.id
    FROM public.cours c
    JOIN public.enseignants e ON e.id = c.enseignant_id
    WHERE e.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'secretaire')
);

DROP POLICY IF EXISTS "Ressources visibles" ON public.ressources_pedagogiques;
DROP POLICY IF EXISTS "Ressources visibles selon role" ON public.ressources_pedagogiques;
CREATE POLICY "Ressources visibles selon role"
ON public.ressources_pedagogiques
FOR SELECT
TO authenticated
USING (
  sequence_id IN (
    SELECT s.id
    FROM public.sequences_pedagogiques s
    JOIN public.cours c ON c.id = s.cours_id
    JOIN public.enseignants e ON e.id = c.enseignant_id
    WHERE e.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'secretaire')
);
