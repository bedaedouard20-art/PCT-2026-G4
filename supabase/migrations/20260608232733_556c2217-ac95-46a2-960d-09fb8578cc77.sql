
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'secretaire', 'enseignant');
CREATE TYPE public.grade_enseignant AS ENUM ('assistant', 'maitre_assistant', 'professeur');
CREATE TYPE public.statut_enseignant AS ENUM ('permanent', 'vacataire');
CREATE TYPE public.niveau_cours AS ENUM ('L1','L2','L3','M1','M2');
CREATE TYPE public.niveau_ressource AS ENUM ('niveau_1','niveau_2','niveau_3');
CREATE TYPE public.type_activite AS ENUM ('creation','mise_a_jour');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  prenom TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  telephone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profils visibles par tous les connectés" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modifier son propre profil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Voir ses propres rôles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins gèrent les rôles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom',''),
    COALESCE(NEW.raw_user_meta_data->>'prenom','')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'enseignant');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DEPARTEMENTS
CREATE TABLE public.departements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departements TO authenticated;
GRANT ALL ON public.departements TO service_role;
ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Départements visibles" ON public.departements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Secrétaire gèrent départements" ON public.departements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));

-- ENSEIGNANTS
CREATE TABLE public.enseignants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  grade public.grade_enseignant NOT NULL DEFAULT 'assistant',
  statut public.statut_enseignant NOT NULL DEFAULT 'permanent',
  departement_id UUID REFERENCES public.departements(id) ON DELETE SET NULL,
  taux_horaire NUMERIC(10,2) NOT NULL DEFAULT 0,
  charge_statutaire NUMERIC(10,2) NOT NULL DEFAULT 192,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enseignants TO authenticated;
GRANT ALL ON public.enseignants TO service_role;
ALTER TABLE public.enseignants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enseignants visibles à tous connectés" ON public.enseignants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Secrétaire gèrent enseignants" ON public.enseignants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));
CREATE TRIGGER trg_enseignants_updated BEFORE UPDATE ON public.enseignants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COURS
CREATE TABLE public.cours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intitule TEXT NOT NULL,
  filiere TEXT NOT NULL,
  niveau public.niveau_cours NOT NULL,
  semestre INTEGER NOT NULL CHECK (semestre BETWEEN 1 AND 10),
  nombre_heures INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 0,
  enseignant_id UUID REFERENCES public.enseignants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cours TO authenticated;
GRANT ALL ON public.cours TO service_role;
ALTER TABLE public.cours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cours visibles" ON public.cours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Secrétaire gèrent cours" ON public.cours FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));
CREATE TRIGGER trg_cours_updated BEFORE UPDATE ON public.cours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACTIVITES PEDAGOGIQUES (avec calcul auto du volume horaire)
CREATE TABLE public.activites_pedagogiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enseignant_id UUID NOT NULL REFERENCES public.enseignants(id) ON DELETE CASCADE,
  cours_id UUID REFERENCES public.cours(id) ON DELETE SET NULL,
  type_activite public.type_activite NOT NULL,
  niveau_ressource public.niveau_ressource NOT NULL,
  nombre_heures_ressource INTEGER NOT NULL CHECK (nombre_heures_ressource > 0),
  volume_horaire_calcule NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  date_activite DATE NOT NULL DEFAULT CURRENT_DATE,
  valide BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activites_pedagogiques TO authenticated;
GRANT ALL ON public.activites_pedagogiques TO service_role;
ALTER TABLE public.activites_pedagogiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enseignant voit ses propres activités" ON public.activites_pedagogiques FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'secretaire')
    OR EXISTS (SELECT 1 FROM public.enseignants e WHERE e.id = enseignant_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Admin/Secrétaire gèrent activités" ON public.activites_pedagogiques FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'secretaire'));

-- Trigger de calcul du volume horaire selon le barème UVCI
CREATE OR REPLACE FUNCTION public.calc_volume_horaire()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE coef NUMERIC := 0;
BEGIN
  IF NEW.type_activite = 'creation' THEN
    coef := CASE NEW.niveau_ressource
      WHEN 'niveau_1' THEN 1.6
      WHEN 'niveau_2' THEN 3.0
      WHEN 'niveau_3' THEN 6.0
    END;
  ELSE
    coef := CASE NEW.niveau_ressource
      WHEN 'niveau_1' THEN 0.8
      WHEN 'niveau_2' THEN 1.5
      WHEN 'niveau_3' THEN 3.0
    END;
  END IF;
  NEW.volume_horaire_calcule := NEW.nombre_heures_ressource * coef;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_calc_volume BEFORE INSERT OR UPDATE ON public.activites_pedagogiques
FOR EACH ROW EXECUTE FUNCTION public.calc_volume_horaire();
CREATE TRIGGER trg_activites_updated BEFORE UPDATE ON public.activites_pedagogiques FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quelques départements de départ
INSERT INTO public.departements (nom, code) VALUES
  ('Informatique', 'INFO'),
  ('Mathématiques', 'MATH'),
  ('Sciences de Gestion', 'SG'),
  ('Lettres et Sciences Humaines', 'LSH'),
  ('Sciences Économiques', 'SE');
