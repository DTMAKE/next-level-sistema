import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteResult {
  deletedCount: number;
  details: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting cleanup of orphan receivables...');

    // Find receivables from inactive contracts (pending only)
    const { data: orphanReceivables, error: fetchError } = await supabaseClient
      .from('transacoes_financeiras')
      .select(`
        id,
        descricao,
        valor,
        data_transacao,
        status
      `)
      .eq('tipo', 'receita')
      .eq('status', 'pendente')
      .like('descricao', '%Contrato%');

    if (fetchError) {
      console.error('Error fetching receivables:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${orphanReceivables?.length || 0} potential orphan receivables`);

    if (!orphanReceivables || orphanReceivables.length === 0) {
      return new Response(
        JSON.stringify({ deletedCount: 0, details: [], message: 'Nenhuma conta órfã encontrada' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const result: DeleteResult = {
      deletedCount: 0,
      details: []
    };

    // Check each receivable to see if it's truly orphaned
    for (const receivable of orphanReceivables) {
      try {
        // Extract contract number/id from description
        const contractMatch = receivable.descricao?.match(/Contrato\s+(.+?)\s+-/);
        if (!contractMatch) continue;

        const contractIdentifier = contractMatch[1].trim();
        
        // Check if contract exists and is active
        const { data: activeContract } = await supabaseClient
          .from('contratos')
          .select('id, status')
          .or(`numero_contrato.eq.${contractIdentifier},id.eq.${contractIdentifier}`)
          .eq('status', 'ativo')
          .single();

        // If no active contract found, this receivable is orphaned
        if (!activeContract) {
          const { error: deleteError } = await supabaseClient
            .from('transacoes_financeiras')
            .delete()
            .eq('id', receivable.id);

          if (!deleteError) {
            result.deletedCount++;
            result.details.push(`Conta removida: ${receivable.descricao} - R$ ${receivable.valor}`);
            console.log(`Deleted orphan receivable: ${receivable.id}`);
          } else {
            console.error(`Error deleting receivable ${receivable.id}:`, deleteError);
          }
        }
      } catch (error) {
        console.error(`Error processing receivable ${receivable.id}:`, error);
      }
    }

    // Also clean up receivables with contract descriptions that don't match any existing contract
    const { data: allContracts } = await supabaseClient
      .from('contratos')
      .select('id, numero_contrato');

    const existingIdentifiers = new Set([
      ...allContracts?.map(c => c.numero_contrato).filter(Boolean) || [],
      ...allContracts?.map(c => c.id) || []
    ]);

    // Find receivables that reference non-existent contracts
    for (const receivable of orphanReceivables) {
      try {
        const contractMatch = receivable.descricao?.match(/Contrato\s+(.+?)\s+-/);
        if (!contractMatch) continue;

        const contractIdentifier = contractMatch[1].trim();
        
        if (!existingIdentifiers.has(contractIdentifier)) {
          const { error: deleteError } = await supabaseClient
            .from('transacoes_financeiras')
            .delete()
            .eq('id', receivable.id);

          if (!deleteError) {
            result.deletedCount++;
            result.details.push(`Conta de contrato inexistente removida: ${receivable.descricao} - R$ ${receivable.valor}`);
            console.log(`Deleted receivable from non-existent contract: ${receivable.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing non-existent contract receivable ${receivable.id}:`, error);
      }
    }

    console.log(`Cleanup completed. Deleted ${result.deletedCount} orphan receivables.`);

    return new Response(
      JSON.stringify({
        ...result,
        message: result.deletedCount > 0 
          ? `${result.deletedCount} conta(s) órfã(s) removida(s) com sucesso`
          : 'Nenhuma conta órfã encontrada para remoção'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cleanup function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message,
        deletedCount: 0,
        details: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});