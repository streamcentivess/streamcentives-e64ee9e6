export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_generated_content: {
        Row: {
          boost_applied: boolean | null
          boost_expires_at: string | null
          boost_multiplier: number | null
          content: string
          created_at: string | null
          download_url: string | null
          engagement_tip: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          metadata: Json | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
          viral_potential: number | null
        }
        Insert: {
          boost_applied?: boolean | null
          boost_expires_at?: string | null
          boost_multiplier?: number | null
          content: string
          created_at?: string | null
          download_url?: string | null
          engagement_tip?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          viral_potential?: number | null
        }
        Update: {
          boost_applied?: boolean | null
          boost_expires_at?: string | null
          boost_multiplier?: number | null
          content?: string
          created_at?: string | null
          download_url?: string | null
          engagement_tip?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          viral_potential?: number | null
        }
        Relationships: []
      }
      ai_tool_subscriptions: {
        Row: {
          created_at: string
          id: string
          monthly_price_cents: number
          plan_type: string
          status: string | null
          stripe_subscription_id: string | null
          tool_name: string
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_price_cents: number
          plan_type: string
          status?: string | null
          stripe_subscription_id?: string | null
          tool_name: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_price_cents?: number
          plan_type?: string
          status?: string | null
          stripe_subscription_id?: string | null
          tool_name?: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          automation_rule_id: string
          error_message: string | null
          executed_at: string
          execution_results: Json
          id: string
          status: string
          trigger_data: Json
        }
        Insert: {
          automation_rule_id: string
          error_message?: string | null
          executed_at?: string
          execution_results?: Json
          id?: string
          status?: string
          trigger_data: Json
        }
        Update: {
          automation_rule_id?: string
          error_message?: string | null
          executed_at?: string
          execution_results?: Json
          id?: string
          status?: string
          trigger_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          id: string
          is_active: boolean
          rule_name: string
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          rule_name: string
          trigger_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          rule_name?: string
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_assets: {
        Row: {
          asset_data: Json
          asset_type: string
          campaign_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          asset_data: Json
          asset_type: string
          campaign_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          asset_data?: Json
          asset_type?: string
          campaign_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_boosts: {
        Row: {
          boost_amount: number
          boost_duration_hours: number
          boost_type: string
          campaign_id: string
          created_at: string | null
          creator_id: string
          expires_at: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          boost_amount?: number
          boost_duration_hours?: number
          boost_type?: string
          campaign_id: string
          created_at?: string | null
          creator_id: string
          expires_at: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          boost_amount?: number
          boost_duration_hours?: number
          boost_type?: string
          campaign_id?: string
          created_at?: string | null
          creator_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_boosts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "boosted_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_boosts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_interactions: {
        Row: {
          campaign_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          interaction_data: Json | null
          interaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_merchandise: {
        Row: {
          campaign_id: string
          created_at: string
          creator_id: string
          currency: string
          discount_code: string | null
          external_product_url: string | null
          id: string
          is_active: boolean
          price_cents: number
          product_description: string | null
          product_image_url: string | null
          product_name: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          creator_id: string
          currency?: string
          discount_code?: string | null
          external_product_url?: string | null
          id?: string
          is_active?: boolean
          price_cents: number
          product_description?: string | null
          product_image_url?: string | null
          product_name: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          creator_id?: string
          currency?: string
          discount_code?: string | null
          external_product_url?: string | null
          id?: string
          is_active?: boolean
          price_cents?: number
          product_description?: string | null
          product_image_url?: string | null
          product_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_merchandise_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "boosted_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_merchandise_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          campaign_id: string
          cash_earned: number | null
          completion_date: string | null
          created_at: string
          id: string
          joined_at: string
          notes: string | null
          progress: number | null
          status: string
          updated_at: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          campaign_id: string
          cash_earned?: number | null
          completion_date?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          notes?: string | null
          progress?: number | null
          status?: string
          updated_at?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          campaign_id?: string
          cash_earned?: number | null
          completion_date?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          notes?: string | null
          progress?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "boosted_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_purchases: {
        Row: {
          amount_paid_cents: number
          campaign_id: string
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          merchandise_id: string
          proof_of_purchase_url: string | null
          purchase_status: string
          purchased_at: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          amount_paid_cents: number
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchandise_id: string
          proof_of_purchase_url?: string | null
          purchase_status?: string
          purchased_at?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          amount_paid_cents?: number
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchandise_id?: string
          proof_of_purchase_url?: string | null
          purchase_status?: string
          purchased_at?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_purchases_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "boosted_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_purchases_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_purchases_merchandise_id_fkey"
            columns: ["merchandise_id"]
            isOneToOne: false
            referencedRelation: "campaign_merchandise"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_share_settings: {
        Row: {
          campaign_id: string
          created_at: string
          creator_id: string
          id: string
          is_shareable: boolean
          off_platform_xp: number
          on_platform_xp: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          creator_id: string
          id?: string
          is_shareable?: boolean
          off_platform_xp?: number
          on_platform_xp?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          is_shareable?: boolean
          off_platform_xp?: number
          on_platform_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          boost_expires_at: string | null
          boost_multiplier: number | null
          boost_score: number | null
          cash_reward: number | null
          created_at: string
          creator_id: string
          current_progress: number | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_boosted: boolean | null
          is_featured: boolean | null
          max_participants: number | null
          required_listen_duration_seconds: number | null
          requirements: string | null
          spotify_artist_id: string | null
          spotify_artist_url: string | null
          start_date: string
          status: string
          tags: string[] | null
          target_metric: string | null
          target_value: number | null
          title: string
          type: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          boost_expires_at?: string | null
          boost_multiplier?: number | null
          boost_score?: number | null
          cash_reward?: number | null
          created_at?: string
          creator_id: string
          current_progress?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_boosted?: boolean | null
          is_featured?: boolean | null
          max_participants?: number | null
          required_listen_duration_seconds?: number | null
          requirements?: string | null
          spotify_artist_id?: string | null
          spotify_artist_url?: string | null
          start_date: string
          status?: string
          tags?: string[] | null
          target_metric?: string | null
          target_value?: number | null
          title: string
          type: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          boost_expires_at?: string | null
          boost_multiplier?: number | null
          boost_score?: number | null
          cash_reward?: number | null
          created_at?: string
          creator_id?: string
          current_progress?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_boosted?: boolean | null
          is_featured?: boolean | null
          max_participants?: number | null
          required_listen_duration_seconds?: number | null
          requirements?: string | null
          spotify_artist_id?: string | null
          spotify_artist_url?: string | null
          start_date?: string
          status?: string
          tags?: string[] | null
          target_metric?: string | null
          target_value?: number | null
          title?: string
          type?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      content_boosts: {
        Row: {
          boost_multiplier: number
          boost_type: string
          content_id: string
          content_type: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          boost_multiplier?: number
          boost_type?: string
          content_id: string
          content_type: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          boost_multiplier?: number
          boost_type?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          earnings_type: string
          fee_breakdown: Json | null
          id: string
          net_amount_cents: number | null
          payout_method: string | null
          payout_reference: string | null
          payout_status: string | null
          source_transaction_id: string | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          earnings_type: string
          fee_breakdown?: Json | null
          id?: string
          net_amount_cents?: number | null
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          source_transaction_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          earnings_type?: string
          fee_breakdown?: Json | null
          id?: string
          net_amount_cents?: number | null
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          source_transaction_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_fan_leaderboards: {
        Row: {
          created_at: string
          creator_user_id: string
          fan_user_id: string
          id: string
          last_activity_at: string | null
          rank_position: number | null
          total_listens: number
          total_xp_earned: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_user_id: string
          fan_user_id: string
          id?: string
          last_activity_at?: string | null
          rank_position?: number | null
          total_listens?: number
          total_xp_earned?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string
          fan_user_id?: string
          id?: string
          last_activity_at?: string | null
          rank_position?: number | null
          total_listens?: number
          total_xp_earned?: number
          updated_at?: string
        }
        Relationships: []
      }
      creator_payout_requests: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          fee_cents: number
          id: string
          net_amount_cents: number
          payout_details: Json
          payout_method: string
          processed_at: string | null
          requested_at: string
          status: string
          stripe_payout_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          fee_cents: number
          id?: string
          net_amount_cents: number
          payout_details: Json
          payout_method: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          fee_cents?: number
          id?: string
          net_amount_cents?: number
          payout_details?: Json
          payout_method?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      instant_redemptions: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          is_processed: boolean | null
          processed_at: string | null
          redemption_data: Json | null
          redemption_id: string | null
          redemption_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          redemption_data?: Json | null
          redemption_id?: string | null
          redemption_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          redemption_data?: Json | null
          redemption_id?: string | null
          redemption_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instant_redemptions_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          asking_price_cents: number
          asking_price_xp: number | null
          buyer_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_sold: boolean | null
          reward_redemption_id: string
          seller_id: string
          sold_at: string | null
          updated_at: string
        }
        Insert: {
          asking_price_cents: number
          asking_price_xp?: number | null
          buyer_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_sold?: boolean | null
          reward_redemption_id: string
          seller_id: string
          sold_at?: string | null
          updated_at?: string
        }
        Update: {
          asking_price_cents?: number
          asking_price_xp?: number | null
          buyer_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_sold?: boolean | null
          reward_redemption_id?: string
          seller_id?: string
          sold_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_reward_redemption_id_fkey"
            columns: ["reward_redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transactions: {
        Row: {
          buyer_fee_cents: number
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          creator_royalty_cents: number
          id: string
          listing_id: string | null
          net_seller_amount_cents: number
          payment_method: string
          seller_fee_cents: number
          seller_id: string
          status: string | null
          streamcentives_fee_cents: number
          total_amount_cents: number
          updated_at: string | null
        }
        Insert: {
          buyer_fee_cents?: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          creator_royalty_cents?: number
          id?: string
          listing_id?: string | null
          net_seller_amount_cents?: number
          payment_method?: string
          seller_fee_cents?: number
          seller_id: string
          status?: string | null
          streamcentives_fee_cents?: number
          total_amount_cents: number
          updated_at?: string | null
        }
        Update: {
          buyer_fee_cents?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          creator_royalty_cents?: number
          id?: string
          listing_id?: string | null
          net_seller_amount_cents?: number
          payment_method?: string
          seller_fee_cents?: number
          seller_id?: string
          status?: string | null
          streamcentives_fee_cents?: number
          total_amount_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      message_analysis: {
        Row: {
          analyzed_at: string
          confidence: number | null
          created_at: string
          flags: string[] | null
          id: string
          is_appropriate: boolean
          message_id: string
          severity: string | null
        }
        Insert: {
          analyzed_at?: string
          confidence?: number | null
          created_at?: string
          flags?: string[] | null
          id?: string
          is_appropriate?: boolean
          message_id: string
          severity?: string | null
        }
        Update: {
          analyzed_at?: string
          confidence?: number | null
          created_at?: string
          flags?: string[] | null
          id?: string
          is_appropriate?: boolean
          message_id?: string
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_analysis_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_costs: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          is_accepting_messages: boolean
          updated_at: string
          xp_cost: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          is_accepting_messages?: boolean
          updated_at?: string
          xp_cost?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          is_accepting_messages?: boolean
          updated_at?: string
          xp_cost?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          analysis_status: string | null
          approved_at: string | null
          content: string
          conversation_id: string | null
          created_at: string
          denied_at: string | null
          flagged_content: boolean
          flagged_reason: string | null
          id: string
          parent_message_id: string | null
          recipient_id: string
          sender_id: string
          sentiment_score: number | null
          status: string
          updated_at: string
          xp_cost: number
        }
        Insert: {
          analysis_status?: string | null
          approved_at?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string
          denied_at?: string | null
          flagged_content?: boolean
          flagged_reason?: string | null
          id?: string
          parent_message_id?: string | null
          recipient_id: string
          sender_id: string
          sentiment_score?: number | null
          status?: string
          updated_at?: string
          xp_cost?: number
        }
        Update: {
          analysis_status?: string | null
          approved_at?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          denied_at?: string | null
          flagged_content?: boolean
          flagged_reason?: string | null
          id?: string
          parent_message_id?: string | null
          recipient_id?: string
          sender_id?: string
          sentiment_score?: number | null
          status?: string
          updated_at?: string
          xp_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          discord_webhook_url: string | null
          email_enabled: boolean
          id: string
          phone_number: string | null
          push_enabled: boolean
          slack_webhook_url: string | null
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discord_webhook_url?: string | null
          email_enabled?: boolean
          id?: string
          phone_number?: string | null
          push_enabled?: boolean
          slack_webhook_url?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discord_webhook_url?: string | null
          email_enabled?: boolean
          id?: string
          phone_number?: string | null
          push_enabled?: boolean
          slack_webhook_url?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          poll_option: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          poll_option: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          poll_option?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_share_settings: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          is_shareable: boolean
          off_platform_xp: number
          on_platform_xp: number
          post_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          is_shareable?: boolean
          off_platform_xp?: number
          on_platform_xp?: number
          post_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          is_shareable?: boolean
          off_platform_xp?: number
          on_platform_xp?: number
          post_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_shares: {
        Row: {
          created_at: string
          creator_id: string
          fan_id: string
          id: string
          platform: string | null
          post_id: string
          share_date: string
          share_type: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          fan_id: string
          id?: string
          platform?: string | null
          post_id: string
          share_date?: string
          share_type: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          fan_id?: string
          id?: string
          platform?: string | null
          post_id?: string
          share_date?: string
          share_type?: string
          xp_earned?: number
        }
        Relationships: []
      }
      posts: {
        Row: {
          boost_expires_at: string | null
          boost_multiplier: number | null
          boost_type: string | null
          caption: string | null
          carousel_urls: string[] | null
          content_type: string
          content_url: string
          created_at: string
          id: string
          is_boosted: boolean | null
          is_community_post: boolean | null
          is_cross_posted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_expires_at?: string | null
          boost_multiplier?: number | null
          boost_type?: string | null
          caption?: string | null
          carousel_urls?: string[] | null
          content_type: string
          content_url: string
          created_at?: string
          id?: string
          is_boosted?: boolean | null
          is_community_post?: boolean | null
          is_cross_posted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_expires_at?: string | null
          boost_multiplier?: number | null
          boost_type?: string | null
          caption?: string | null
          carousel_urls?: string[] | null
          content_type?: string
          content_url?: string
          created_at?: string
          id?: string
          is_boosted?: boolean | null
          is_community_post?: boolean | null
          is_cross_posted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          interests: string | null
          last_boost_at: string | null
          location: string | null
          merch_store_connected: boolean | null
          merch_store_connected_at: string | null
          merch_store_platform: string | null
          merch_store_url: string | null
          profile_boost_score: number | null
          spotify_connected: boolean | null
          total_boosts_received: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          interests?: string | null
          last_boost_at?: string | null
          location?: string | null
          merch_store_connected?: boolean | null
          merch_store_connected_at?: string | null
          merch_store_platform?: string | null
          merch_store_url?: string | null
          profile_boost_score?: number | null
          spotify_connected?: boolean | null
          total_boosts_received?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          interests?: string | null
          last_boost_at?: string | null
          location?: string | null
          merch_store_connected?: boolean | null
          merch_store_connected_at?: string | null
          merch_store_platform?: string | null
          merch_store_url?: string | null
          profile_boost_score?: number | null
          spotify_connected?: boolean | null
          total_boosts_received?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          percentage: number
          setting_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          percentage: number
          setting_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          percentage?: number
          setting_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenue_transactions: {
        Row: {
          amount_total_cents: number
          created_at: string
          creator_id: string | null
          currency: string | null
          id: string
          net_amount_cents: number
          status: string | null
          streamcentives_fee_cents: number
          stripe_session_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total_cents: number
          created_at?: string
          creator_id?: string | null
          currency?: string | null
          id?: string
          net_amount_cents: number
          status?: string | null
          streamcentives_fee_cents: number
          stripe_session_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total_cents?: number
          created_at?: string
          creator_id?: string | null
          currency?: string | null
          id?: string
          net_amount_cents?: number
          status?: string | null
          streamcentives_fee_cents?: number
          stripe_session_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reward_redemption_codes: {
        Row: {
          created_at: string
          id: string
          is_redeemed: boolean | null
          location_redeemed: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_code: string
          redemption_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_redeemed?: boolean | null
          location_redeemed?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_code: string
          redemption_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_redeemed?: boolean | null
          location_redeemed?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_code?: string
          redemption_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemption_codes_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          amount_paid: number | null
          created_at: string
          id: string
          payment_method: string
          reward_id: string
          status: string
          updated_at: string
          user_id: string
          xp_spent: number | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          id?: string
          payment_method: string
          reward_id: string
          status?: string
          updated_at?: string
          user_id: string
          xp_spent?: number | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          id?: string
          payment_method?: string
          reward_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          xp_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_share_settings: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          is_shareable: boolean
          off_platform_xp: number
          on_platform_xp: number
          reward_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          is_shareable?: boolean
          off_platform_xp?: number
          on_platform_xp?: number
          reward_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          is_shareable?: boolean
          off_platform_xp?: number
          on_platform_xp?: number
          reward_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          cash_price: number | null
          cover_photo_url: string | null
          created_at: string
          creator_id: string
          creator_xp_only: boolean | null
          currency: string | null
          delivery_metadata: Json | null
          delivery_type: string | null
          description: string | null
          external_url: string | null
          id: string
          image_url: string | null
          instant_delivery: boolean | null
          is_active: boolean
          quantity_available: number
          quantity_redeemed: number
          rarity: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          xp_cost: number | null
        }
        Insert: {
          cash_price?: number | null
          cover_photo_url?: string | null
          created_at?: string
          creator_id: string
          creator_xp_only?: boolean | null
          currency?: string | null
          delivery_metadata?: Json | null
          delivery_type?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          instant_delivery?: boolean | null
          is_active?: boolean
          quantity_available?: number
          quantity_redeemed?: number
          rarity?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          xp_cost?: number | null
        }
        Update: {
          cash_price?: number | null
          cover_photo_url?: string | null
          created_at?: string
          creator_id?: string
          creator_xp_only?: boolean | null
          currency?: string | null
          delivery_metadata?: Json | null
          delivery_type?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          instant_delivery?: boolean | null
          is_active?: boolean
          quantity_available?: number
          quantity_redeemed?: number
          rarity?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          xp_cost?: number | null
        }
        Relationships: []
      }
      share_activities: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          platform: string
          share_date: string
          share_url: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          platform: string
          share_date?: string
          share_url: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          platform?: string
          share_date?: string
          share_url?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      shoutouts: {
        Row: {
          achievement_text: string
          achievements_data: Json | null
          created_at: string
          creator_id: string
          fan_display_name: string
          fan_id: string
          fan_username: string | null
          id: string
          is_read: boolean
          is_sent: boolean
          read_at: string | null
          reward_data: Json | null
          reward_id: string | null
          sent_at: string | null
          shoutout_text: string
          tone: string
          updated_at: string
        }
        Insert: {
          achievement_text: string
          achievements_data?: Json | null
          created_at?: string
          creator_id: string
          fan_display_name: string
          fan_id: string
          fan_username?: string | null
          id?: string
          is_read?: boolean
          is_sent?: boolean
          read_at?: string | null
          reward_data?: Json | null
          reward_id?: string | null
          sent_at?: string | null
          shoutout_text: string
          tone?: string
          updated_at?: string
        }
        Update: {
          achievement_text?: string
          achievements_data?: Json | null
          created_at?: string
          creator_id?: string
          fan_display_name?: string
          fan_id?: string
          fan_username?: string | null
          id?: string
          is_read?: boolean
          is_sent?: boolean
          read_at?: string | null
          reward_data?: Json | null
          reward_id?: string | null
          sent_at?: string | null
          shoutout_text?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_media_credentials: {
        Row: {
          access_token: string | null
          access_token_secret: string | null
          api_key: string | null
          api_secret: string | null
          created_at: string
          expires_at: string | null
          id: string
          instagram_user_id: string | null
          is_active: boolean
          page_id: string | null
          platform: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          access_token_secret?: string | null
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          instagram_user_id?: string | null
          is_active?: boolean
          page_id?: string | null
          platform: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          access_token_secret?: string | null
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          instagram_user_id?: string | null
          is_active?: boolean
          page_id?: string | null
          platform?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          content: string
          created_at: string
          engagement_metrics: Json | null
          id: string
          platform: string
          post_id: string
          post_url: string | null
          posted_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          platform: string
          post_id: string
          post_url?: string | null
          posted_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          platform?: string
          post_id?: string
          post_url?: string | null
          posted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spotify_accounts: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          scope: string | null
          spotify_user_id: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          scope?: string | null
          spotify_user_id: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          spotify_user_id?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spotify_listens: {
        Row: {
          artist_name: string | null
          created_at: string
          creator_user_id: string
          duration_ms: number | null
          fan_user_id: string
          id: string
          listened_at: string
          progress_ms: number | null
          track_id: string
          track_name: string | null
        }
        Insert: {
          artist_name?: string | null
          created_at?: string
          creator_user_id: string
          duration_ms?: number | null
          fan_user_id: string
          id?: string
          listened_at?: string
          progress_ms?: number | null
          track_id: string
          track_name?: string | null
        }
        Update: {
          artist_name?: string | null
          created_at?: string
          creator_user_id?: string
          duration_ms?: number | null
          fan_user_id?: string
          id?: string
          listened_at?: string
          progress_ms?: number | null
          track_id?: string
          track_name?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_haters: {
        Row: {
          created_at: string
          hater_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hater_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hater_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_supporters: {
        Row: {
          created_at: string
          id: string
          supporter_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supporter_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supporter_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp_balances: {
        Row: {
          created_at: string
          current_xp: number
          id: string
          total_earned_xp: number
          total_spent_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_xp?: number
          id?: string
          total_earned_xp?: number
          total_spent_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_xp?: number
          id?: string
          total_earned_xp?: number
          total_spent_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp_detailed_balances: {
        Row: {
          created_at: string
          creator_id: string | null
          current_xp: number
          id: string
          total_earned_xp: number
          total_spent_xp: number
          updated_at: string
          user_id: string
          xp_type: Database["public"]["Enums"]["xp_type"]
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          current_xp?: number
          id?: string
          total_earned_xp?: number
          total_spent_xp?: number
          updated_at?: string
          user_id: string
          xp_type: Database["public"]["Enums"]["xp_type"]
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          current_xp?: number
          id?: string
          total_earned_xp?: number
          total_spent_xp?: number
          updated_at?: string
          user_id?: string
          xp_type?: Database["public"]["Enums"]["xp_type"]
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          delivered_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_subscription_id: string
        }
        Insert: {
          delivered_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_subscription_id: string
        }
        Update: {
          delivered_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_subscription_id_fkey"
            columns: ["webhook_subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          secret_key: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          secret_key?: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          secret_key?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      xp_purchase_transactions: {
        Row: {
          created_at: string
          creator_id: string | null
          creator_share_cents: number | null
          id: string
          payment_amount_cents: number
          status: string
          streamcentives_fee_cents: number
          stripe_payment_intent_id: string | null
          user_id: string
          xp_amount: number
          xp_type: Database["public"]["Enums"]["xp_type"]
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          creator_share_cents?: number | null
          id?: string
          payment_amount_cents: number
          status?: string
          streamcentives_fee_cents: number
          stripe_payment_intent_id?: string | null
          user_id: string
          xp_amount: number
          xp_type?: Database["public"]["Enums"]["xp_type"]
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          creator_share_cents?: number | null
          id?: string
          payment_amount_cents?: number
          status?: string
          streamcentives_fee_cents?: number
          stripe_payment_intent_id?: string | null
          user_id?: string
          xp_amount?: number
          xp_type?: Database["public"]["Enums"]["xp_type"]
        }
        Relationships: []
      }
      xp_purchases: {
        Row: {
          amount_paid_cents: number
          created_at: string
          currency: string
          id: string
          purchase_date: string
          stripe_price_id: string
          stripe_session_id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          amount_paid_cents: number
          created_at?: string
          currency?: string
          id?: string
          purchase_date?: string
          stripe_price_id: string
          stripe_session_id: string
          user_id: string
          xp_amount: number
        }
        Update: {
          amount_paid_cents?: number
          created_at?: string
          currency?: string
          id?: string
          purchase_date?: string
          stripe_price_id?: string
          stripe_session_id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      boosted_campaigns: {
        Row: {
          boost_amount: number | null
          boost_expires: string | null
          boost_expires_at: string | null
          boost_multiplier: number | null
          boost_score: number | null
          cash_reward: number | null
          created_at: string | null
          creator_id: string | null
          current_progress: number | null
          currently_boosted: boolean | null
          description: string | null
          end_date: string | null
          id: string | null
          image_url: string | null
          is_boosted: boolean | null
          is_featured: boolean | null
          max_participants: number | null
          required_listen_duration_seconds: number | null
          requirements: string | null
          spotify_artist_id: string | null
          spotify_artist_url: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          target_metric: string | null
          target_value: number | null
          title: string | null
          type: string | null
          updated_at: string | null
          visibility_score: number | null
          xp_reward: number | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          display_name: string | null
          interests: string | null
          location: string | null
          merch_store_connected: boolean | null
          merch_store_url: string | null
          spotify_connected: boolean | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          display_name?: string | null
          interests?: string | null
          location?: string | null
          merch_store_connected?: boolean | null
          merch_store_url?: string | null
          spotify_connected?: boolean | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          display_name?: string | null
          interests?: string | null
          location?: string | null
          merch_store_connected?: boolean | null
          merch_store_url?: string | null
          spotify_connected?: boolean | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_follow_stats: {
        Row: {
          followers_count: number | null
          following_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_creator_pro_boost: {
        Args: { campaign_id_param: string; creator_id_param: string }
        Returns: Json
      }
      calculate_campaign_visibility_score: {
        Args: { campaign_id_param: string }
        Returns: number
      }
      complete_campaign_interaction: {
        Args: { campaign_id_param: string; interaction_data_param?: Json }
        Returns: Json
      }
      enhanced_redeem_reward: {
        Args: {
          amount_paid_param?: number
          payment_method_param: string
          reward_id_param: string
          user_id_param: string
          xp_spent_param?: number
          xp_type_param?: Database["public"]["Enums"]["xp_type"]
        }
        Returns: Json
      }
      generate_redemption_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_campaign_stats: {
        Args: { campaign_id_param: string }
        Returns: {
          average_progress: number
          completed_count: number
          participant_count: number
          total_cash_distributed: number
          total_xp_distributed: number
        }[]
      }
      get_public_profile_data: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          country_name: string
          created_at: string
          display_name: string
          merch_store_connected: boolean
          spotify_connected: boolean
          user_id: string
          username: string
        }[]
      }
      handle_post_share: {
        Args: {
          platform_param?: string
          post_id_param: string
          share_type_param: string
        }
        Returns: Json
      }
      handle_universal_share: {
        Args: {
          content_id_param: string
          content_type_param: string
          platform_param: string
          share_url_param: string
        }
        Returns: Json
      }
      handle_xp_purchase: {
        Args: { user_id_param: string; xp_amount_param: number }
        Returns: undefined
      }
      handle_xp_purchase_with_revenue_sharing: {
        Args: {
          creator_id_param?: string
          payment_amount_cents_param: number
          user_id_param: string
          xp_amount_param: number
          xp_type_param?: Database["public"]["Enums"]["xp_type"]
        }
        Returns: Json
      }
      process_marketplace_transaction: {
        Args: {
          amount_param: number
          buyer_id_param: string
          listing_id_param: string
          payment_method_param: string
        }
        Returns: Json
      }
      purchase_reward_with_revenue_sharing: {
        Args: {
          payment_method_param: string
          reward_id_param: string
          total_amount_cents_param: number
        }
        Returns: Json
      }
      redeem_reward: {
        Args: {
          amount_paid_param?: number
          payment_method_param: string
          reward_id_param: string
          xp_spent_param?: number
        }
        Returns: string
      }
      send_message_with_xp: {
        Args: {
          content_param: string
          recipient_id_param: string
          xp_cost_param: number
        }
        Returns: string
      }
      update_message_status: {
        Args: { message_id_param: string; new_status_param: string }
        Returns: boolean
      }
    }
    Enums: {
      xp_type: "platform" | "creator_specific" | "transferable"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      xp_type: ["platform", "creator_specific", "transferable"],
    },
  },
} as const
