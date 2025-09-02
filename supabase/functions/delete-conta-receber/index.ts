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

    // Check if it's linked to an active contract
    if (conta.descricao?.includes('Contrato')) {
      const contractMatch = conta.descricao.match(/Contrato\s+(.+?)\s+-/);
      if (contractMatch) {
        const contractIdentifier = contractMatch[1].trim();
        
        // Only check by numero_contrato since contractIdentifier is a string, not UUID
        const { data: activeContract } = await supabaseClient
          .from('contratos')
          .select('id, status')
          .eq('numero_contrato', contractIdentifier)
          .eq('status', 'ativo')
          .maybeSingle();

        if (activeContract) {
          canDelete = false;
          errorMessage = 'Não é possível excluir: existe contrato ativo relacionado';
        }
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