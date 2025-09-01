import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useContractRecurrences() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processRecurrences = async (targetMonth?: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-contract-recurrences', {
        body: { target_month: targetMonth }
      });

      if (error) {
        throw error;
      }

      console.log('Contract recurrences processed:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error processing contract recurrences:', error);
      toast({
        title: "Erro ao processar recorrências",
        description: "Não foi possível processar as recorrências dos contratos.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const processMultipleMonths = async (startDate: Date, endDate: Date) => {
    const months: string[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      months.push(current.toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }

    setIsProcessing(true);
    
    try {
      const results = [];
      for (const month of months) {
        const result = await processRecurrences(month);
        results.push({ month, result });
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Processed multiple months:', results);
      return { success: true, results };
    } catch (error) {
      console.error('Error processing multiple months:', error);
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processRecurrences,
    processMultipleMonths,
    isProcessing
  };
}