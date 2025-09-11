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

    const { xpAmount = 1000 } = await req.json()

    console.log(`Starting bulk XP update to ${xpAmount} for all users`)

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    console.log(`Found ${profiles?.length || 0} user profiles`)

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users found to update',
          updatedCount: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Update XP for all users
    let updatedCount = 0
    let errors: string[] = []

    for (const profile of profiles) {
      try {
        // Update or insert XP balance for each user
        const { error: xpError } = await supabase
          .from('user_xp_balances')
          .upsert({
            user_id: profile.user_id,
            current_xp: xpAmount,
            total_earned_xp: xpAmount,
            total_spent_xp: 0,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (xpError) {
          console.error(`Error updating XP for user ${profile.user_id}:`, xpError)
          errors.push(`User ${profile.user_id}: ${xpError.message}`)
        } else {
          updatedCount++
          console.log(`Updated XP for user ${profile.user_id}`)
        }
      } catch (error) {
        console.error(`Exception updating user ${profile.user_id}:`, error)
        errors.push(`User ${profile.user_id}: ${error.message}`)
      }
    }

    console.log(`Bulk XP update completed. Updated: ${updatedCount}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated XP for ${updatedCount} users`,
        updatedCount,
        totalUsers: profiles.length,
        errors: errors.slice(0, 10) // Limit error details to first 10
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in bulk-update-xp function:', error)
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