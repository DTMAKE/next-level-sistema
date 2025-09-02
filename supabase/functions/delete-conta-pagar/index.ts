import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { conta_id } = await req.json()

    if (!conta_id) {
      return new Response(
        JSON.stringify({ error: 'ID da conta é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Validating deletion of conta a pagar:', conta_id)

    // Buscar a conta
    const { data: conta, error: fetchError } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .eq('id', conta_id)
      .eq('tipo', 'despesa')
      .single()

    if (fetchError || !conta) {
      console.error('Conta não encontrada:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Conta não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se é uma comissão relacionada a uma venda ativa
    if (conta.comissao_id) {
      console.log('Checking commission relation for:', conta.comissao_id)
      
      const { data: comissao, error: comissaoError } = await supabase
        .from('comissoes')
        .select('*, vendas!inner(status)')
        .eq('id', conta.comissao_id)
        .single()

      if (comissaoError) {
        console.error('Error checking commission:', comissaoError)
      } else if (comissao && comissao.vendas?.status === 'fechada') {
        return new Response(
          JSON.stringify({ error: 'Não é possível excluir: existe venda relacionada' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Verificar se existe contrato ativo relacionado
    if (conta.descricao && conta.descricao.toLowerCase().includes('contrato')) {
      console.log('Checking contract relation for description:', conta.descricao)
      
      // Extrair número do contrato da descrição
      const contratoMatch = conta.descricao.match(/contrato\s+([^\s-]+)/i)
      if (contratoMatch) {
        const contratoNumero = contratoMatch[1]
        
        const { data: contratos, error: contratoError } = await supabase
          .from('contratos')
          .select('status, numero_contrato, id')
          .or(`numero_contrato.ilike.%${contratoNumero}%,id.eq.${contratoNumero}`)

        if (contratoError) {
          console.error('Error checking contracts:', contratoError)
        } else if (contratos && contratos.some(c => c.status === 'ativo')) {
          return new Response(
            JSON.stringify({ error: 'Não é possível excluir: existe contrato ativo relacionado' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
    }

    // Se chegou até aqui, pode deletar
    console.log('Deleting conta a pagar:', conta_id)
    
    const { error: deleteError } = await supabase
      .from('transacoes_financeiras')
      .delete()
      .eq('id', conta_id)

    if (deleteError) {
      console.error('Error deleting conta:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir conta a pagar' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Conta a pagar deleted successfully')
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})