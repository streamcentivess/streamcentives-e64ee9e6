import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    const { rewardData, userId } = await req.json();
    
    // Get user authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    console.log('Calculating rarity for reward:', { title: rewardData.title, quantity: rewardData.quantity_available });

    // Get platform-wide statistics
    const [totalRewardsQuery, similarRewardsQuery, creatorStatsQuery] = await Promise.all([
      supabaseClient
        .from('rewards')
        .select('quantity_available', { count: 'exact' })
        .eq('is_active', true),
      
      supabaseClient
        .from('rewards')
        .select('quantity_available, rarity')
        .eq('type', rewardData.type)
        .eq('is_active', true),
        
      supabaseClient
        .from('rewards')
        .select('quantity_available, rarity')
        .eq('creator_id', user.id)
        .eq('is_active', true)
    ]);

    const totalRewards = totalRewardsQuery.data?.length || 0;
    const similarRewards = similarRewardsQuery.data || [];
    const creatorRewards = creatorStatsQuery.data || [];

    // Calculate rarity based on availability and market data
    const quantity = parseInt(rewardData.quantity_available);
    let rarity = 'common';
    let rarityScore = 0;

    // Base rarity calculation on quantity
    if (quantity === 1) {
      rarity = 'legendary';
      rarityScore = 95;
    } else if (quantity <= 5) {
      rarity = 'epic';
      rarityScore = 80;
    } else if (quantity <= 25) {
      rarity = 'rare';
      rarityScore = 60;
    } else if (quantity <= 100) {
      rarity = 'uncommon';
      rarityScore = 40;
    } else {
      rarity = 'common';
      rarityScore = 20;
    }

    // Adjust based on market data
    const avgQuantityInCategory = similarRewards.reduce((sum, r) => sum + r.quantity_available, 0) / similarRewards.length || 100;
    const marketScarcityMultiplier = Math.max(0.5, Math.min(2.0, avgQuantityInCategory / quantity));
    rarityScore = Math.min(100, rarityScore * marketScarcityMultiplier);

    // Use AI for enhanced rarity analysis if OpenAI is available
    let aiEnhancedRarity = rarity;
    if (openAIApiKey) {
      try {
        const aiPrompt = `
Analyze this reward's rarity based on the following data:
- Title: ${rewardData.title}
- Type: ${rewardData.type}
- Quantity Available: ${quantity}
- Description: ${rewardData.description || 'No description'}
- Price: ${rewardData.cash_price ? `$${rewardData.cash_price}` : 'No cash price'} ${rewardData.xp_cost ? `${rewardData.xp_cost} XP` : ''}

Market Context:
- Total platform rewards: ${totalRewards}
- Similar rewards in category: ${similarRewards.length}
- Average quantity in category: ${Math.round(avgQuantityInCategory)}
- Creator's total rewards: ${creatorRewards.length}

Current calculated rarity: ${rarity} (score: ${Math.round(rarityScore)})

Based on exclusivity, demand potential, and market context, what should the rarity be?
Respond with only one word: legendary, epic, rare, uncommon, or common
`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            messages: [
              { role: 'system', content: 'You are a marketplace rarity expert. Analyze reward data and suggest appropriate rarity levels.' },
              { role: 'user', content: aiPrompt }
            ],
            max_completion_tokens: 10,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiRarity = aiData.choices[0].message.content.trim().toLowerCase();
          
          if (['legendary', 'epic', 'rare', 'uncommon', 'common'].includes(aiRarity)) {
            aiEnhancedRarity = aiRarity;
            console.log('AI enhanced rarity:', aiRarity);
          }
        }
      } catch (error) {
        console.log('AI rarity enhancement failed, using calculated rarity:', error);
      }
    }

    // Calculate market insights
    const rarityDistribution = {
      legendary: similarRewards.filter(r => r.rarity === 'legendary').length,
      epic: similarRewards.filter(r => r.rarity === 'epic').length,
      rare: similarRewards.filter(r => r.rarity === 'rare').length,
      uncommon: similarRewards.filter(r => r.rarity === 'uncommon').length,
      common: similarRewards.filter(r => r.rarity === 'common').length,
    };

    const marketInsights = {
      suggestedRarity: aiEnhancedRarity,
      rarityScore: Math.round(rarityScore),
      marketPosition: quantity < avgQuantityInCategory ? 'scarce' : quantity > avgQuantityInCategory * 2 ? 'abundant' : 'balanced',
      categoryStats: {
        totalInCategory: similarRewards.length,
        averageQuantity: Math.round(avgQuantityInCategory),
        rarityDistribution
      },
      recommendations: generateRecommendations(aiEnhancedRarity, quantity, rewardData, avgQuantityInCategory)
    };

    return new Response(JSON.stringify({
      success: true,
      rarity: aiEnhancedRarity,
      insights: marketInsights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calculating rarity:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateRecommendations(rarity: string, quantity: number, rewardData: any, avgQuantity: number): string[] {
  const recommendations = [];
  
  if (quantity > avgQuantity * 2) {
    recommendations.push('Consider reducing quantity to increase rarity and demand');
  }
  
  if (!rewardData.cash_price && !rewardData.xp_cost) {
    recommendations.push('Add pricing to enable marketplace trading');
  }
  
  if (rarity === 'legendary' && quantity > 1) {
    recommendations.push('Legendary items work best as unique (quantity: 1)');
  }
  
  if (rarity === 'common' && quantity < 50) {
    recommendations.push('Consider increasing quantity for common items to meet demand');
  }
  
  if (!rewardData.description) {
    recommendations.push('Add a detailed description to increase perceived value');
  }
  
  return recommendations;
}