import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event_type: string
  data: any
  user_id?: string
  created_at: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event_type, data, user_id } = await req.json()

    console.log(`Processing webhook event: ${event_type}`, data)

    // Get all active webhooks for this event type
    const { data: webhooks, error } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('event_type', event_type)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching webhooks:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch webhooks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process each webhook
    const webhookResults = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const payload: WebhookPayload = {
            event_type,
            data,
            user_id,
            created_at: new Date().toISOString()
          }

          // Add signature for verification
          const signature = await generateSignature(JSON.stringify(payload), webhook.secret_key)

          const response = await fetch(webhook.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-StreamCentives-Signature': signature,
              'X-StreamCentives-Event': event_type,
              'User-Agent': 'StreamCentives-Webhooks/1.0'
            },
            body: JSON.stringify(payload)
          })

          // Log webhook delivery
          await supabase.from('webhook_deliveries').insert({
            webhook_subscription_id: webhook.id,
            event_type,
            payload,
            response_status: response.status,
            response_body: await response.text(),
            delivered_at: new Date().toISOString()
          })

          return { webhook_id: webhook.id, status: 'success', response_status: response.status }
        } catch (error) {
          console.error(`Webhook delivery failed for ${webhook.id}:`, error)
          
          // Log failed delivery
          await supabase.from('webhook_deliveries').insert({
            webhook_subscription_id: webhook.id,
            event_type,
            payload: { event_type, data, user_id },
            error_message: error instanceof Error ? error.message : 'Unknown error',
            delivered_at: new Date().toISOString()
          })

          return { webhook_id: webhook.id, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })
    )

    return new Response(JSON.stringify({
      success: true,
      event_type,
      webhooks_processed: webhookResults.length,
      results: webhookResults.map(result => 
        result.status === 'fulfilled' ? result.value : { status: 'failed', error: result.reason }
      )
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook manager error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}