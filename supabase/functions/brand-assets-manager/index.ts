import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user.user) {
      throw new Error('Unauthorized');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'upload':
        // First, upload file to storage
        const fileBuffer = new Uint8Array(payload.file_data);
        const fileName = `${user.user.id}/${Date.now()}-${payload.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, fileBuffer, {
            contentType: payload.mime_type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(fileName);

        // Save asset metadata to database
        const { data: newAsset, error: assetError } = await supabase
          .from('brand_assets')
          .insert({
            creator_id: user.user.id,
            name: payload.asset_name,
            asset_type: payload.asset_type,
            file_url: urlData.publicUrl,
            file_size: payload.file_size,
            mime_type: payload.mime_type,
            is_primary: payload.is_primary || false,
            metadata: payload.metadata || {}
          })
          .select()
          .single();

        if (assetError) throw assetError;

        // If this is set as primary, update other assets to not be primary
        if (payload.is_primary) {
          await supabase
            .from('brand_assets')
            .update({ is_primary: false })
            .eq('creator_id', user.user.id)
            .eq('asset_type', payload.asset_type)
            .neq('id', newAsset.id);
        }

        return new Response(JSON.stringify(newAsset), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'list':
        const { data: assets, error: listError } = await supabase
          .from('brand_assets')
          .select('*')
          .eq('creator_id', user.user.id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (listError) throw listError;
        return new Response(JSON.stringify(assets), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update':
        const { data: updatedAsset, error: updateError } = await supabase
          .from('brand_assets')
          .update({
            name: payload.name,
            asset_type: payload.asset_type,
            is_primary: payload.is_primary,
            metadata: payload.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', payload.id)
          .eq('creator_id', user.user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // If this is set as primary, update other assets to not be primary
        if (payload.is_primary) {
          await supabase
            .from('brand_assets')
            .update({ is_primary: false })
            .eq('creator_id', user.user.id)
            .eq('asset_type', payload.asset_type)
            .neq('id', payload.id);
        }

        return new Response(JSON.stringify(updatedAsset), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'delete':
        // First get the asset to get the file path
        const { data: asset, error: getAssetError } = await supabase
          .from('brand_assets')
          .select('file_url')
          .eq('id', payload.id)
          .eq('creator_id', user.user.id)
          .single();

        if (getAssetError) throw getAssetError;

        // Delete from storage
        const filePath = asset.file_url.split('/brand-assets/')[1];
        await supabase.storage
          .from('brand-assets')
          .remove([filePath]);

        // Delete from database
        const { error: deleteError } = await supabase
          .from('brand_assets')
          .delete()
          .eq('id', payload.id)
          .eq('creator_id', user.user.id);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in brand-assets-manager function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});