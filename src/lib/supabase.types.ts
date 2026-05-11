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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_timeline: {
        Row: {
          action_id: string
          at: string
          id: string
          text: string
        }
        Insert: {
          action_id: string
          at?: string
          id?: string
          text: string
        }
        Update: {
          action_id?: string
          at?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_timeline_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          delegate_name: string | null
          delegate_note: string | null
          delegated_at: string | null
          dropped_at: string | null
          expected_return_date: string | null
          goal_id: string
          id: string
          impact: number
          is_sample: boolean
          notes: string | null
          planned_at: string | null
          project_id: string | null
          scheduled_date: string | null
          status: string
          time_estimate_minutes: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          delegate_name?: string | null
          delegate_note?: string | null
          delegated_at?: string | null
          dropped_at?: string | null
          expected_return_date?: string | null
          goal_id: string
          id?: string
          impact: number
          is_sample?: boolean
          notes?: string | null
          planned_at?: string | null
          project_id?: string | null
          scheduled_date?: string | null
          status?: string
          time_estimate_minutes?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          delegate_name?: string | null
          delegate_note?: string | null
          delegated_at?: string | null
          dropped_at?: string | null
          expected_return_date?: string | null
          goal_id?: string
          id?: string
          impact?: number
          is_sample?: boolean
          notes?: string | null
          planned_at?: string | null
          project_id?: string | null
          scheduled_date?: string | null
          status?: string
          time_estimate_minutes?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      day_entries: {
        Row: {
          closed_at: string | null
          date: string
          day_type: string | null
          id: string
          is_closed: boolean
          is_planned: boolean
          is_sample: boolean
          main_task_action_id: string | null
          planned_action_ids: string[] | null
          planned_ritual_ids: string[] | null
          skipped_ritual_ids: string[] | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          date: string
          day_type?: string | null
          id?: string
          is_closed?: boolean
          is_planned?: boolean
          is_sample?: boolean
          main_task_action_id?: string | null
          planned_action_ids?: string[] | null
          planned_ritual_ids?: string[] | null
          skipped_ritual_ids?: string[] | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          date?: string
          day_type?: string | null
          id?: string
          is_closed?: boolean
          is_planned?: boolean
          is_sample?: boolean
          main_task_action_id?: string | null
          planned_action_ids?: string[] | null
          planned_ritual_ids?: string[] | null
          skipped_ritual_ids?: string[] | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_entries_main_task_action_id_fkey"
            columns: ["main_task_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_success_criteria: {
        Row: {
          created_at: string
          done: boolean
          goal_id: string
          id: string
          sort_order: number
          text: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          goal_id: string
          id?: string
          sort_order?: number
          text: string
        }
        Update: {
          created_at?: string
          done?: boolean
          goal_id?: string
          id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_success_criteria_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string
          completed_at: string | null
          created_at: string
          description: string | null
          dropped_at: string | null
          id: string
          is_sample: boolean
          status: string
          target_date: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          dropped_at?: string | null
          id?: string
          is_sample?: boolean
          status?: string
          target_date?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          dropped_at?: string | null
          id?: string
          is_sample?: boolean
          status?: string
          target_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_image_attachments: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          idea_id: string
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          idea_id: string
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          idea_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_image_attachments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_references: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_references_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          captured_at: string
          converted_to_id: string | null
          discarded_at: string | null
          goal_id: string
          id: string
          is_sample: boolean
          note: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          converted_to_id?: string | null
          discarded_at?: string | null
          goal_id: string
          id?: string
          is_sample?: boolean
          note?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          captured_at?: string
          converted_to_id?: string | null
          discarded_at?: string | null
          goal_id?: string
          id?: string
          is_sample?: boolean
          note?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_references: {
        Row: {
          created_at: string
          id: string
          project_id: string
          sort_order: number
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          sort_order?: number
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          sort_order?: number
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_references_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          completed_at: string | null
          created_at: string
          description: Json | null
          dropped_at: string | null
          goal_id: string
          id: string
          is_draft: boolean
          is_sample: boolean
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: Json | null
          dropped_at?: string | null
          goal_id: string
          id?: string
          is_draft?: boolean
          is_sample?: boolean
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: Json | null
          dropped_at?: string | null
          goal_id?: string
          id?: string
          is_draft?: boolean
          is_sample?: boolean
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_completions: {
        Row: {
          at: string
          date: string
          id: string
          ritual_id: string
          status: string
        }
        Insert: {
          at?: string
          date: string
          id?: string
          ritual_id: string
          status?: string
        }
        Update: {
          at?: string
          date?: string
          id?: string
          ritual_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_completions_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      rituals: {
        Row: {
          archived_at: string | null
          base_impact: number
          created_at: string
          goal_id: string
          id: string
          is_sample: boolean
          notes: string | null
          project_id: string | null
          schedule: string
          schedule_config: Json | null
          status: string
          time_estimate_minutes: number | null
          title: string
          total_completions: number
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          base_impact: number
          created_at?: string
          goal_id: string
          id?: string
          is_sample?: boolean
          notes?: string | null
          project_id?: string | null
          schedule: string
          schedule_config?: Json | null
          status?: string
          time_estimate_minutes?: number | null
          title: string
          total_completions?: number
          user_id: string
        }
        Update: {
          archived_at?: string | null
          base_impact?: number
          created_at?: string
          goal_id?: string
          id?: string
          is_sample?: boolean
          notes?: string | null
          project_id?: string | null
          schedule?: string
          schedule_config?: Json | null
          status?: string
          time_estimate_minutes?: number | null
          title?: string
          total_completions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rituals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rituals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rituals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          break_duration: number
          completed_action_ids: string[] | null
          cycles_completed: number
          cycles_planned: number
          dropped_action_ids: string[] | null
          ended_at: string | null
          id: string
          is_sample: boolean
          mode: string
          planned_action_ids: string[] | null
          reflection: string | null
          started_at: string
          status: string
          user_id: string
          work_duration: number
        }
        Insert: {
          break_duration?: number
          completed_action_ids?: string[] | null
          cycles_completed?: number
          cycles_planned?: number
          dropped_action_ids?: string[] | null
          ended_at?: string | null
          id?: string
          is_sample?: boolean
          mode: string
          planned_action_ids?: string[] | null
          reflection?: string | null
          started_at?: string
          status: string
          user_id: string
          work_duration: number
        }
        Update: {
          break_duration?: number
          completed_action_ids?: string[] | null
          cycles_completed?: number
          cycles_planned?: number
          dropped_action_ids?: string[] | null
          ended_at?: string | null
          id?: string
          is_sample?: boolean
          mode?: string
          planned_action_ids?: string[] | null
          reflection?: string | null
          started_at?: string
          status?: string
          user_id?: string
          work_duration?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_seed: string | null
          billing_cycle: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_admin: boolean
          price_locked_at: number | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          avatar_seed?: string | null
          billing_cycle?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean
          price_locked_at?: number | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          avatar_seed?: string | null
          billing_cycle?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          price_locked_at?: number | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
