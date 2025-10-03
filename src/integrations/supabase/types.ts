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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_controls: {
        Row: {
          action_data: Json | null
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      advanced_analytics: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          id: string
          metric_type: string
          metric_value: number
          organization_id: string | null
          recorded_at: string | null
          time_period: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metric_type: string
          metric_value: number
          organization_id?: string | null
          recorded_at?: string | null
          time_period: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metric_type?: string
          metric_value?: number
          organization_id?: string | null
          recorded_at?: string | null
          time_period?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advanced_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          commission_rate: number
          created_at: string | null
          creator_id: string
          id: string
          is_active: boolean | null
          product_url: string
          program_name: string
          total_clicks: number | null
          total_conversions: number | null
          total_earnings_cents: number | null
          tracking_code: string
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          creator_id: string
          id?: string
          is_active?: boolean | null
          product_url: string
          program_name: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings_cents?: number | null
          tracking_code: string
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          creator_id?: string
          id?: string
          is_active?: boolean | null
          product_url?: string
          program_name?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings_cents?: number | null
          tracking_code?: string
        }
        Relationships: []
      }
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
      ai_moderation_queue: {
        Row: {
          ai_confidence: number
          ai_flags: Json
          content_id: string
          content_type: string
          created_at: string | null
          final_decision: string | null
          human_review_needed: boolean | null
          id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
        }
        Insert: {
          ai_confidence: number
          ai_flags?: Json
          content_id: string
          content_type: string
          created_at?: string | null
          final_decision?: string | null
          human_review_needed?: boolean | null
          id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
        }
        Update: {
          ai_confidence?: number
          ai_flags?: Json
          content_id?: string
          content_type?: string
          created_at?: string | null
          final_decision?: string | null
          human_review_needed?: boolean | null
          id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
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
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          last_used_at: string | null
          permissions: Json
          rate_limit: number | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used_at?: string | null
          permissions?: Json
          rate_limit?: number | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used_at?: string | null
          permissions?: Json
          rate_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown | null
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown | null
          method: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      artist_initiation_quests: {
        Row: {
          bonus_xp_reward: number | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          quest_name: string
          total_xp_reward: number
          updated_at: string | null
        }
        Insert: {
          bonus_xp_reward?: number | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          quest_name: string
          total_xp_reward?: number
          updated_at?: string | null
        }
        Update: {
          bonus_xp_reward?: number | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          quest_name?: string
          total_xp_reward?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      auto_post_schedules: {
        Row: {
          content_id: string | null
          created_at: string | null
          creator_id: string
          error_message: string | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          platforms: string[]
          post_content: string
          posted_urls: Json | null
          scheduled_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          creator_id: string
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          platforms: string[]
          post_content: string
          posted_urls?: Json | null
          scheduled_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          creator_id?: string
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          platforms?: string[]
          post_content?: string
          posted_urls?: Json | null
          scheduled_time?: string
          status?: string | null
          updated_at?: string | null
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
      brand_assets: {
        Row: {
          asset_data: Json | null
          asset_name: string
          asset_type: string
          asset_url: string | null
          created_at: string | null
          creator_id: string
          file_size_bytes: number | null
          id: string
          is_primary: boolean | null
          mime_type: string | null
        }
        Insert: {
          asset_data?: Json | null
          asset_name: string
          asset_type: string
          asset_url?: string | null
          created_at?: string | null
          creator_id: string
          file_size_bytes?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
        }
        Update: {
          asset_data?: Json | null
          asset_name?: string
          asset_type?: string
          asset_url?: string | null
          created_at?: string | null
          creator_id?: string
          file_size_bytes?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
        }
        Relationships: []
      }
      brand_deals: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          creator_id: string
          creator_net_cents: number
          deal_name: string
          id: string
          offer_details: string | null
          offer_id: string | null
          paid_at: string | null
          sponsor_id: string
          status: string
          streamcentives_fee_cents: number
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          creator_id: string
          creator_net_cents?: number
          deal_name: string
          id?: string
          offer_details?: string | null
          offer_id?: string | null
          paid_at?: string | null
          sponsor_id: string
          status?: string
          streamcentives_fee_cents?: number
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          creator_net_cents?: number
          deal_name?: string
          id?: string
          offer_details?: string | null
          offer_id?: string | null
          paid_at?: string | null
          sponsor_id?: string
          status?: string
          streamcentives_fee_cents?: number
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_deals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "sponsor_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_partnerships: {
        Row: {
          brand_contact_info: Json
          brand_name: string
          compensation_amount_cents: number | null
          contract_details: Json | null
          created_at: string | null
          creator_id: string
          deliverables: Json | null
          end_date: string | null
          id: string
          partnership_type: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          brand_contact_info?: Json
          brand_name: string
          compensation_amount_cents?: number | null
          contract_details?: Json | null
          created_at?: string | null
          creator_id: string
          deliverables?: Json | null
          end_date?: string | null
          id?: string
          partnership_type: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_contact_info?: Json
          brand_name?: string
          compensation_amount_cents?: number | null
          contract_details?: Json | null
          created_at?: string | null
          creator_id?: string
          deliverables?: Json | null
          end_date?: string | null
          id?: string
          partnership_type?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bulk_upload_files: {
        Row: {
          created_at: string | null
          creator_id: string
          error_message: string | null
          file_size: number | null
          file_url: string | null
          id: string
          job_id: string | null
          mime_type: string | null
          original_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          error_message?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          job_id?: string | null
          mime_type?: string | null
          original_name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          error_message?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          job_id?: string | null
          mime_type?: string | null
          original_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_upload_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bulk_upload_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_upload_jobs: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string
          failed_files: number
          id: string
          job_name: string
          metadata: Json | null
          processed_files: number
          status: string
          tags: string[] | null
          total_files: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id: string
          failed_files?: number
          id?: string
          job_name: string
          metadata?: Json | null
          processed_files?: number
          status?: string
          tags?: string[] | null
          total_files?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string
          failed_files?: number
          id?: string
          job_name?: string
          metadata?: Json | null
          processed_files?: number
          status?: string
          tags?: string[] | null
          total_files?: number
          updated_at?: string | null
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
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_collaborators: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_collaborators_campaign_id_fkey"
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
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_predictions: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          model_version: string | null
          predicted_completion_rate: number | null
          predicted_participants: number | null
          predicted_revenue_cents: number | null
          prediction_accuracy: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          model_version?: string | null
          predicted_completion_rate?: number | null
          predicted_participants?: number | null
          predicted_revenue_cents?: number | null
          prediction_accuracy?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          model_version?: string | null
          predicted_completion_rate?: number | null
          predicted_participants?: number | null
          predicted_revenue_cents?: number | null
          prediction_accuracy?: number | null
        }
        Relationships: []
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
          collaboration_enabled: boolean | null
          collaborator_count: number | null
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
          collaboration_enabled?: boolean | null
          collaborator_count?: number | null
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
          collaboration_enabled?: boolean | null
          collaborator_count?: number | null
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
      communities: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          genre: string
          id: string
          is_public: boolean
          member_count: number
          name: string
          rules: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          genre: string
          id?: string
          is_public?: boolean
          member_count?: number
          name: string
          rules?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          genre?: string
          id?: string
          is_public?: boolean
          member_count?: number
          name?: string
          rules?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_messages_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_community_messages_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_community_messages_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_follow_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          comments_count: number | null
          community_id: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          location: string | null
          media_urls: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          comments_count?: number | null
          community_id: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_urls?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          comments_count?: number | null
          community_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_urls?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_follow_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_posts_author_id"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_community_posts_author_id"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_community_posts_author_id"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_follow_stats"
            referencedColumns: ["user_id"]
          },
        ]
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
      content_moderation: {
        Row: {
          action_taken: Database["public"]["Enums"]["moderation_action"] | null
          ai_analysis: Json | null
          auto_actioned: boolean | null
          categories:
            | Database["public"]["Enums"]["moderation_category"][]
            | null
          confidence: number
          content_hash: string | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          detected_language: string | null
          flags: string[] | null
          id: string
          is_appropriate: boolean
          media_urls: string[] | null
          original_content: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["moderation_severity"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_taken?: Database["public"]["Enums"]["moderation_action"] | null
          ai_analysis?: Json | null
          auto_actioned?: boolean | null
          categories?:
            | Database["public"]["Enums"]["moderation_category"][]
            | null
          confidence?: number
          content_hash?: string | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          detected_language?: string | null
          flags?: string[] | null
          id?: string
          is_appropriate?: boolean
          media_urls?: string[] | null
          original_content?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["moderation_severity"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_taken?: Database["public"]["Enums"]["moderation_action"] | null
          ai_analysis?: Json | null
          auto_actioned?: boolean | null
          categories?:
            | Database["public"]["Enums"]["moderation_category"][]
            | null
          confidence?: number
          content_hash?: string | null
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          detected_language?: string | null
          flags?: string[] | null
          id?: string
          is_appropriate?: boolean
          media_urls?: string[] | null
          original_content?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["moderation_severity"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_moderation_queue: {
        Row: {
          automated_flags: Json | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderator_id: string | null
          moderator_notes: string | null
          priority: number | null
          reason: string
          reported_by_user_id: string | null
          reviewed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          automated_flags?: Json | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: number | null
          reason: string
          reported_by_user_id?: string | null
          reviewed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          automated_flags?: Json | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: number | null
          reason?: string
          reported_by_user_id?: string | null
          reviewed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_recommendations: {
        Row: {
          clicked: boolean | null
          content_type: string
          created_at: string | null
          id: string
          recommendation_reason: Json | null
          recommendation_score: number
          recommended_content_id: string
          user_id: string
          viewed: boolean | null
        }
        Insert: {
          clicked?: boolean | null
          content_type: string
          created_at?: string | null
          id?: string
          recommendation_reason?: Json | null
          recommendation_score: number
          recommended_content_id: string
          user_id: string
          viewed?: boolean | null
        }
        Update: {
          clicked?: boolean | null
          content_type?: string
          created_at?: string | null
          id?: string
          recommendation_reason?: Json | null
          recommendation_score?: number
          recommended_content_id?: string
          user_id?: string
          viewed?: boolean | null
        }
        Relationships: []
      }
      content_scheduler: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string | null
          creator_id: string
          error_message: string | null
          id: string
          platforms: string[]
          posted_urls: Json | null
          scheduled_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content_data?: Json
          content_type: string
          created_at?: string | null
          creator_id: string
          error_message?: string | null
          id?: string
          platforms: string[]
          posted_urls?: Json | null
          scheduled_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string | null
          creator_id?: string
          error_message?: string | null
          id?: string
          platforms?: string[]
          posted_urls?: Json | null
          scheduled_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          is_public: boolean | null
          tags: string[] | null
          template_content: Json
          template_name: string
          template_type: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          template_content?: Json
          template_name: string
          template_type: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          template_content?: Json
          template_name?: string
          template_type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          active_campaigns: number
          created_at: string
          creator_id: string
          date: string
          engagement_rate: number | null
          id: string
          new_fans: number
          total_campaigns: number
          total_cash_awarded: number
          total_fans: number
          total_message_revenue_cents: number
          total_messages_received: number
          total_xp_awarded: number
          updated_at: string
        }
        Insert: {
          active_campaigns?: number
          created_at?: string
          creator_id: string
          date?: string
          engagement_rate?: number | null
          id?: string
          new_fans?: number
          total_campaigns?: number
          total_cash_awarded?: number
          total_fans?: number
          total_message_revenue_cents?: number
          total_messages_received?: number
          total_xp_awarded?: number
          updated_at?: string
        }
        Update: {
          active_campaigns?: number
          created_at?: string
          creator_id?: string
          date?: string
          engagement_rate?: number | null
          id?: string
          new_fans?: number
          total_campaigns?: number
          total_cash_awarded?: number
          total_fans?: number
          total_message_revenue_cents?: number
          total_messages_received?: number
          total_xp_awarded?: number
          updated_at?: string
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
      creator_payouts: {
        Row: {
          bank_account_last4: string | null
          conversion_rate: number
          created_at: string
          creator_id: string
          fee_amount_cents: number
          fiat_amount_cents: number
          id: string
          metadata: Json | null
          net_amount_cents: number
          processed_at: string | null
          requested_at: string
          status: string
          stripe_payout_id: string | null
          updated_at: string
          xp_amount: number
        }
        Insert: {
          bank_account_last4?: string | null
          conversion_rate: number
          created_at?: string
          creator_id: string
          fee_amount_cents: number
          fiat_amount_cents: number
          id?: string
          metadata?: Json | null
          net_amount_cents: number
          processed_at?: string | null
          requested_at?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
          xp_amount: number
        }
        Update: {
          bank_account_last4?: string | null
          conversion_rate?: number
          created_at?: string
          creator_id?: string
          fee_amount_cents?: number
          fiat_amount_cents?: number
          id?: string
          metadata?: Json | null
          net_amount_cents?: number
          processed_at?: string | null
          requested_at?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
          xp_amount?: number
        }
        Relationships: []
      }
      crypto_payments: {
        Row: {
          amount_crypto: number
          amount_usd_cents: number
          confirmations: number | null
          confirmed_at: string | null
          created_at: string | null
          cryptocurrency: string
          id: string
          payer_id: string
          recipient_id: string
          status: string | null
          transaction_hash: string | null
          wallet_address: string
        }
        Insert: {
          amount_crypto: number
          amount_usd_cents: number
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          cryptocurrency: string
          id?: string
          payer_id: string
          recipient_id: string
          status?: string | null
          transaction_hash?: string | null
          wallet_address: string
        }
        Update: {
          amount_crypto?: number
          amount_usd_cents?: number
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          cryptocurrency?: string
          id?: string
          payer_id?: string
          recipient_id?: string
          status?: string | null
          transaction_hash?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          created_at: string | null
          id: string
          is_scheduled: boolean | null
          last_generated_at: string | null
          report_config: Json
          report_name: string
          schedule_config: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_scheduled?: boolean | null
          last_generated_at?: string | null
          report_config?: Json
          report_name: string
          schedule_config?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_scheduled?: boolean | null
          last_generated_at?: string | null
          report_config?: Json
          report_name?: string
          schedule_config?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      digital_asset_access_logs: {
        Row: {
          accessed_at: string | null
          asset_bucket: string
          asset_key: string
          created_at: string | null
          download_url: string
          expires_at: string
          id: string
          ip_address: unknown | null
          reward_redemption_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          asset_bucket: string
          asset_key: string
          created_at?: string | null
          download_url: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          reward_redemption_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          asset_bucket?: string
          asset_key?: string
          created_at?: string | null
          download_url?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          reward_redemption_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discovery_funnel_analytics: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string | null
          creator_id: string
          funnel_stage: string
          id: string
          metadata: Json | null
          source_platform: string | null
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          creator_id: string
          funnel_stage: string
          id?: string
          metadata?: Json | null
          source_platform?: string | null
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          creator_id?: string
          funnel_stage?: string
          id?: string
          metadata?: Json | null
          source_platform?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          campaign_name: string
          click_rate: number | null
          created_at: string | null
          creator_id: string
          email_content: string
          id: string
          open_rate: number | null
          recipient_list: Json
          scheduled_send_time: string | null
          status: string | null
          subject_line: string
          updated_at: string | null
        }
        Insert: {
          campaign_name: string
          click_rate?: number | null
          created_at?: string | null
          creator_id: string
          email_content: string
          id?: string
          open_rate?: number | null
          recipient_list?: Json
          scheduled_send_time?: string | null
          status?: string | null
          subject_line: string
          updated_at?: string | null
        }
        Update: {
          campaign_name?: string
          click_rate?: number | null
          created_at?: string | null
          creator_id?: string
          email_content?: string
          id?: string
          open_rate?: number | null
          recipient_list?: Json
          scheduled_send_time?: string | null
          status?: string | null
          subject_line?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      engagement_predictions: {
        Row: {
          accuracy_score: number | null
          created_at: string | null
          creator_id: string
          id: string
          model_version: string | null
          predicted_engagement: Json
          prediction_timeframe: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string | null
          creator_id: string
          id?: string
          model_version?: string | null
          predicted_engagement?: Json
          prediction_timeframe: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string | null
          creator_id?: string
          id?: string
          model_version?: string | null
          predicted_engagement?: Json
          prediction_timeframe?: string
        }
        Relationships: []
      }
      escrow_payments: {
        Row: {
          amount_cents: number
          auto_refund_at: string | null
          created_at: string
          creator_id: string
          held_at: string | null
          id: string
          offer_id: string
          refunded_at: string | null
          released_at: string | null
          sponsor_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          auto_refund_at?: string | null
          created_at?: string
          creator_id: string
          held_at?: string | null
          id?: string
          offer_id: string
          refunded_at?: string | null
          released_at?: string | null
          sponsor_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          auto_refund_at?: string | null
          created_at?: string
          creator_id?: string
          held_at?: string | null
          id?: string
          offer_id?: string
          refunded_at?: string | null
          released_at?: string | null
          sponsor_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          attended: boolean | null
          check_in_time: string | null
          created_at: string | null
          event_id: string
          id: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          check_in_time?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          check_in_time?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experience_templates: {
        Row: {
          created_at: string | null
          creator_id: string
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          requires_verification: boolean | null
          template_data: Json | null
          template_description: string | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          requires_verification?: boolean | null
          template_data?: Json | null
          template_description?: string | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          requires_verification?: boolean | null
          template_data?: Json | null
          template_description?: string | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      experience_verifications: {
        Row: {
          created_at: string | null
          experience_id: string
          id: string
          location_data: Json | null
          verification_data: Json | null
          verification_method: string
          verified_at: string | null
          verified_by_user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          id?: string
          location_data?: Json | null
          verification_data?: Json | null
          verification_method?: string
          verified_at?: string | null
          verified_by_user_id: string
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          id?: string
          location_data?: Json | null
          verification_data?: Json | null
          verification_method?: string
          verified_at?: string | null
          verified_by_user_id?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          created_at: string
          creator_id: string
          experience_type: string
          fan_id: string
          id: string
          instructions: string | null
          location: string | null
          metadata: Json | null
          qr_code_url: string | null
          reward_redemption_id: string
          scheduled_at: string | null
          status: string
          updated_at: string
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          experience_type: string
          fan_id: string
          id?: string
          instructions?: string | null
          location?: string | null
          metadata?: Json | null
          qr_code_url?: string | null
          reward_redemption_id: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          experience_type?: string
          fan_id?: string
          id?: string
          instructions?: string | null
          location?: string | null
          metadata?: Json | null
          qr_code_url?: string | null
          reward_redemption_id?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      fan_behavior_analytics: {
        Row: {
          behavior_data: Json
          behavior_type: string
          creator_id: string
          device_info: Json | null
          fan_id: string
          id: string
          session_id: string | null
          timestamp: string | null
        }
        Insert: {
          behavior_data?: Json
          behavior_type: string
          creator_id: string
          device_info?: Json | null
          fan_id: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
        }
        Update: {
          behavior_data?: Json
          behavior_type?: string
          creator_id?: string
          device_info?: Json | null
          fan_id?: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      fan_communities: {
        Row: {
          community_description: string | null
          community_name: string
          community_rules: Json | null
          created_at: string | null
          creator_id: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          member_count: number | null
          updated_at: string | null
        }
        Insert: {
          community_description?: string | null
          community_name: string
          community_rules?: Json | null
          created_at?: string | null
          creator_id: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          member_count?: number | null
          updated_at?: string | null
        }
        Update: {
          community_description?: string | null
          community_name?: string
          community_rules?: Json | null
          created_at?: string | null
          creator_id?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          member_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fan_events: {
        Row: {
          created_at: string | null
          creator_id: string
          current_attendees: number | null
          event_date: string
          event_description: string | null
          event_name: string
          event_type: string
          id: string
          is_virtual: boolean | null
          location_data: Json | null
          max_attendees: number | null
          meeting_url: string | null
          status: string | null
          ticket_price_cents: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          current_attendees?: number | null
          event_date: string
          event_description?: string | null
          event_name: string
          event_type: string
          id?: string
          is_virtual?: boolean | null
          location_data?: Json | null
          max_attendees?: number | null
          meeting_url?: string | null
          status?: string | null
          ticket_price_cents?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          current_attendees?: number | null
          event_date?: string
          event_description?: string | null
          event_name?: string
          event_type?: string
          id?: string
          is_virtual?: boolean | null
          location_data?: Json | null
          max_attendees?: number | null
          meeting_url?: string | null
          status?: string | null
          ticket_price_cents?: number | null
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
      fulfillments: {
        Row: {
          created_at: string
          creator_id: string
          delivered_at: string | null
          fan_id: string
          id: string
          notes: string | null
          reward_redemption_id: string
          shipped_at: string | null
          shipping_address: Json
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          delivered_at?: string | null
          fan_id: string
          id?: string
          notes?: string | null
          reward_redemption_id: string
          shipped_at?: string | null
          shipping_address: Json
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          delivered_at?: string | null
          fan_id?: string
          id?: string
          notes?: string | null
          reward_redemption_id?: string
          shipped_at?: string | null
          shipping_address?: Json
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gift_types: {
        Row: {
          animation_type: string
          created_at: string
          creator_type: string
          icon_name: string
          id: string
          name: string
          rarity: string
          xp_cost: number
        }
        Insert: {
          animation_type: string
          created_at?: string
          creator_type: string
          icon_name: string
          id?: string
          name: string
          rarity?: string
          xp_cost: number
        }
        Update: {
          animation_type?: string
          created_at?: string
          creator_type?: string
          icon_name?: string
          id?: string
          name?: string
          rarity?: string
          xp_cost?: number
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
      integration_marketplace: {
        Row: {
          api_endpoints: Json | null
          category: string
          created_at: string | null
          developer_id: string
          id: string
          installation_count: number | null
          integration_description: string | null
          integration_name: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          pricing_model: string | null
          rating: number | null
          webhook_url: string | null
        }
        Insert: {
          api_endpoints?: Json | null
          category: string
          created_at?: string | null
          developer_id: string
          id?: string
          installation_count?: number | null
          integration_description?: string | null
          integration_name: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          pricing_model?: string | null
          rating?: number | null
          webhook_url?: string | null
        }
        Update: {
          api_endpoints?: Json | null
          category?: string
          created_at?: string | null
          developer_id?: string
          id?: string
          installation_count?: number | null
          integration_description?: string | null
          integration_name?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          pricing_model?: string | null
          rating?: number | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      language_preferences: {
        Row: {
          auto_translate: boolean | null
          id: string
          preferred_language: string
          secondary_languages: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_translate?: boolean | null
          id?: string
          preferred_language?: string
          secondary_languages?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_translate?: boolean | null
          id?: string
          preferred_language?: string
          secondary_languages?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      live_stream_chat: {
        Row: {
          created_at: string | null
          id: string
          message: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          stream_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          stream_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_comments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_gifts: {
        Row: {
          created_at: string
          gift_type: string
          gift_value_xp: number
          id: string
          is_anonymous: boolean | null
          message: string | null
          sender_id: string
          stream_id: string
        }
        Insert: {
          created_at?: string
          gift_type: string
          gift_value_xp: number
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          sender_id: string
          stream_id: string
        }
        Update: {
          created_at?: string
          gift_type?: string
          gift_value_xp?: number
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          sender_id?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_gifts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_guests: {
        Row: {
          created_at: string | null
          guest_id: string
          id: string
          joined_at: string | null
          left_at: string | null
          status: string
          stream_id: string
        }
        Insert: {
          created_at?: string | null
          guest_id: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string
          stream_id: string
        }
        Update: {
          created_at?: string | null
          guest_id?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_guests_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_invites: {
        Row: {
          created_at: string | null
          id: string
          invitee_id: string
          inviter_id: string
          responded_at: string | null
          status: string
          stream_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitee_id: string
          inviter_id: string
          responded_at?: string | null
          status?: string
          stream_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invitee_id?: string
          inviter_id?: string
          responded_at?: string | null
          status?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_invites_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_viewers: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          stream_id: string
          total_watch_time_seconds: number | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id: string
          total_watch_time_seconds?: number | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          total_watch_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          actual_start_time: string | null
          category: string | null
          created_at: string | null
          creator_id: string
          end_time: string | null
          guest_ids: Json | null
          id: string
          is_multi_guest: boolean | null
          max_guests: number | null
          peak_viewers: number | null
          platform: string
          privacy_level: string | null
          scheduled_start_time: string | null
          status: string | null
          stream_description: string | null
          stream_title: string
          stream_url: string | null
          thumbnail_url: string | null
          viewer_count: number | null
        }
        Insert: {
          actual_start_time?: string | null
          category?: string | null
          created_at?: string | null
          creator_id: string
          end_time?: string | null
          guest_ids?: Json | null
          id?: string
          is_multi_guest?: boolean | null
          max_guests?: number | null
          peak_viewers?: number | null
          platform: string
          privacy_level?: string | null
          scheduled_start_time?: string | null
          status?: string | null
          stream_description?: string | null
          stream_title: string
          stream_url?: string | null
          thumbnail_url?: string | null
          viewer_count?: number | null
        }
        Update: {
          actual_start_time?: string | null
          category?: string | null
          created_at?: string | null
          creator_id?: string
          end_time?: string | null
          guest_ids?: Json | null
          id?: string
          is_multi_guest?: boolean | null
          max_guests?: number | null
          peak_viewers?: number | null
          platform?: string
          privacy_level?: string | null
          scheduled_start_time?: string | null
          status?: string | null
          stream_description?: string | null
          stream_title?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          viewer_count?: number | null
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          asking_price_cents: number
          asking_price_xp: number | null
          buyer_id: string | null
          category_id: string | null
          condition: string | null
          created_at: string
          currency: string | null
          description: string | null
          featured_until: string | null
          id: string
          is_active: boolean | null
          is_sold: boolean | null
          return_policy: string | null
          reward_redemption_id: string
          seller_id: string
          shipping_cost_cents: number | null
          shipping_regions: string[] | null
          sold_at: string | null
          tags: string[] | null
          updated_at: string
          view_count: number | null
          watch_count: number | null
        }
        Insert: {
          asking_price_cents: number
          asking_price_xp?: number | null
          buyer_id?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_sold?: boolean | null
          return_policy?: string | null
          reward_redemption_id: string
          seller_id: string
          shipping_cost_cents?: number | null
          shipping_regions?: string[] | null
          sold_at?: string | null
          tags?: string[] | null
          updated_at?: string
          view_count?: number | null
          watch_count?: number | null
        }
        Update: {
          asking_price_cents?: number
          asking_price_xp?: number | null
          buyer_id?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_sold?: boolean | null
          return_policy?: string | null
          reward_redemption_id?: string
          seller_id?: string
          shipping_cost_cents?: number | null
          shipping_regions?: string[] | null
          sold_at?: string | null
          tags?: string[] | null
          updated_at?: string
          view_count?: number | null
          watch_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_reward_redemption_id_fkey"
            columns: ["reward_redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_offers: {
        Row: {
          buyer_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          listing_id: string
          message: string | null
          offer_amount_cents: number
          offer_amount_xp: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          offer_amount_cents: number
          offer_amount_xp?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          offer_amount_cents?: number
          offer_amount_xp?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
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
      marketplace_watchers: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_watchers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      media_kits: {
        Row: {
          contact_information: Json
          created_at: string | null
          creator_bio: string | null
          creator_id: string
          demographics: Json | null
          download_count: number | null
          id: string
          is_public: boolean | null
          kit_name: string
          last_updated: string | null
          rate_card: Json | null
          sample_content: Json | null
          statistics: Json
        }
        Insert: {
          contact_information?: Json
          created_at?: string | null
          creator_bio?: string | null
          creator_id: string
          demographics?: Json | null
          download_count?: number | null
          id?: string
          is_public?: boolean | null
          kit_name: string
          last_updated?: string | null
          rate_card?: Json | null
          sample_content?: Json | null
          statistics?: Json
        }
        Update: {
          contact_information?: Json
          created_at?: string | null
          creator_bio?: string | null
          creator_id?: string
          demographics?: Json | null
          download_count?: number | null
          id?: string
          is_public?: boolean | null
          kit_name?: string
          last_updated?: string | null
          rate_card?: Json | null
          sample_content?: Json | null
          statistics?: Json
        }
        Relationships: []
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
      message_templates: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          is_active: boolean
          template_content: string
          template_name: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          is_active?: boolean
          template_content: string
          template_name: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          is_active?: boolean
          template_content?: string
          template_name?: string
          updated_at?: string
          usage_count?: number
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
      moderation_appeals: {
        Row: {
          appeal_evidence: string | null
          appeal_reason: string
          created_at: string
          decided_at: string | null
          decision: string | null
          id: string
          moderation_id: string
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string | null
          updated_at: string
          user_id: string
          user_statement: string | null
        }
        Insert: {
          appeal_evidence?: string | null
          appeal_reason: string
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          id?: string
          moderation_id: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          user_statement?: string | null
        }
        Update: {
          appeal_evidence?: string | null
          appeal_reason?: string
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          id?: string
          moderation_id?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          user_statement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_appeals_moderation_id_fkey"
            columns: ["moderation_id"]
            isOneToOne: false
            referencedRelation: "content_moderation"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          escalation_reason: string | null
          id: string
          moderation_id: string
          priority: number | null
          queue_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          escalation_reason?: string | null
          id?: string
          moderation_id: string
          priority?: number | null
          queue_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          escalation_reason?: string | null
          id?: string
          moderation_id?: string
          priority?: number | null
          queue_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_moderation_id_fkey"
            columns: ["moderation_id"]
            isOneToOne: false
            referencedRelation: "content_moderation"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_name: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_method: string
          delivery_status: string
          error_message: string | null
          external_id: string | null
          id: string
          notification_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_method: string
          delivery_status?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          notification_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string
          delivery_status?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          notification_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          campaign_join_notifications: boolean | null
          campaign_notifications: boolean | null
          comment_notifications: boolean | null
          created_at: string
          discord_webhook_url: string | null
          email_enabled: boolean
          engagement_milestone_notifications: boolean | null
          follow_notifications: boolean | null
          id: string
          like_notifications: boolean | null
          message_notifications: boolean | null
          milestone_notifications: boolean | null
          offer_notifications: boolean | null
          phone_number: string | null
          profile_view_notifications: boolean | null
          push_enabled: boolean
          repost_notifications: boolean | null
          reward_notifications: boolean | null
          reward_purchase_notifications: boolean | null
          share_notifications: boolean | null
          slack_webhook_url: string | null
          sms_enabled: boolean
          tag_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_join_notifications?: boolean | null
          campaign_notifications?: boolean | null
          comment_notifications?: boolean | null
          created_at?: string
          discord_webhook_url?: string | null
          email_enabled?: boolean
          engagement_milestone_notifications?: boolean | null
          follow_notifications?: boolean | null
          id?: string
          like_notifications?: boolean | null
          message_notifications?: boolean | null
          milestone_notifications?: boolean | null
          offer_notifications?: boolean | null
          phone_number?: string | null
          profile_view_notifications?: boolean | null
          push_enabled?: boolean
          repost_notifications?: boolean | null
          reward_notifications?: boolean | null
          reward_purchase_notifications?: boolean | null
          share_notifications?: boolean | null
          slack_webhook_url?: string | null
          sms_enabled?: boolean
          tag_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_join_notifications?: boolean | null
          campaign_notifications?: boolean | null
          comment_notifications?: boolean | null
          created_at?: string
          discord_webhook_url?: string | null
          email_enabled?: boolean
          engagement_milestone_notifications?: boolean | null
          follow_notifications?: boolean | null
          id?: string
          like_notifications?: boolean | null
          message_notifications?: boolean | null
          milestone_notifications?: boolean | null
          offer_notifications?: boolean | null
          phone_number?: string | null
          profile_view_notifications?: boolean | null
          push_enabled?: boolean
          repost_notifications?: boolean | null
          reward_notifications?: boolean | null
          reward_purchase_notifications?: boolean | null
          share_notifications?: boolean | null
          slack_webhook_url?: string | null
          sms_enabled?: boolean
          tag_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          priority: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_negotiations: {
        Row: {
          created_at: string
          id: string
          message: string
          offer_id: string
          proposed_amount_cents: number | null
          proposed_terms: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          offer_id: string
          proposed_amount_cents?: number | null
          proposed_terms?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          offer_id?: string
          proposed_amount_cents?: number | null
          proposed_terms?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      offer_responses: {
        Row: {
          counter_amount_cents: number | null
          counter_terms: string | null
          created_at: string | null
          id: string
          message: string | null
          offer_id: string
          response_type: string
          sender_id: string
          sender_type: string
          updated_at: string | null
        }
        Insert: {
          counter_amount_cents?: number | null
          counter_terms?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          offer_id: string
          response_type: string
          sender_id: string
          sender_type: string
          updated_at?: string | null
        }
        Update: {
          counter_amount_cents?: number | null
          counter_terms?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          offer_id?: string
          response_type?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_responses_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "sponsor_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by_user_id: string | null
          joined_at: string | null
          organization_id: string
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by_user_id?: string | null
          joined_at?: string | null
          organization_id: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by_user_id?: string | null
          joined_at?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_members: number | null
          name: string
          plan_type: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_members?: number | null
          name: string
          plan_type?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_members?: number | null
          name?: string
          plan_type?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
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
        Relationships: [
          {
            foreignKeyName: "fk_post_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_post_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_post_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_follow_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      post_tags: {
        Row: {
          approved: boolean | null
          created_at: string
          id: string
          post_id: string
          tag_type: string | null
          tagged_by_user_id: string
          tagged_user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          id?: string
          post_id: string
          tag_type?: string | null
          tagged_by_user_id: string
          tagged_user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          id?: string
          post_id?: string
          tag_type?: string | null
          tagged_by_user_id?: string
          tagged_user_id?: string
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
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          source: string | null
          viewed_at: string | null
          viewed_user_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source?: string | null
          viewed_at?: string | null
          viewed_user_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source?: string | null
          viewed_at?: string | null
          viewed_user_id?: string
          viewer_id?: string
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
          creator_type: Database["public"]["Enums"]["creator_type"] | null
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
          offer_receiving_rate_cents: number | null
          onboarding_completed: boolean | null
          profile_boost_score: number | null
          spotify_connected: boolean | null
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_boosts_received: number | null
          updated_at: string
          user_id: string
          username: string | null
          youtube_channel_id: string | null
          youtube_connected: boolean | null
          youtube_connected_at: string | null
          youtube_username: string | null
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
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
          offer_receiving_rate_cents?: number | null
          onboarding_completed?: boolean | null
          profile_boost_score?: number | null
          spotify_connected?: boolean | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_boosts_received?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          youtube_channel_id?: string | null
          youtube_connected?: boolean | null
          youtube_connected_at?: string | null
          youtube_username?: string | null
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
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
          offer_receiving_rate_cents?: number | null
          onboarding_completed?: boolean | null
          profile_boost_score?: number | null
          spotify_connected?: boolean | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_boosts_received?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          youtube_channel_id?: string | null
          youtube_connected?: boolean | null
          youtube_connected_at?: string | null
          youtube_username?: string | null
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          body: string
          clicked_at: string | null
          created_at: string | null
          data: Json | null
          device_tokens: string[] | null
          id: string
          sent_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          clicked_at?: string | null
          created_at?: string | null
          data?: Json | null
          device_tokens?: string[] | null
          id?: string
          sent_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          clicked_at?: string | null
          created_at?: string | null
          data?: Json | null
          device_tokens?: string[] | null
          id?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_steps: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          id: string
          is_required: boolean | null
          quest_id: string
          step_description: string | null
          step_number: number
          step_title: string
          xp_reward: number
        }
        Insert: {
          action_data?: Json
          action_type: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          quest_id: string
          step_description?: string | null
          step_number: number
          step_title: string
          xp_reward?: number
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          quest_id?: string
          step_description?: string | null
          step_number?: number
          step_title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_steps_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "artist_initiation_quests"
            referencedColumns: ["id"]
          },
        ]
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
      revenue_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          creator_id: string
          data_points: Json | null
          forecast_date: string
          forecast_period: string
          id: string
          predicted_revenue_cents: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          creator_id: string
          data_points?: Json | null
          forecast_date: string
          forecast_period: string
          id?: string
          predicted_revenue_cents?: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          creator_id?: string
          data_points?: Json | null
          forecast_date?: string
          forecast_period?: string
          id?: string
          predicted_revenue_cents?: number
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
          can_be_listed: boolean | null
          created_at: string
          id: string
          is_listed_on_marketplace: boolean | null
          marketplace_listing_id: string | null
          payment_method: string
          reward_id: string
          status: string
          updated_at: string
          user_id: string
          xp_spent: number | null
        }
        Insert: {
          amount_paid?: number | null
          can_be_listed?: boolean | null
          created_at?: string
          id?: string
          is_listed_on_marketplace?: boolean | null
          marketplace_listing_id?: string | null
          payment_method: string
          reward_id: string
          status?: string
          updated_at?: string
          user_id: string
          xp_spent?: number | null
        }
        Update: {
          amount_paid?: number | null
          can_be_listed?: boolean | null
          created_at?: string
          id?: string
          is_listed_on_marketplace?: boolean | null
          marketplace_listing_id?: string | null
          payment_method?: string
          reward_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          xp_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_marketplace_listing_id_fkey"
            columns: ["marketplace_listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
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
          asset_expiry_hours: number | null
          cash_price: number | null
          cover_photo_url: string | null
          created_at: string
          creator_id: string
          creator_xp_only: boolean | null
          currency: string | null
          delivery_metadata: Json | null
          delivery_type: string | null
          description: string | null
          digital_asset_bucket: string | null
          digital_asset_key: string | null
          experience_template_id: string | null
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
          asset_expiry_hours?: number | null
          cash_price?: number | null
          cover_photo_url?: string | null
          created_at?: string
          creator_id: string
          creator_xp_only?: boolean | null
          currency?: string | null
          delivery_metadata?: Json | null
          delivery_type?: string | null
          description?: string | null
          digital_asset_bucket?: string | null
          digital_asset_key?: string | null
          experience_template_id?: string | null
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
          asset_expiry_hours?: number | null
          cash_price?: number | null
          cover_photo_url?: string | null
          created_at?: string
          creator_id?: string
          creator_xp_only?: boolean | null
          currency?: string | null
          delivery_metadata?: Json | null
          delivery_type?: string | null
          description?: string | null
          digital_asset_bucket?: string | null
          digital_asset_key?: string | null
          experience_template_id?: string | null
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
      scheduled_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          creator_id: string
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          metadata: Json | null
          platforms: string[]
          scheduled_time: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          creator_id: string
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platforms: string[]
          scheduled_time: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          creator_id?: string
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platforms?: string[]
          scheduled_time?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
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
      smart_link_action_completions: {
        Row: {
          action_id: string
          completed_at: string
          created_at: string
          id: string
          user_id: string
          verification_data: Json | null
        }
        Insert: {
          action_id: string
          completed_at?: string
          created_at?: string
          id?: string
          user_id: string
          verification_data?: Json | null
        }
        Update: {
          action_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          user_id?: string
          verification_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_action_completions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "smart_link_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_actions: {
        Row: {
          action_label: string
          action_type: string
          action_url: string
          bonus_multiplier: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          smart_link_id: string
          xp_reward: number
        }
        Insert: {
          action_label: string
          action_type: string
          action_url: string
          bonus_multiplier?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          smart_link_id: string
          xp_reward?: number
        }
        Update: {
          action_label?: string
          action_type?: string
          action_url?: string
          bonus_multiplier?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          smart_link_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_actions_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_interactions: {
        Row: {
          action_id: string | null
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          smart_link_id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          smart_link_id: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          smart_link_id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_interactions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "smart_link_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_interactions_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_links: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          slug: string
          title: string
          total_clicks: number | null
          total_xp_awarded: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          title: string
          total_clicks?: number | null
          total_xp_awarded?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          title?: string
          total_clicks?: number | null
          total_xp_awarded?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          campaign_name: string
          created_at: string | null
          creator_id: string
          delivery_rate: number | null
          id: string
          message_content: string
          recipient_phones: Json
          scheduled_send_time: string | null
          status: string | null
        }
        Insert: {
          campaign_name: string
          created_at?: string | null
          creator_id: string
          delivery_rate?: number | null
          id?: string
          message_content: string
          recipient_phones?: Json
          scheduled_send_time?: string | null
          status?: string | null
        }
        Update: {
          campaign_name?: string
          created_at?: string | null
          creator_id?: string
          delivery_rate?: number | null
          id?: string
          message_content?: string
          recipient_phones?: Json
          scheduled_send_time?: string | null
          status?: string | null
        }
        Relationships: []
      }
      social_integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          integration_data: Json | null
          is_active: boolean | null
          platform: string
          platform_user_id: string
          platform_username: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_data?: Json | null
          is_active?: boolean | null
          platform: string
          platform_user_id: string
          platform_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_data?: Json | null
          is_active?: boolean | null
          platform?: string
          platform_user_id?: string
          platform_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_interactions: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          target_content_id: string | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          target_content_id?: string | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          target_content_id?: string | null
          target_user_id?: string | null
          user_id?: string
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
      sponsor_offers: {
        Row: {
          campaign_duration_days: number | null
          created_at: string
          creator_id: string
          deliverables: Json | null
          expires_at: string | null
          id: string
          last_response_at: string | null
          offer_amount_cents: number
          offer_description: string
          offer_title: string
          responded_at: string | null
          response_count: number | null
          sponsor_id: string
          status: string | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          campaign_duration_days?: number | null
          created_at?: string
          creator_id: string
          deliverables?: Json | null
          expires_at?: string | null
          id?: string
          last_response_at?: string | null
          offer_amount_cents: number
          offer_description: string
          offer_title: string
          responded_at?: string | null
          response_count?: number | null
          sponsor_id: string
          status?: string | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          campaign_duration_days?: number | null
          created_at?: string
          creator_id?: string
          deliverables?: Json | null
          expires_at?: string | null
          id?: string
          last_response_at?: string | null
          offer_amount_cents?: number
          offer_description?: string
          offer_title?: string
          responded_at?: string | null
          response_count?: number | null
          sponsor_id?: string
          status?: string | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_profiles: {
        Row: {
          budget_range_max: number | null
          budget_range_min: number | null
          company_description: string | null
          company_logo_url: string | null
          company_name: string
          company_slug: string
          created_at: string
          id: string
          industry: string | null
          partnership_goals: Json | null
          target_audience: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name: string
          company_slug: string
          created_at?: string
          id?: string
          industry?: string | null
          partnership_goals?: Json | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_slug?: string
          created_at?: string
          id?: string
          industry?: string | null
          partnership_goals?: Json | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      sponsorship_campaigns: {
        Row: {
          approval_status: string | null
          campaign_brief: string | null
          campaign_name: string
          compensation_cents: number
          created_at: string | null
          deadline: string | null
          id: string
          partnership_id: string
          required_deliverables: Json
          status: string | null
          submitted_content: Json | null
        }
        Insert: {
          approval_status?: string | null
          campaign_brief?: string | null
          campaign_name: string
          compensation_cents: number
          created_at?: string | null
          deadline?: string | null
          id?: string
          partnership_id: string
          required_deliverables?: Json
          status?: string | null
          submitted_content?: Json | null
        }
        Update: {
          approval_status?: string | null
          campaign_brief?: string | null
          campaign_name?: string
          compensation_cents?: number
          created_at?: string | null
          deadline?: string | null
          id?: string
          partnership_id?: string
          required_deliverables?: Json
          status?: string | null
          submitted_content?: Json | null
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
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          creator_id: string
          duration_seconds: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          media_type: string
          media_url: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          creator_id: string
          duration_seconds: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          media_type: string
          media_url: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          creator_id?: string
          duration_seconds?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      story_highlights: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          id: string
          story_ids: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          story_ids?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          story_ids?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      streamseeker_admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          admin_notes: string | null
          artist_id: string
          created_at: string
          id: string
          new_status: string | null
          previous_status: string | null
          rejection_reason: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          admin_notes?: string | null
          artist_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          rejection_reason?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          admin_notes?: string | null
          artist_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          rejection_reason?: string | null
        }
        Relationships: []
      }
      streamseeker_artists: {
        Row: {
          approved_at: string | null
          content_count: number | null
          created_at: string
          discovery_pool: string
          eligibility_status: string
          id: string
          last_discovered_at: string | null
          pro_registration_info: Json | null
          profile_completion_score: number | null
          social_links_count: number | null
          total_discoveries: number | null
          total_follows_from_discovery: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          content_count?: number | null
          created_at?: string
          discovery_pool?: string
          eligibility_status?: string
          id?: string
          last_discovered_at?: string | null
          pro_registration_info?: Json | null
          profile_completion_score?: number | null
          social_links_count?: number | null
          total_discoveries?: number | null
          total_follows_from_discovery?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          content_count?: number | null
          created_at?: string
          discovery_pool?: string
          eligibility_status?: string
          id?: string
          last_discovered_at?: string | null
          pro_registration_info?: Json | null
          profile_completion_score?: number | null
          social_links_count?: number | null
          total_discoveries?: number | null
          total_follows_from_discovery?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streamseeker_checklist: {
        Row: {
          artist_id: string
          checklist_score: number | null
          content_uploaded: boolean | null
          created_at: string
          id: string
          pro_registration: boolean | null
          profile_complete: boolean | null
          social_media_linked: boolean | null
          updated_at: string
        }
        Insert: {
          artist_id: string
          checklist_score?: number | null
          content_uploaded?: boolean | null
          created_at?: string
          id?: string
          pro_registration?: boolean | null
          profile_complete?: boolean | null
          social_media_linked?: boolean | null
          updated_at?: string
        }
        Update: {
          artist_id?: string
          checklist_score?: number | null
          content_uploaded?: boolean | null
          created_at?: string
          id?: string
          pro_registration?: boolean | null
          profile_complete?: boolean | null
          social_media_linked?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      streamseeker_daily_quests: {
        Row: {
          created_at: string
          discoveries_completed: number | null
          id: string
          quest_completed: boolean | null
          quest_date: string | null
          total_xp_earned: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discoveries_completed?: number | null
          id?: string
          quest_completed?: boolean | null
          quest_date?: string | null
          total_xp_earned?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          discoveries_completed?: number | null
          id?: string
          quest_completed?: boolean | null
          quest_date?: string | null
          total_xp_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      streamseeker_discoveries: {
        Row: {
          artist_id: string
          content_type: string
          created_at: string
          discovery_date: string | null
          engagement_completed: boolean | null
          engagement_duration_seconds: number | null
          fan_id: string
          followed: boolean | null
          id: string
          skipped: boolean | null
          xp_earned: number | null
        }
        Insert: {
          artist_id: string
          content_type?: string
          created_at?: string
          discovery_date?: string | null
          engagement_completed?: boolean | null
          engagement_duration_seconds?: number | null
          fan_id: string
          followed?: boolean | null
          id?: string
          skipped?: boolean | null
          xp_earned?: number | null
        }
        Update: {
          artist_id?: string
          content_type?: string
          created_at?: string
          discovery_date?: string | null
          engagement_completed?: boolean | null
          engagement_duration_seconds?: number | null
          fan_id?: string
          followed?: boolean | null
          id?: string
          skipped?: boolean | null
          xp_earned?: number | null
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
      subscription_tiers: {
        Row: {
          benefits: Json
          billing_interval: string
          created_at: string | null
          creator_id: string
          current_subscribers: number | null
          id: string
          is_active: boolean | null
          max_subscribers: number | null
          price_cents: number
          tier_description: string | null
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json
          billing_interval?: string
          created_at?: string | null
          creator_id: string
          current_subscribers?: number | null
          id?: string
          is_active?: boolean | null
          max_subscribers?: number | null
          price_cents: number
          tier_description?: string | null
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json
          billing_interval?: string
          created_at?: string | null
          creator_id?: string
          current_subscribers?: number | null
          id?: string
          is_active?: boolean | null
          max_subscribers?: number | null
          price_cents?: number
          tier_description?: string | null
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_documents: {
        Row: {
          created_at: string | null
          document_type: string
          document_url: string | null
          generated_at: string | null
          id: string
          status: string | null
          tax_year: number
          total_earnings_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          document_url?: string | null
          generated_at?: string | null
          id?: string
          status?: string | null
          tax_year: number
          total_earnings_cents: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          document_url?: string | null
          generated_at?: string | null
          id?: string
          status?: string | null
          tax_year?: number
          total_earnings_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      team_campaigns: {
        Row: {
          budget_allocation: Json | null
          campaign_id: string
          created_at: string | null
          id: string
          organization_id: string
          performance_metrics: Json | null
          team_members: string[] | null
          updated_at: string | null
        }
        Insert: {
          budget_allocation?: Json | null
          campaign_id: string
          created_at?: string | null
          id?: string
          organization_id: string
          performance_metrics?: Json | null
          team_members?: string[] | null
          updated_at?: string | null
        }
        Update: {
          budget_allocation?: Json | null
          campaign_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          performance_metrics?: Json | null
          team_members?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_collaborations: {
        Row: {
          collaborator_id: string
          created_at: string | null
          creator_id: string
          id: string
          invited_at: string | null
          joined_at: string | null
          permissions: Json
          role: string
          status: string | null
        }
        Insert: {
          collaborator_id: string
          created_at?: string | null
          creator_id: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          permissions?: Json
          role?: string
          status?: string | null
        }
        Update: {
          collaborator_id?: string
          created_at?: string | null
          creator_id?: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          permissions?: Json
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      tip_donations: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          recipient_id: string
          sender_id: string
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          recipient_id: string
          sender_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_value: number
          created_at: string
          currency_type: string
          id: string
          metadata: Json | null
          related_user_id: string | null
          status: string
          stripe_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_value: number
          created_at?: string
          currency_type: string
          id?: string
          metadata?: Json | null
          related_user_id?: string | null
          status?: string
          stripe_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_value?: number
          created_at?: string
          currency_type?: string
          id?: string
          metadata?: Json | null
          related_user_id?: string | null
          status?: string
          stripe_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_engagement_metrics: {
        Row: {
          campaigns_participated: number
          created_at: string
          date: string
          id: string
          last_active_at: string | null
          messages_sent: number
          posts_liked: number
          posts_shared: number
          sessions_count: number
          total_session_duration_minutes: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          campaigns_participated?: number
          created_at?: string
          date?: string
          id?: string
          last_active_at?: string | null
          messages_sent?: number
          posts_liked?: number
          posts_shared?: number
          sessions_count?: number
          total_session_duration_minutes?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          campaigns_participated?: number
          created_at?: string
          date?: string
          id?: string
          last_active_at?: string | null
          messages_sent?: number
          posts_liked?: number
          posts_shared?: number
          sessions_count?: number
          total_session_duration_minutes?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
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
      user_moderation_history: {
        Row: {
          appeal_message: string | null
          appeal_reviewed_at: string | null
          appeal_reviewer_id: string | null
          appeal_status: string | null
          appeal_submitted: boolean | null
          created_at: string
          id: string
          is_restricted: boolean | null
          is_shadow_banned: boolean | null
          moderation_id: string
          restriction_expires_at: string | null
          shadow_ban_expires_at: string | null
          strike_count: number
          strike_expires_at: string | null
          strike_severity: Database["public"]["Enums"]["moderation_severity"]
          updated_at: string
          user_id: string
        }
        Insert: {
          appeal_message?: string | null
          appeal_reviewed_at?: string | null
          appeal_reviewer_id?: string | null
          appeal_status?: string | null
          appeal_submitted?: boolean | null
          created_at?: string
          id?: string
          is_restricted?: boolean | null
          is_shadow_banned?: boolean | null
          moderation_id: string
          restriction_expires_at?: string | null
          shadow_ban_expires_at?: string | null
          strike_count?: number
          strike_expires_at?: string | null
          strike_severity: Database["public"]["Enums"]["moderation_severity"]
          updated_at?: string
          user_id: string
        }
        Update: {
          appeal_message?: string | null
          appeal_reviewed_at?: string | null
          appeal_reviewer_id?: string | null
          appeal_status?: string | null
          appeal_submitted?: boolean | null
          created_at?: string
          id?: string
          is_restricted?: boolean | null
          is_shadow_banned?: boolean | null
          moderation_id?: string
          restriction_expires_at?: string | null
          shadow_ban_expires_at?: string | null
          strike_count?: number
          strike_expires_at?: string | null
          strike_severity?: Database["public"]["Enums"]["moderation_severity"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_moderation_history_moderation_id_fkey"
            columns: ["moderation_id"]
            isOneToOne: false
            referencedRelation: "content_moderation"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quest_progress: {
        Row: {
          completed_at: string | null
          id: string
          metadata: Json | null
          quest_id: string
          step_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          quest_id: string
          step_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          quest_id?: string
          step_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "artist_initiation_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quest_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "quest_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          action_taken: string | null
          additional_context: string | null
          created_at: string
          id: string
          report_category: Database["public"]["Enums"]["moderation_category"]
          report_reason: string
          reported_content_id: string
          reported_content_type: Database["public"]["Enums"]["content_type"]
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          additional_context?: string | null
          created_at?: string
          id?: string
          report_category: Database["public"]["Enums"]["moderation_category"]
          report_reason: string
          reported_content_id: string
          reported_content_type: Database["public"]["Enums"]["content_type"]
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          additional_context?: string | null
          created_at?: string
          id?: string
          report_category?: Database["public"]["Enums"]["moderation_category"]
          report_reason?: string
          reported_content_id?: string
          reported_content_type?: Database["public"]["Enums"]["content_type"]
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity_at: string | null
          location_data: Json | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location_data?: Json | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location_data?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renewal: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          started_at: string | null
          status: string | null
          stripe_subscription_id: string | null
          subscriber_id: string
          tier_id: string
        }
        Insert: {
          auto_renewal?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscriber_id: string
          tier_id: string
        }
        Update: {
          auto_renewal?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscriber_id?: string
          tier_id?: string
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
      video_messages: {
        Row: {
          approved_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          message_text: string | null
          recipient_id: string
          sender_id: string
          status: string | null
          thumbnail_url: string | null
          video_url: string
          viewed_at: string | null
          xp_cost: number
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          message_text?: string | null
          recipient_id: string
          sender_id: string
          status?: string | null
          thumbnail_url?: string | null
          video_url: string
          viewed_at?: string | null
          xp_cost?: number
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          message_text?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string | null
          thumbnail_url?: string | null
          video_url?: string
          viewed_at?: string | null
          xp_cost?: number
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
      webhook_integrations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          retry_attempts: number | null
          secret_key: string | null
          trigger_events: string[]
          updated_at: string | null
          user_id: string
          webhook_name: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          retry_attempts?: number | null
          secret_key?: string | null
          trigger_events: string[]
          updated_at?: string | null
          user_id: string
          webhook_name: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          retry_attempts?: number | null
          secret_key?: string | null
          trigger_events?: string[]
          updated_at?: string | null
          user_id?: string
          webhook_name?: string
          webhook_url?: string
        }
        Relationships: []
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
      white_label_configs: {
        Row: {
          brand_name: string
          created_at: string | null
          custom_domain: string | null
          features_enabled: Json
          id: string
          is_active: boolean | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string | null
          custom_domain?: string | null
          features_enabled?: Json
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string | null
          custom_domain?: string | null
          features_enabled?: Json
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      xp_conversion_rates: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          xp_per_dollar_cents: number
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          xp_per_dollar_cents?: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          xp_per_dollar_cents?: number
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
      youtube_accounts: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          scope: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
          youtube_channel_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          scope?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
          youtube_channel_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
          youtube_channel_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country_name: string | null
          created_at: string | null
          display_name: string | null
          merch_store_connected: boolean | null
          spotify_connected: boolean | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country_name?: string | null
          created_at?: string | null
          display_name?: string | null
          merch_store_connected?: boolean | null
          spotify_connected?: boolean | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country_name?: string | null
          created_at?: string | null
          display_name?: string | null
          merch_store_connected?: boolean | null
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
      admin_review_streamseeker_artist: {
        Args: {
          action_type_param: string
          admin_notes_param?: string
          artist_user_id: string
          rejection_reason_param?: string
        }
        Returns: Json
      }
      anonymize_user_data: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      apply_creator_pro_boost: {
        Args: { campaign_id_param: string; creator_id_param: string }
        Returns: Json
      }
      calculate_campaign_visibility_score: {
        Args: { campaign_id_param: string }
        Returns: number
      }
      calculate_creator_daily_analytics: {
        Args: { creator_user_id: string; target_date?: string }
        Returns: undefined
      }
      complete_campaign_interaction: {
        Args: { campaign_id_param: string; interaction_data_param?: Json }
        Returns: Json
      }
      complete_streamseeker_discovery: {
        Args: {
          artist_user_id: string
          content_type_param?: string
          engagement_completed_param?: boolean
          engagement_duration_param?: number
          fan_user_id: string
          followed_param?: boolean
        }
        Returns: Json
      }
      create_encrypted_api_key: {
        Args: {
          p_expires_at?: string
          p_key_name: string
          p_permissions?: Json
          p_rate_limit?: number
          p_raw_key: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          action_url_param?: string
          data_param?: Json
          message_param: string
          priority_param?: string
          title_param: string
          type_param: string
          user_id_param: string
        }
        Returns: string
      }
      decrypt_api_key: {
        Args: { encrypted_key: string; user_secret?: string }
        Returns: string
      }
      encrypt_api_key: {
        Args: { raw_key: string; user_secret?: string }
        Returns: string
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
      execute_marketplace_purchase_xp: {
        Args: {
          buyer_id_param: string
          listing_id_param: string
          platform_fee_xp_param: number
          seller_net_xp_param: number
          total_xp_amount_param: number
        }
        Returns: Json
      }
      expire_old_stories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_redemption_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_boosted_campaigns_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          boost_expires_at: string
          boost_multiplier: number
          boost_score: number
          cash_reward: number
          created_at: string
          creator_id: string
          current_progress: number
          currently_boosted: boolean
          description: string
          end_date: string
          id: string
          image_url: string
          is_boosted: boolean
          is_featured: boolean
          max_participants: number
          required_listen_duration_seconds: number
          requirements: string
          spotify_artist_id: string
          spotify_artist_url: string
          start_date: string
          status: string
          tags: string[]
          target_metric: string
          target_value: number
          title: string
          type: string
          updated_at: string
          visibility_score: number
          xp_reward: number
        }[]
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
      get_creators_by_category: {
        Args: {
          category_filter?: string
          fan_user_id_param?: string
          limit_count?: number
        }
        Returns: {
          avatar_url: string
          bio: string
          content_count: number
          creator_type: string
          display_name: string
          follower_count: number
          spotify_connected: boolean
          user_id: string
          username: string
        }[]
      }
      get_my_complete_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: string
          avatar_url: string
          bio: string
          country_code: string
          country_name: string
          created_at: string
          display_name: string
          email: string
          interests: string
          location: string
          merch_store_connected: boolean
          merch_store_platform: string
          merch_store_url: string
          spotify_connected: boolean
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_notification_preference: {
        Args: { preference_type: string; target_user_id: string }
        Returns: boolean
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
      get_public_profile_safe: {
        Args: { target_user_id: string }
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
      get_safe_profile: {
        Args: { target_user_id: string }
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
      get_social_counts: {
        Args: { content_type_param: string; target_content_id_param: string }
        Returns: {
          count: number
          interaction_type: string
        }[]
      }
      get_streamseeker_suggestions: {
        Args: {
          content_type_param?: string
          exclude_discovered?: boolean
          fan_user_id: string
        }
        Returns: {
          artist_id: string
          avatar_url: string
          bio: string
          content_count: number
          discovery_pool: string
          display_name: string
          follower_count: number
          username: string
        }[]
      }
      get_user_api_keys: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string
          masked_key: string
          permissions: Json
          rate_limit: number
        }[]
      }
      get_user_campaigns: {
        Args: { target_user_id: string }
        Returns: {
          campaign_id: string
          is_collaborator: boolean
          is_creator: boolean
          permissions: Json
          role: string
        }[]
      }
      get_user_follow_stats_safe: {
        Args: { target_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
          user_id: string
        }[]
      }
      get_user_strike_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      handle_enhanced_xp_purchase: {
        Args: {
          creator_id_param?: string
          fan_xp_share_param: number
          payment_amount_cents_param: number
          platform_xp_share_param: number
          user_id_param: string
          xp_type_param?: Database["public"]["Enums"]["xp_type"]
        }
        Returns: Json
      }
      handle_post_share: {
        Args: {
          platform_param?: string
          post_id_param: string
          share_type_param: string
        }
        Returns: Json
      }
      handle_reward_sale_xp: {
        Args: {
          buyer_id_param: string
          reward_id_param: string
          seller_id_param: string
          xp_price_param: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_user_restricted: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: number
      }
      process_brand_deal_payment: {
        Args: {
          amount_paid_cents_param: number
          deal_id_param: string
          payment_intent_id_param: string
        }
        Returns: Json
      }
      process_creator_payout: {
        Args: {
          bank_account_last4_param?: string
          payout_request_id_param: string
          stripe_payout_id_param: string
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
      search_public_profiles: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query: string
        }
        Returns: {
          avatar_url: string
          bio: string
          country_name: string
          created_at: string
          creator_type: string
          display_name: string
          follower_count: number
          merch_store_connected: boolean
          spotify_connected: boolean
          user_id: string
          username: string
        }[]
      }
      send_message_with_xp: {
        Args: {
          content_param: string
          recipient_id_param: string
          xp_cost_param: number
        }
        Returns: string
      }
      update_artist_eligibility: {
        Args: { artist_user_id: string }
        Returns: Json
      }
      update_creator_subscription_status: {
        Args: {
          status_param: string
          stripe_customer_id_param?: string
          stripe_subscription_id_param?: string
          tier_param?: string
          user_id_param: string
        }
        Returns: Json
      }
      update_message_status: {
        Args: { message_id_param: string; new_status_param: string }
        Returns: boolean
      }
      validate_api_key: {
        Args: {
          key_user_id: string
          raw_key: string
          stored_encrypted_key: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "creator" | "fan" | "sponsor"
      content_type:
        | "community_post"
        | "community_message"
        | "post_comment"
        | "user_profile"
        | "user_bio"
        | "shared_link"
        | "image"
        | "video"
      creator_type:
        | "musician"
        | "podcaster"
        | "video_creator"
        | "comedian"
        | "author"
        | "artist"
        | "dancer"
        | "gamer"
        | "fitness_trainer"
        | "chef"
        | "educator"
        | "lifestyle_influencer"
        | "tech_creator"
        | "beauty_creator"
        | "travel_creator"
        | "other"
      moderation_action:
        | "approved"
        | "warning"
        | "shadow_ban"
        | "content_removed"
        | "account_restricted"
        | "account_suspended"
        | "manual_review"
        | "appealed"
      moderation_category:
        | "violence_incitement"
        | "safety_harassment"
        | "authenticity_spam"
        | "privacy_doxxing"
        | "intellectual_property"
        | "regulated_goods"
        | "community_standards"
        | "nudity_sexual"
        | "hate_speech"
        | "misinformation"
      moderation_severity: "low" | "medium" | "high" | "critical"
      transaction_type:
        | "XP_PURCHASE_FAN_SHARE"
        | "XP_PURCHASE_PLATFORM_SHARE"
        | "MARKETPLACE_SALE_XP"
        | "MARKETPLACE_FEE_XP"
        | "CREATOR_CASH_OUT_REQUEST"
        | "CREATOR_CASH_OUT_PAYOUT"
        | "CASH_OUT_FEE_FIAT"
        | "SPONSOR_PAYMENT_FIAT"
        | "BRAND_DEAL_FEE_FIAT"
        | "SUBSCRIPTION_FEE_FIAT"
        | "REWARD_SALE_XP"
        | "TIP_PAYMENT_XP"
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
      app_role: ["admin", "moderator", "creator", "fan", "sponsor"],
      content_type: [
        "community_post",
        "community_message",
        "post_comment",
        "user_profile",
        "user_bio",
        "shared_link",
        "image",
        "video",
      ],
      creator_type: [
        "musician",
        "podcaster",
        "video_creator",
        "comedian",
        "author",
        "artist",
        "dancer",
        "gamer",
        "fitness_trainer",
        "chef",
        "educator",
        "lifestyle_influencer",
        "tech_creator",
        "beauty_creator",
        "travel_creator",
        "other",
      ],
      moderation_action: [
        "approved",
        "warning",
        "shadow_ban",
        "content_removed",
        "account_restricted",
        "account_suspended",
        "manual_review",
        "appealed",
      ],
      moderation_category: [
        "violence_incitement",
        "safety_harassment",
        "authenticity_spam",
        "privacy_doxxing",
        "intellectual_property",
        "regulated_goods",
        "community_standards",
        "nudity_sexual",
        "hate_speech",
        "misinformation",
      ],
      moderation_severity: ["low", "medium", "high", "critical"],
      transaction_type: [
        "XP_PURCHASE_FAN_SHARE",
        "XP_PURCHASE_PLATFORM_SHARE",
        "MARKETPLACE_SALE_XP",
        "MARKETPLACE_FEE_XP",
        "CREATOR_CASH_OUT_REQUEST",
        "CREATOR_CASH_OUT_PAYOUT",
        "CASH_OUT_FEE_FIAT",
        "SPONSOR_PAYMENT_FIAT",
        "BRAND_DEAL_FEE_FIAT",
        "SUBSCRIPTION_FEE_FIAT",
        "REWARD_SALE_XP",
        "TIP_PAYMENT_XP",
      ],
      xp_type: ["platform", "creator_specific", "transferable"],
    },
  },
} as const
