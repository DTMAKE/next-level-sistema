import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting contract recurrences processing...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get target month from request body or use current month
    const { target_month } = await req.json().catch(() => ({ target_month: null }))
    const targetDate = target_month ? new Date(target_month) : new Date()
    
    // Format as YYYY-MM-01 for the first day of the month
    const formattedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      .toISOString().split('T')[0]

    console.log(`Processing contracts for month: ${formattedDate}`)

    // Call the database function to process recurrences
    const { error } = await supabase.rpc('process_contract_recurrences', {
      target_month: formattedDate
    })

    if (error) {
      console.error('Error processing contract recurrences:', error)
      throw error
    }

    console.log('Contract recurrences processed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contract recurrences processed successfully',
        target_month: formattedDate 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in process-contract-recurrences function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})