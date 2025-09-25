import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getErrorMessage } from '../_shared/error-utils.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExperienceUpdate {
  experienceId: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  verificationMethod?: 'qr_scan' | 'manual' | 'code_entry';
  verificationData?: any;
  locationData?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

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

    switch (req.method) {
      case 'GET':
        if (action === 'list') {
          // Get experiences for creator
          const { data: experiences, error: listError } = await supabaseService
            .from('experiences')
            .select(`
              *,
              reward_redemptions!inner(
                id,
                user_id,
                reward:rewards(
                  id,
                  title,
                  description,
                  creator_id
                )
              ),
              fan:profiles!experiences_fan_id_fkey(
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false });

          if (listError) {
            throw new Error('Failed to fetch experiences: ' + listError.message);
          }

          return new Response(JSON.stringify({
            success: true,
            experiences: experiences || []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (action === 'verify') {
          // Verify QR code or verification code
          const verificationCode = url.searchParams.get('code');
          if (!verificationCode) {
            throw new Error("Verification code required");
          }

          const { data: experience, error: verifyError } = await supabaseService
            .from('experiences')
            .select(`
              *,
              reward_redemptions!inner(
                reward:rewards(creator_id, title)
              )
            `)
            .eq('verification_code', verificationCode)
            .single();

          if (verifyError || !experience) {
            throw new Error("Invalid verification code");
          }

          // Check if user is the creator of the reward
          if (experience.reward_redemptions.reward.creator_id !== user.id) {
            throw new Error("Unauthorized: You can only verify your own experiences");
          }

          return new Response(JSON.stringify({
            success: true,
            experience: experience,
            canVerify: experience.status !== 'completed'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        break;

      case 'POST':
        if (action === 'update') {
          const updates: ExperienceUpdate = await req.json();
          
          if (!updates.experienceId) {
            throw new Error("Missing experienceId");
          }

          // Verify the experience belongs to the authenticated creator
          const { data: experience, error: verifyError } = await supabaseService
            .from('experiences')
            .select(`
              *,
              reward_redemptions!inner(
                reward:rewards(creator_id)
              )
            `)
            .eq('id', updates.experienceId)
            .single();

          if (verifyError || !experience) {
            throw new Error("Experience not found");
          }

          if (experience.reward_redemptions.reward.creator_id !== user.id) {
            throw new Error("Unauthorized: You can only update your own experiences");
          }

          // Prepare update data
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          if (updates.status) {
            updateData.status = updates.status;
          }

          // Update experience
          const { data: updatedExperience, error: updateError } = await supabaseService
            .from('experiences')
            .update(updateData)
            .eq('id', updates.experienceId)
            .select()
            .single();

          if (updateError) {
            throw new Error('Failed to update experience: ' + updateError.message);
          }

          // Log verification if completing
          if (updates.status === 'completed') {
            await supabaseService.from('experience_verifications').insert({
              experience_id: updates.experienceId,
              verified_by_user_id: user.id,
              verification_method: updates.verificationMethod || 'manual',
              verification_data: updates.verificationData || {},
              location_data: updates.locationData
            });

            // Send notification to fan
            await supabaseService.from('notifications').insert({
              user_id: experience.fan_id,
              type: 'experience_completed',
              title: 'Experience Completed',
              message: 'Your experience has been successfully verified and completed!',
              data: {
                experience_id: updates.experienceId,
                verification_method: updates.verificationMethod
              },
              priority: 'high'
            });
          }

          return new Response(JSON.stringify({
            success: true,
            experience: updatedExperience
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (action === 'generate-qr') {
          // Generate QR code for experience
          const { experienceId } = await req.json();
          
          if (!experienceId) {
            throw new Error("Missing experienceId");
          }

          // Generate QR code URL using a service or return the verification code
          const { data: experience } = await supabaseService
            .from('experiences')
            .select('verification_code')
            .eq('id', experienceId)
            .single();

          if (!experience) {
            throw new Error("Experience not found");
          }

          // In a real implementation, you'd use a QR code generation service
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(experience.verification_code)}`;
          
          // Update experience with QR code URL
          await supabaseService
            .from('experiences')
            .update({ qr_code_url: qrCodeUrl })
            .eq('id', experienceId);

          return new Response(JSON.stringify({
            success: true,
            qrCodeUrl: qrCodeUrl,
            verificationCode: experience.verification_code
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        break;

      default:
        throw new Error("Method not allowed");
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error('Error in manage-experiences:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});