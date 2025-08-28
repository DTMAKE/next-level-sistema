-- Create function to sync commissions for all users (admin only)
CREATE OR REPLACE FUNCTION public.sync_all_commissions_to_financial()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_record record;
BEGIN
    -- Check if current user is admin
    IF get_current_user_role() != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync all commissions';
    END IF;
    
    -- Loop through all users who have commissions
    FOR user_record IN
        SELECT DISTINCT user_id 
        FROM public.comissoes
    LOOP
        -- Call the existing sync function for each user
        PERFORM sync_commissions_to_financial(user_record.user_id);
    END LOOP;
END;
$function$;