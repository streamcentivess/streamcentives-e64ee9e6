import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');

    if (!postId) {
      return new Response('Post ID required', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch post data
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return new Response('Post not found', { status: 404, headers: corsHeaders });
    }

    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('user_id', post.user_id)
      .single();

    const creatorName = profile?.display_name || profile?.username || 'Streamcentives Creator';
    const description = post.content || `Check out this ${post.media_type || 'post'} from ${creatorName}`;
    const imageUrl = post.media_url || profile?.avatar_url || 'https://fuoefkfekhzhlsblloal.supabase.co/storage/v1/object/public/lovable-uploads/streamcentives-logo-optimized.webp';
    const videoUrl = post.media_type === 'video' ? post.media_url : null;

    // Generate HTML with Open Graph meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${creatorName} on Streamcentives</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${creatorName} on Streamcentives">
  <meta name="description" content="${description.slice(0, 160)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${videoUrl ? 'video.other' : 'website'}">
  <meta property="og:url" content="https://fuoefkfekhzhlsblloal.supabase.co/post/${postId}">
  <meta property="og:title" content="${creatorName} on Streamcentives">
  <meta property="og:description" content="${description.slice(0, 160)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  ${videoUrl ? `
  <meta property="og:video" content="${videoUrl}">
  <meta property="og:video:secure_url" content="${videoUrl}">
  <meta property="og:video:type" content="video/mp4">
  <meta property="og:video:width" content="1280">
  <meta property="og:video:height" content="720">
  ` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="${videoUrl ? 'player' : 'summary_large_image'}">
  <meta property="twitter:url" content="https://fuoefkfekhzhlsblloal.supabase.co/post/${postId}">
  <meta property="twitter:title" content="${creatorName} on Streamcentives">
  <meta property="twitter:description" content="${description.slice(0, 160)}">
  <meta property="twitter:image" content="${imageUrl}">
  ${videoUrl ? `
  <meta property="twitter:player" content="https://fuoefkfekhzhlsblloal.supabase.co/post/${postId}">
  <meta property="twitter:player:width" content="1280">
  <meta property="twitter:player:height" content="720">
  ` : ''}
  
  <!-- Redirect to React app -->
  <meta http-equiv="refresh" content="0;url=https://fuoefkfekhzhlsblloal.supabase.co/post/${postId}">
  
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #000;
      color: #fff;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      border: 3px solid #333;
      border-top: 3px solid #fff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Error generating meta tags:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
