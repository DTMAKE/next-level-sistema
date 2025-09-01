import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the target month from request body or default to current month
    const { target_month } = await req.json().catch(() => ({}))
    const targetDate = target_month ? new Date(target_month) : new Date()
    
    // Format date for the database function (first day of the month)
    const targetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    const formattedDate = targetMonth.toISOString().split('T')[0]

    console.log('Processing contract recurrences for month:', formattedDate)

    // Call the database function to process contract recurrences
    const { data, error } = await supabaseClient
      .rpc('process_contract_recurrences', {
        target_month: formattedDate
      })

    if (error) {
      console.error('Error processing contract recurrences:', error)
      throw error
    }

    console.log('Successfully processed contract recurrences')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contract recurrences processed successfully',
        target_month: formattedDate
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in process-contract-recurrences function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})