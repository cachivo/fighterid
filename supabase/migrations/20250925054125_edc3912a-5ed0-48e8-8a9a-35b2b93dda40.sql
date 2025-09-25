-- Arreglar las advertencias de seguridad - Function Search Path Mutable
-- Solo para funciones SQL que puedo modificar

CREATE OR REPLACE FUNCTION public.get_current_user_judge_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT j.id FROM public.judges j 
  JOIN public.app_user u ON j.email = u.email 
  WHERE u.auth_user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_assigned_judge(p_fight_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.fight_officials fo
    WHERE fo.fight_id = p_fight_id 
    AND fo.official_id = public.get_current_user_judge_id()
    AND fo.role LIKE 'JUDGE_%'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_assigned_referee(p_fight_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.fight_officials fo
    WHERE fo.fight_id = p_fight_id
    AND fo.official_id = public.get_current_user_judge_id()
    AND fo.role = 'REFEREE'
  );
$function$;