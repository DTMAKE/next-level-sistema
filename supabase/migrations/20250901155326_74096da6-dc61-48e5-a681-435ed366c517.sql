-- Update the handle_new_user function to include the new contract commission field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, percentual_comissao, percentual_comissao_contrato, meta_mensal)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor'),
    COALESCE((NEW.raw_user_meta_data->>'percentual_comissao')::numeric, 5.00),
    COALESCE((NEW.raw_user_meta_data->>'percentual_comissao_contrato')::numeric, 1.00),
    COALESCE((NEW.raw_user_meta_data->>'meta_mensal')::numeric, 10000.00)
  );
  RETURN NEW;
END;
$function$;