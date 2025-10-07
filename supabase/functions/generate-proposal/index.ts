import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can generate proposals');
    }

    const { contexto, clienteNome, segmento, servicosIds } = await req.json();

    // Fetch services info
    let servicosInfo = '';
    if (servicosIds && servicosIds.length > 0) {
      const { data: servicos } = await supabase
        .from('servicos')
        .select('nome, descricao, valor_implementacao, valor')
        .in('id', servicosIds);
      
      if (servicos) {
        servicosInfo = servicos.map(s => 
          `${s.nome}: ${s.descricao || ''} (Implementação: R$ ${s.valor_implementacao || 0} | Mensal: R$ ${s.valor || 0})`
        ).join('\n');
      }
    }

    const systemPrompt = `Você é um especialista em criação de propostas comerciais para a Next Level, uma empresa de tecnologia e marketing digital.

Identidade Visual Next Level:
- Cores: Azul profissional (#3B82F6), roxo (#8B5CF6), gradientes modernos
- Tom: Profissional, consultivo, focado em resultados e ROI
- Estilo: Moderno, clean, orientado a dados

Sua tarefa é gerar uma estrutura de slides para uma proposta comercial baseada no contexto fornecido.`;

    const userPrompt = `Crie uma proposta comercial completa com base nas seguintes informações:

Cliente: ${clienteNome || 'Não especificado'}
Segmento: ${segmento || 'Não especificado'}
Contexto: ${contexto}

${servicosInfo ? `Serviços de interesse:\n${servicosInfo}` : ''}

Gere uma proposta com os seguintes slides (estrutura JSON):
1. Capa - título impactante
2. Sobre a Next Level - breve apresentação
3. Desafios do Cliente - problemas identificados
4. Solução Proposta - como vamos resolver
5. Serviços Incluídos - detalhamento técnico
6. Investimento - valores e condições
7. Cronograma - etapas e prazos
8. Próximos Passos - calls to action
9. Contato - informações da Next Level

Use a função generate_slides para retornar a estrutura.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_slides',
              description: 'Gera estrutura de slides para proposta comercial',
              parameters: {
                type: 'object',
                properties: {
                  titulo: { type: 'string', description: 'Título da proposta' },
                  slides: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        tipo: { 
                          type: 'string', 
                          enum: ['capa', 'sobre', 'problema', 'solucao', 'servicos', 'investimento', 'cronograma', 'proximos_passos', 'contato']
                        },
                        titulo: { type: 'string' },
                        conteudo: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        destaque: { type: 'string' }
                      },
                      required: ['tipo', 'titulo', 'conteudo']
                    }
                  }
                },
                required: ['titulo', 'slides']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_slides' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const slidesData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        titulo: slidesData.titulo,
        slides: slidesData.slides
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Unauthorized' || error.message === 'Only admins can generate proposals' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});