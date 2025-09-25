import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const higgsFieldApiKey = Deno.env.get('HIGGSFIELD_API_KEY');
    const higgsFieldSecret = Deno.env.get('HIGGSFIELD_SECRET');
    
    if (!higgsFieldApiKey || !higgsFieldSecret) {
      throw new Error('HiggsField API credentials not configured');
    }

    console.log('Fetching available motion templates from HiggsField...');

    // Fetch available motions from HiggsField API
    const response = await fetch('https://platform.higgsfield.ai/v1/motions', {
      headers: {
        'hf-api-key': higgsFieldApiKey,
        'hf-secret': higgsFieldSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HiggsField motions error:', errorText);
      throw new Error(`HiggsField API error: ${response.status} ${errorText}`);
    }

    const motions = await response.json();
    console.log('Fetched motions:', motions);

    return new Response(
      JSON.stringify({
        success: true,
        motions: motions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('HiggsField motions error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});