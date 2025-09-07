import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringTransaction {
  id: string;
  user_id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  data_vencimento: string | null;
  forma_pagamento: string;
  parcelas: number;
  parcela_atual: number;
  observacoes: string | null;
  frequencia: string;
  data_fim_recorrencia: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando processamento de transações recorrentes...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as transações recorrentes que precisam gerar novas instâncias
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .eq('recorrente', true)
      .not('frequencia', 'is', null);

    if (fetchError) {
      console.error('Erro ao buscar transações recorrentes:', fetchError);
      throw fetchError;
    }

    console.log(`Encontradas ${recurringTransactions?.length || 0} transações recorrentes para processar`);

    const newTransactions = [];
    const today = new Date();
    
    for (const transaction of recurringTransactions || []) {
      const originalDate = new Date(transaction.data_transacao);
      const endDate = transaction.data_fim_recorrencia 
        ? new Date(transaction.data_fim_recorrencia) 
        : new Date(originalDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano padrão

      // Calcular incremento baseado na frequência
      const incrementMonths = {
        'mensal': 1,
        'trimestral': 3,
        'semestral': 6,
        'anual': 12
      }[transaction.frequencia] || 1;

      // Verificar se há transações geradas para os próximos períodos
      const { data: existingTransactions } = await supabase
        .from('transacoes_financeiras')
        .select('data_transacao')
        .eq('recorrencia_origem_id', transaction.id)
        .order('data_transacao', { ascending: false })
        .limit(1);

      let lastGeneratedDate = originalDate;
      if (existingTransactions && existingTransactions.length > 0) {
        lastGeneratedDate = new Date(existingTransactions[0].data_transacao);
      }

      // Gerar próximas transações necessárias
      let nextDate = new Date(lastGeneratedDate);
      nextDate.setMonth(nextDate.getMonth() + incrementMonths);
      
      // Gerar transações para os próximos 3 meses
      for (let i = 0; i < 3 && nextDate <= endDate; i++) {
        // Verificar se a transação para esta data já existe
        const { data: existing } = await supabase
          .from('transacoes_financeiras')
          .select('id')
          .eq('recorrencia_origem_id', transaction.id)
          .eq('data_transacao', nextDate.toISOString().split('T')[0])
          .limit(1);

        if (!existing || existing.length === 0) {
          const nextVencimento = transaction.data_vencimento 
            ? new Date(new Date(transaction.data_vencimento).getTime() + (nextDate.getTime() - originalDate.getTime()))
            : null;

          newTransactions.push({
            user_id: transaction.user_id,
            tipo: transaction.tipo,
            descricao: transaction.descricao,
            valor: transaction.valor,
            data_transacao: nextDate.toISOString().split('T')[0],
            data_vencimento: nextVencimento ? nextVencimento.toISOString().split('T')[0] : null,
            forma_pagamento: transaction.forma_pagamento,
            parcelas: transaction.parcelas,
            parcela_atual: transaction.parcela_atual,
            observacoes: transaction.observacoes,
            status: 'pendente',
            recorrencia_origem_id: transaction.id,
          });

          console.log(`Nova transação gerada para ${nextDate.toISOString().split('T')[0]} - ${transaction.descricao}`);
        }

        // Próxima data
        nextDate = new Date(nextDate);
        nextDate.setMonth(nextDate.getMonth() + incrementMonths);
      }
    }

    // Inserir novas transações em lote
    if (newTransactions.length > 0) {
      const { error: insertError } = await supabase
        .from('transacoes_financeiras')
        .insert(newTransactions);

      if (insertError) {
        console.error('Erro ao inserir novas transações:', insertError);
        throw insertError;
      }

      console.log(`${newTransactions.length} novas transações recorrentes criadas com sucesso`);
    } else {
      console.log('Nenhuma nova transação recorrente necessária');
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: recurringTransactions?.length || 0,
        created: newTransactions.length,
        message: `Processamento concluído. ${newTransactions.length} novas transações criadas.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Erro no processamento de transações recorrentes:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});