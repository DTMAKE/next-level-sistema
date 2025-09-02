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

    // Find receivables without valid origin (venda_id is null)
    const { data: orphanWithoutSale, error: fetchOrphanError } = await supabaseClient
      .from('transacoes_financeiras')
      .select('id, descricao, valor, data_transacao')
      .eq('tipo', 'receita')
      .is('venda_id', null)
      .eq('status', 'pendente');

    if (fetchOrphanError) {
      console.error('Error fetching orphan receivables without sale:', fetchOrphanError);
      throw fetchOrphanError;
    }

    console.log(`Found ${orphanWithoutSale?.length || 0} orphan receivables without sale origin`);

    const result: DeleteResult = {
      deletedCount: 0,
      details: []
    };

    // Delete orphan receivables without sale origin
    if (orphanWithoutSale && orphanWithoutSale.length > 0) {
      const orphanIds = orphanWithoutSale.map(r => r.id);
      
      const { error: deleteOrphanError } = await supabaseClient
        .from('transacoes_financeiras')
        .delete()
        .in('id', orphanIds);

      if (!deleteOrphanError) {
        result.deletedCount += orphanWithoutSale.length;
        result.details.push(...orphanWithoutSale.map(r => 
          `Conta órfã sem origem removida: ${r.descricao} - R$ ${r.valor}`
        ));
        console.log(`Deleted ${orphanWithoutSale.length} orphan receivables without sale`);
      } else {
        console.error('Error deleting orphan receivables:', deleteOrphanError);
      }
    }

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

    console.log(`Found ${orphanReceivables?.length || 0} potential orphan contract receivables`);

    if (!orphanReceivables || orphanReceivables.length === 0) {
      if (result.deletedCount === 0) {
        return new Response(
          JSON.stringify({ deletedCount: 0, details: [], message: 'Nenhuma conta órfã encontrada' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
    }

    const result2: DeleteResult = {
      deletedCount: result.deletedCount,
      details: [...result.details]
    };

    // Check each receivable to see if it's truly orphaned
    if (orphanReceivables && orphanReceivables.length > 0) {
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
            .eq('numero_contrato', contractIdentifier)
            .eq('status', 'ativo')
            .maybeSingle();

          // If no active contract found, this receivable is orphaned
          if (!activeContract) {
            const { error: deleteError } = await supabaseClient
              .from('transacoes_financeiras')
              .delete()
              .eq('id', receivable.id);

            if (!deleteError) {
              result2.deletedCount++;
              result2.details.push(`Conta removida: ${receivable.descricao} - R$ ${receivable.valor}`);
              console.log(`Deleted orphan receivable: ${receivable.id}`);
            } else {
              console.error(`Error deleting receivable ${receivable.id}:`, deleteError);
            }
          }
        } catch (error) {
          console.error(`Error processing receivable ${receivable.id}:`, error);
        }
      }
    }

    // Also clean up receivables with contract descriptions that don't match any existing contract
    if (orphanReceivables && orphanReceivables.length > 0) {
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
              result2.deletedCount++;
              result2.details.push(`Conta de contrato inexistente removida: ${receivable.descricao} - R$ ${receivable.valor}`);
              console.log(`Deleted receivable from non-existent contract: ${receivable.id}`);
            }
          }
        } catch (error) {
          console.error(`Error processing non-existent contract receivable ${receivable.id}:`, error);
        }
      }
    }

    console.log(`Cleanup completed. Deleted ${result2.deletedCount} orphan receivables.`);

    return new Response(
      JSON.stringify({
        ...result2,
        message: result2.deletedCount > 0 
          ? `${result2.deletedCount} conta(s) órfã(s) removida(s) com sucesso`
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