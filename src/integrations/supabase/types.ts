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
  public: {
    Tables: {
      exercise_attempts: {
        Row: {
          created_at: string
          exercise_kind: Database["public"]["Enums"]["exercise_kind"]
          id: string
          is_correct: boolean
          item_id: string | null
          user_answer: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          exercise_kind: Database["public"]["Enums"]["exercise_kind"]
          id?: string
          is_correct: boolean
          item_id?: string | null
          user_answer?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          exercise_kind?: Database["public"]["Enums"]["exercise_kind"]
          id?: string
          is_correct?: boolean
          item_id?: string | null
          user_answer?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      grammar_items: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          item_type: Database["public"]["Enums"]["grammar_item_type"]
          options: string[]
          question: string
          topic: string
        }
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["grammar_item_type"]
          options?: string[]
          question: string
          topic: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["grammar_item_type"]
          options?: string[]
          question?: string
          topic?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          created_at: string
          daily_xp_goal: number
          display_name: string | null
          id: string
          interests: string[]
          onboarded: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          daily_xp_goal?: number
          display_name?: string | null
          id?: string
          interests?: string[]
          onboarded?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          daily_xp_goal?: number
          display_name?: string | null
          id?: string
          interests?: string[]
          onboarded?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_practice_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
          user_level: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          user_level?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          user_level?: number
        }
        Relationships: []
      }
      vocabulary_items: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          created_at: string
          example_en: string | null
          example_es: string | null
          id: string
          topic: string
          translation_es: string
          word_en: string
        }
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          example_en?: string | null
          example_es?: string | null
          id?: string
          topic: string
          translation_es: string
          word_en: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          example_en?: string | null
          example_es?: string | null
          id?: string
          topic?: string
          translation_es?: string
          word_en?: string
        }
        Relationships: []
      }
      vocabulary_progress: {
        Row: {
          created_at: string
          id: string
          mastery_level: number
          next_review_at: string
          times_correct: number
          times_seen: number
          updated_at: string
          user_id: string
          vocabulary_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mastery_level?: number
          next_review_at?: string
          times_correct?: number
          times_seen?: number
          updated_at?: string
          user_id: string
          vocabulary_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mastery_level?: number
          next_review_at?: string
          times_correct?: number
          times_seen?: number
          updated_at?: string
          user_id?: string
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_progress_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1"
      exercise_kind:
        | "vocab_flashcard"
        | "vocab_multiple_choice"
        | "vocab_translate"
        | "grammar_multiple_choice"
        | "grammar_fill_blank"
        | "ai_correction"
      grammar_item_type: "multiple_choice" | "fill_blank"
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
      cefr_level: ["A1", "A2", "B1", "B2", "C1"],
      exercise_kind: [
        "vocab_flashcard",
        "vocab_multiple_choice",
        "vocab_translate",
        "grammar_multiple_choice",
        "grammar_fill_blank",
        "ai_correction",
      ],
      grammar_item_type: ["multiple_choice", "fill_blank"],
    },
  },
} as const
