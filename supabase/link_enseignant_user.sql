BEGIN;

-- Lie un compte Supabase Auth a une fiche enseignant existante.
-- Le compte doit deja exister dans Authentication > Users.

DO $$
DECLARE
  enseignant_email text := 'beda.atseby@uvci.edu.ci';
  auth_user_id uuid;
BEGIN
  SELECT id
  INTO auth_user_id
  FROM auth.users
  WHERE email = enseignant_email
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur Auth trouve avec email: %', enseignant_email;
  END IF;

  UPDATE public.enseignants
  SET user_id = auth_user_id
  WHERE email = enseignant_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucune fiche enseignant trouvee avec email: %', enseignant_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth_user_id, 'enseignant')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

COMMIT;
