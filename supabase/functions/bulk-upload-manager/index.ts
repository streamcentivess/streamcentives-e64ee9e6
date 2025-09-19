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
      case 'create_job':
        const { data: newJob, error: jobError } = await supabase
          .from('bulk_upload_jobs')
          .insert({
            creator_id: user.user.id,
            job_name: payload.job_name,
            total_files: payload.total_files,
            tags: payload.tags || [],
            category: payload.category,
            metadata: payload.metadata || {}
          })
          .select()
          .single();

        if (jobError) throw jobError;
        return new Response(JSON.stringify(newJob), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'process_file':
        try {
          // Upload file to storage
          const fileBuffer = new Uint8Array(payload.file_data);
          const fileName = `${user.user.id}/${payload.job_id}/${Date.now()}-${payload.original_name}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('content-assets')
            .upload(fileName, fileBuffer, {
              contentType: payload.mime_type,
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('content-assets')
            .getPublicUrl(fileName);

          // Update file record
          const { data: updatedFile, error: updateError } = await supabase
            .from('bulk_upload_files')
            .update({
              file_url: urlData.publicUrl,
              file_size: payload.file_size,
              mime_type: payload.mime_type,
              status: 'uploaded',
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.file_id)
            .eq('creator_id', user.user.id)
            .select()
            .single();

          if (updateError) throw updateError;

          // Update job progress
          await supabase
            .from('bulk_upload_jobs')
            .update({
              processed_files: supabase.sql`processed_files + 1`,
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.job_id)
            .eq('creator_id', user.user.id);

          return new Response(JSON.stringify(updatedFile), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (fileError) {
          // Mark file as failed
          await supabase
            .from('bulk_upload_files')
            .update({
              status: 'failed',
              error_message: fileError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.file_id)
            .eq('creator_id', user.user.id);

          // Update job failed count
          await supabase
            .from('bulk_upload_jobs')
            .update({
              failed_files: supabase.sql`failed_files + 1`,
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.job_id)
            .eq('creator_id', user.user.id);

          throw fileError;
        }

      case 'add_files':
        const files = payload.files.map((file: any) => ({
          job_id: payload.job_id,
          creator_id: user.user.id,
          original_name: file.name,
          mime_type: file.type,
          status: 'pending'
        }));

        const { data: newFiles, error: filesError } = await supabase
          .from('bulk_upload_files')
          .insert(files)
          .select();

        if (filesError) throw filesError;
        return new Response(JSON.stringify(newFiles), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_job':
        const { data: jobData, error: jobDataError } = await supabase
          .from('bulk_upload_jobs')
          .select(`
            *,
            files:bulk_upload_files(*)
          `)
          .eq('id', payload.job_id)
          .eq('creator_id', user.user.id)
          .single();

        if (jobDataError) throw jobDataError;
        return new Response(JSON.stringify(jobData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'list_jobs':
        const { data: jobs, error: jobsError } = await supabase
          .from('bulk_upload_jobs')
          .select('*')
          .eq('creator_id', user.user.id)
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;
        return new Response(JSON.stringify(jobs), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in bulk-upload-manager function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});