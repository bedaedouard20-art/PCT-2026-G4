BEGIN;

-- Remplace cet email par celui du compte admin cree dans Supabase Auth.
-- Le compte doit exister dans Authentication > Users avant d'executer ce script.

DO $$
DECLARE
  admin_email text := 'atsebyedouard@gmail.com';
  admin_user_id uuid;
BEGIN
  SELECT id
  INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur Auth trouve avec email: %', admin_email;
  END IF;

  INSERT INTO public.profiles (id, email, nom, prenom)
  VALUES (admin_user_id, admin_email, 'ADMIN', 'Principal')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom;

  DELETE FROM public.user_roles
  WHERE user_id = admin_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

COMMIT;
