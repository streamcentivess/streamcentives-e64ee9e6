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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId, xpAmount } = await req.json()

    if (!userId || !xpAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'userId and xpAmount are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Updating XP for user ${userId} to ${xpAmount}`)

    // Update or insert XP balance for the user
    const { error } = await supabase
      .from('user_xp_balances')
      .upsert({
        user_id: userId,
        current_xp: xpAmount,
        total_earned_xp: xpAmount,
        total_spent_xp: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating XP:', error)
      throw new Error(`Failed to update XP: ${error.message}`)
    }

    console.log(`Successfully updated XP for user ${userId} to ${xpAmount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated XP to ${xpAmount}`,
        userId,
        xpAmount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in update-user-xp function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})