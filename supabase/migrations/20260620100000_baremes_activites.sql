-- BAREMES ACTIVITES PEDAGOGIQUES
-- Rend configurables les coefficients utilises pour calculer le volume horaire.

CREATE TABLE IF NOT EXISTS public.baremes_activites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_activite public.type_activite NOT NULL,
  niveau_ressource public.niveau_ressource NOT NULL,
  coefficient NUMERIC(10,2) NOT NULL CHECK (coefficient >= 0),
  libelle TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type_activite, niveau_ressource)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.baremes_activites TO authenticated;
GRANT ALL ON public.baremes_activites TO service_role;

ALTER TABLE public.baremes_activites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Baremes visibles" ON public.baremes_activites;
CREATE POLICY "Baremes visibles" ON public.baremes_activites
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin gere baremes" ON public.baremes_activites;
CREATE POLICY "Admin gere baremes" ON public.baremes_activites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_baremes_activites_updated ON public.baremes_activites;
CREATE TRIGGER trg_baremes_activites_updated
  BEFORE UPDATE ON public.baremes_activites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.baremes_activites (
  type_activite, niveau_ressource, coefficient, libelle, description
) VALUES
  ('creation', 'niveau_1', 1.60, 'Creation - Niveau 1', 'Contenus simples et quiz'),
  ('creation', 'niveau_2', 3.00, 'Creation - Niveau 2', 'Ressources avec activites interactives'),
  ('creation', 'niveau_3', 6.00, 'Creation - Niveau 3', 'Serious games, simulations et ressources avancees'),
  ('mise_a_jour', 'niveau_1', 0.80, 'Mise a jour - Niveau 1', 'Mise a jour de contenus simples'),
  ('mise_a_jour', 'niveau_2', 1.50, 'Mise a jour - Niveau 2', 'Mise a jour de ressources interactives'),
  ('mise_a_jour', 'niveau_3', 3.00, 'Mise a jour - Niveau 3', 'Mise a jour de ressources avancees')
ON CONFLICT (type_activite, niveau_ressource) DO UPDATE SET
  coefficient = EXCLUDED.coefficient,
  libelle = EXCLUDED.libelle,
  description = EXCLUDED.description,
  actif = true;

CREATE OR REPLACE FUNCTION public.calc_volume_horaire()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  coef NUMERIC := 0;
BEGIN
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
