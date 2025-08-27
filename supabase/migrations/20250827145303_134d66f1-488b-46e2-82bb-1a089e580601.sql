-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles 
  WHERE user_id = current_user_id;
  
  -- Only admins can use this function
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Verify password using Supabase auth
  -- This will check the password against the authenticated user's actual password
  RETURN auth.authenticate(current_user_id, input_password) IS NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;