import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteRequest {
  conta_id: string;
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

    const { conta_id }: DeleteRequest = await req.json();

    if (!conta_id) {
      return new Response(
        JSON.stringify({ error: 'ID da conta é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`Attempting to delete conta receber: ${conta_id}`);

    // First, get the conta details for validation
    const { data: conta, error: fetchError } = await supabaseClient
      .from('transacoes_financeiras')
      .select('*')
      .eq('id', conta_id)
      .eq('tipo', 'receita')
      .single();

    if (fetchError || !conta) {
      console.error('Error fetching conta:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Conta não encontrada' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Validate if conta can be deleted
    let canDelete = true;
    let errorMessage = '';

    // Check if it's linked to a contract using the new contrato_id column
    if (conta.contrato_id) {
      const { data: activeContract } = await supabaseClient
        .from('contratos')
        .select('id, status, tipo_contrato, numero_contrato')
        .eq('id', conta.contrato_id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (activeContract) {
        canDelete = false;
        if (activeContract.tipo_contrato === 'recorrente') {
          errorMessage = 'Não é possível excluir parcelas individuais de contratos recorrentes. Para cancelar, desative o contrato inteiro.';
        } else {
          errorMessage = 'Não é possível excluir: existe contrato ativo relacionado';
        }
      }
    }
    
    // Fallback: Check legacy method for accounts that don't have contrato_id yet
    else if (conta.descricao?.includes('Contrato') || conta.descricao?.toLowerCase().includes('receita recorrente')) {
      // Try to extract contract number or ID from description
      const contractMatch = conta.descricao.match(/Contrato\s+(.+?)\s+-/) || 
                           conta.descricao.match(/contrato\s+([a-f0-9-]{36})/i);
      
      if (contractMatch) {
        const contractIdentifier = contractMatch[1].trim();
        
        // Check by numero_contrato first, then by ID if it looks like a UUID
        let contractQuery = supabaseClient
          .from('contratos')
          .select('id, status, tipo_contrato, numero_contrato')
          .eq('status', 'ativo');
          
        if (contractIdentifier.length === 36 && contractIdentifier.includes('-')) {
          // Looks like UUID
          contractQuery = contractQuery.eq('id', contractIdentifier);
        } else {
          // Looks like contract number
          contractQuery = contractQuery.eq('numero_contrato', contractIdentifier);
        }

        const { data: activeContract } = await contractQuery.maybeSingle();

        if (activeContract) {
          canDelete = false;
          if (activeContract.tipo_contrato === 'recorrente') {
            errorMessage = 'Não é possível excluir parcelas individuais de contratos recorrentes. Para cancelar, desative o contrato inteiro.';
          } else {
            errorMessage = 'Não é possível excluir: existe contrato ativo relacionado';
          }
        }
      }
      
      // Additional check: if description mentions recurring revenue, block deletion
      if (conta.descricao?.toLowerCase().includes('receita recorrente')) {
        canDelete = false;
        errorMessage = 'Não é possível excluir parcelas de receita recorrente individualmente. Para cancelar, desative o contrato relacionado.';
      }
    }

    // Check if it's linked to a closed sale
    if (canDelete && conta.venda_id) {
      const { data: closedSale } = await supabaseClient
        .from('vendas')
        .select('id, status')
        .eq('id', conta.venda_id)
        .eq('status', 'fechada')
        .maybeSingle();

      if (closedSale) {
        canDelete = false;
        errorMessage = 'Não é possível excluir: existe venda relacionada';
      }
    }

    // Allow deletion of accounts receivable without origin (venda_id = null)
    // These are considered orphan records that can be cleaned up
    if (!conta.venda_id) {
      console.log('Allowing deletion of orphan receivable without venda_id');
      canDelete = true;
    }

    if (!canDelete) {
      console.log(`Deletion blocked: ${errorMessage}`);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Proceed with deletion
    const { error: deleteError } = await supabaseClient
      .from('transacoes_financeiras')
      .delete()
      .eq('id', conta_id);

    if (deleteError) {
      console.error('Error deleting conta:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir conta a receber' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log(`Successfully deleted conta receber: ${conta_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta excluída com sucesso',
        deletedId: conta_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in delete function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});