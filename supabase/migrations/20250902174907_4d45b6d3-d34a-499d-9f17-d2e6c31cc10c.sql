-- Execute the fix for existing contracts
DO $$
DECLARE
    result_record record;
    total_contracts_fixed integer := 0;
    total_installments_created integer := 0;
BEGIN
    -- Execute the fix function and collect results
    FOR result_record IN
        SELECT * FROM public.fix_contract_types_and_generate_missing_installments()
    LOOP
        total_contracts_fixed := total_contracts_fixed + 1;
        total_installments_created := total_installments_created + result_record.installments_created;
        
        RAISE NOTICE 'Fixed contract %: % (%d months) - %', 
            result_record.numero_contrato, 
            result_record.contrato_id, 
            result_record.months_duration, 
            result_record.action_taken;
    END LOOP;
    
    RAISE NOTICE 'SUMMARY: Fixed % contracts and created % installments total', 
        total_contracts_fixed, 
        total_installments_created;
END $$;