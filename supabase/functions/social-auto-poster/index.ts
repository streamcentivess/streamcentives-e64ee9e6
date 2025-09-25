import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "node:crypto"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { content, platforms, user_id, content_type = 'text' } = await req.json()

    console.log(`Auto-posting content for user ${user_id} to platforms:`, platforms)

    // Get user's social media credentials
    const { data: userCredentials } = await supabase
      .from('social_media_credentials')
      .select('*')
      .eq('user_id', user_id)
      .in('platform', platforms)

    const results = []

    for (const platform of platforms) {
      const credentials = userCredentials?.find(c => c.platform === platform)
      
      if (!credentials || !credentials.is_active) {
        results.push({
          platform,
          status: 'skipped',
          reason: 'No active credentials found'
        })
        continue
      }

      try {
        let postResult
        switch (platform) {
          case 'twitter':
            postResult = await postToTwitter(content, credentials)
            break
          case 'instagram':
            postResult = await postToInstagram(content, credentials, content_type)
            break
          case 'tiktok':
            postResult = await postToTikTok(content, credentials, content_type)
            break
          case 'facebook':
            postResult = await postToFacebook(content, credentials)
            break
          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }

        results.push({
          platform,
          status: 'success',
          post_id: postResult.id,
          url: postResult.url
        })

        // Log successful post
        await supabase.from('social_media_posts').insert({
          user_id,
          platform,
          content: typeof content === 'string' ? content : content.text,
          post_id: postResult.id,
          post_url: postResult.url,
          posted_at: new Date().toISOString()
        })

      } catch (error) {
        console.error(`Failed to post to ${platform}:`, error)
        results.push({
          platform,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Auto-poster error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function postToTwitter(content: any, credentials: any) {
  const tweetText = typeof content === 'string' ? content : content.text

  const oauthParams = {
    oauth_consumer_key: credentials.api_key,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.access_token,
    oauth_version: "1.0",
  }

  const signature = generateOAuthSignature(
    'POST',
    'https://api.x.com/2/tweets',
    oauthParams,
    credentials.api_secret,
    credentials.access_token_secret
  )

  const signedOAuthParams = { ...oauthParams, oauth_signature: signature }
  const authHeader = "OAuth " + Object.entries(signedOAuthParams)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ")

  const response = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: tweetText })
  })

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`)
  }

  const result = await response.json()
  return {
    id: result.data.id,
    url: `https://twitter.com/i/web/status/${result.data.id}`
  }
}

async function postToInstagram(content: any, credentials: any, contentType: string) {
  // Instagram Basic Display API implementation
  const accessToken = credentials.access_token
  
  if (contentType === 'image' && content.media_url) {
    // Post image to Instagram
    const mediaResponse = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagram_user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: content.media_url,
          caption: content.caption || content.text,
          access_token: accessToken
        })
      }
    )

    const mediaResult = await mediaResponse.json()
    
    // Publish the media
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagram_user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: mediaResult.id,
          access_token: accessToken
        })
      }
    )

    const publishResult = await publishResponse.json()
    return {
      id: publishResult.id,
      url: `https://instagram.com/p/${publishResult.id}`
    }
  } else {
    throw new Error('Instagram requires image content')
  }
}

async function postToTikTok(content: any, credentials: any, contentType: string) {
  // TikTok API implementation (simplified)
  if (contentType === 'video' && content.video_url) {
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: content.title || content.text,
          privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: content.video_size || 10485760,
          chunk_size: 10485760,
          total_chunk_count: 1
        }
      })
    })

    const result = await response.json()
    return {
      id: result.data.publish_id,
      url: result.data.share_url
    }
  } else {
    throw new Error('TikTok requires video content')
  }
}

async function postToFacebook(content: any, credentials: any) {
  const message = typeof content === 'string' ? content : content.text
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${credentials.page_id}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: credentials.access_token
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.status}`)
  }

  const result = await response.json()
  return {
    id: result.id,
    url: `https://facebook.com/${result.id}`
  }
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  const hmacSha1 = createHmac("sha1", signingKey)
  return hmacSha1.update(signatureBaseString).digest("base64")
}