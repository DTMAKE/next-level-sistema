-- Check if trigger exists for contracts
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'contratos';

-- If trigger doesn't exist, create it
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS trigger_create_financial_transactions_from_contract ON public.contratos;
    
    -- Create the trigger
    CREATE TRIGGER trigger_create_financial_transactions_from_contract
        AFTER INSERT ON public.contratos
        FOR EACH ROW
        EXECUTE FUNCTION public.create_financial_transactions_from_contract();
END $$;