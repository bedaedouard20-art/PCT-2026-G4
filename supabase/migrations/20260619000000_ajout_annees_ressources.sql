-- ANNEES ACADEMIQUES
CREATE TABLE public.annees_academiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee_debut INTEGER NOT NULL,
  annee_fin INTEGER NOT NULL,
  libelle TEXT NOT NULL,
  est_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(annee_debut, annee_fin)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annees_academiques TO authenticated;
GRANT ALL ON public.annees_academiques TO service_role;
ALTER TABLE public.annees_academiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Années académiques visibles" ON public.annees_academiques FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Secrétaire gèrent années" ON public.annees_academiques FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));
CREATE TRIGGER trg_annees_academiques_updated BEFORE UPDATE ON public.annees_academiques FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEQUENCES PEDAGOGIQUES
CREATE TABLE public.sequences_pedagogiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cours_id UUID NOT NULL REFERENCES public.cours(id) ON DELETE CASCADE,
  numero_sequence INTEGER NOT NULL CHECK (numero_sequence > 0),
  titre TEXT NOT NULL,
  description TEXT,
  nombre_heures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cours_id, numero_sequence)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequences_pedagogiques TO authenticated;
GRANT ALL ON public.sequences_pedagogiques TO service_role;
ALTER TABLE public.sequences_pedagogiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Séquences visibles" ON public.sequences_pedagogiques FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Secrétaire gèrent séquences" ON public.sequences_pedagogiques FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));
CREATE TRIGGER trg_sequences_updated BEFORE UPDATE ON public.sequences_pedagogiques FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESSOURCES PEDAGOGIQUES
CREATE TYPE public.type_ressource AS ENUM ('texte', 'video', 'document', 'quiz', 'activite_interactive', 'evaluation');

CREATE TABLE public.ressources_pedagogiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences_pedagogiques(id) ON DELETE CASCADE,
  type_ressource public.type_ressource NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  url_ou_contenu TEXT,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ressources_pedagogiques TO authenticated;
GRANT ALL ON public.ressources_pedagogiques TO service_role;
ALTER TABLE public.ressources_pedagogiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ressources visibles" ON public.ressources_pedagogiques FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Secrétaire gèrent ressources" ON public.ressources_pedagogiques FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));
CREATE TRIGGER trg_ressources_updated BEFORE UPDATE ON public.ressources_pedagogiques FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter une colonne pour lier les activites à une année académique
ALTER TABLE public.activites_pedagogiques ADD COLUMN annee_academique_id UUID REFERENCES public.annees_academiques(id) ON DELETE SET NULL;

-- Ajouter une colonne pour le statut de validation (rejete/approuve)
ALTER TABLE public.activites_pedagogiques ADD COLUMN statut_validation TEXT CHECK (statut_validation IN ('en_attente', 'approuve', 'rejete')) NOT NULL DEFAULT 'en_attente';

-- Quelques années académiques de départ
INSERT INTO public.annees_academiques (annee_debut, annee_fin, libelle, est_active) VALUES
  (2025, 2026, 'Année académique 2025-2026', true),
  (2024, 2025, 'Année académique 2024-2025', false);
