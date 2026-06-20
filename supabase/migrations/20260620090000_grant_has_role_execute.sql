-- Les policies RLS appellent public.has_role(...). Les utilisateurs connectes
-- doivent pouvoir executer cette fonction SECURITY DEFINER pour evaluer leurs droits.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
