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
      campaigns: {
        Row: {
          cash_reward: number | null
          created_at: string
          creator_id: string
          current_progress: number | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          max_participants: number | null
          requirements: string | null
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
          cash_reward?: number | null
          created_at?: string
          creator_id: string
          current_progress?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          max_participants?: number | null
          requirements?: string | null
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
          cash_reward?: number | null
          created_at?: string
          creator_id?: string
          current_progress?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          max_participants?: number | null
          requirements?: string | null
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
          created_at: string
          denied_at: string | null
          flagged_content: boolean
          flagged_reason: string | null
          id: string
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
          created_at?: string
          denied_at?: string | null
          flagged_content?: boolean
          flagged_reason?: string | null
          id?: string
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
          created_at?: string
          denied_at?: string | null
          flagged_content?: boolean
          flagged_reason?: string | null
          id?: string
          recipient_id?: string
          sender_id?: string
          sentiment_score?: number | null
          status?: string
          updated_at?: string
          xp_cost?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string | null
          location: string | null
          merch_store_connected: boolean | null
          merch_store_connected_at: string | null
          merch_store_platform: string | null
          merch_store_url: string | null
          spotify_connected: boolean | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string | null
          location?: string | null
          merch_store_connected?: boolean | null
          merch_store_connected_at?: string | null
          merch_store_platform?: string | null
          merch_store_url?: string | null
          spotify_connected?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string | null
          location?: string | null
          merch_store_connected?: boolean | null
          merch_store_connected_at?: string | null
          merch_store_platform?: string | null
          merch_store_url?: string | null
          spotify_connected?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
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
      rewards: {
        Row: {
          cash_price: number | null
          created_at: string
          creator_id: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
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
          created_at?: string
          creator_id: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
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
          created_at?: string
          creator_id?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
