import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssetRequest {
  redemptionId: string;
  userAgent?: string;
  ipAddress?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { redemptionId, userAgent, ipAddress }: AssetRequest = await req.json();

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    // Initialize service role client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user owns this redemption
    const { data: redemption, error: redemptionError } = await supabaseService
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards(
          id,
          title,
          digital_asset_bucket,
          digital_asset_key,
          asset_expiry_hours,
          creator_id
        )
      `)
      .eq('id', redemptionId)
      .eq('user_id', user.id)
      .single();

    if (redemptionError || !redemption) {
      throw new Error("Redemption not found or access denied");
    }

    // Check if reward has digital asset
    if (!redemption.reward.digital_asset_bucket || !redemption.reward.digital_asset_key) {
      throw new Error("No digital asset available for this reward");
    }

    // Check if user has already accessed this asset recently (prevent abuse)
    const { data: recentAccess } = await supabaseService
      .from('digital_asset_access_logs')
      .select('id')
      .eq('reward_redemption_id', redemptionId)
      .eq('user_id', user.id)
      .gte('accessed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentAccess && recentAccess.length > 0) {
      throw new Error("Asset already accessed recently. Please wait 24 hours between downloads.");
    }

    // Generate pre-signed URL using AWS SDK
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const awsBucket = Deno.env.get('AWS_BUCKET_NAME');
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucket) {
      throw new Error("AWS credentials not configured");
    }

    // Create AWS S3 pre-signed URL
    const expirationHours = redemption.reward.asset_expiry_hours || 24;
    const expirationSeconds = expirationHours * 3600;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

    // Use AWS SDK v3 style signing
    const { S3Client, GetObjectCommand } = await import('https://esm.sh/@aws-sdk/client-s3@3.462.0');
    const { getSignedUrl } = await import('https://esm.sh/@aws-sdk/s3-request-presigner@3.462.0');

    const s3Client = new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: redemption.reward.digital_asset_bucket,
      Key: redemption.reward.digital_asset_key,
    });

    const preSignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    // Log access
    await supabaseService.from('digital_asset_access_logs').insert({
      reward_redemption_id: redemptionId,
      user_id: user.id,
      asset_bucket: redemption.reward.digital_asset_bucket,
      asset_key: redemption.reward.digital_asset_key,
      download_url: preSignedUrl,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress || req.headers.get('x-forwarded-for'),
      user_agent: userAgent || req.headers.get('user-agent')
    });

    // Send notification to creator
    await supabaseService.from('notifications').insert({
      user_id: redemption.reward.creator_id,
      type: 'asset_download',
      title: 'Digital Asset Downloaded',
      message: `A fan downloaded the digital asset for "${redemption.reward.title}"`,
      data: {
        redemption_id: redemptionId,
        fan_id: user.id,
        asset_key: redemption.reward.digital_asset_key
      },
      priority: 'normal'
    });

    return new Response(JSON.stringify({
      success: true,
      downloadUrl: preSignedUrl,
      expiresAt: expiresAt.toISOString(),
      assetName: redemption.reward.digital_asset_key.split('/').pop() || 'download'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-secure-asset-url:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});