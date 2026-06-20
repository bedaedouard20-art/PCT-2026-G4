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
      activites_pedagogiques: {
        Row: {
          cours_id: string | null
          created_at: string
          date_activite: string
          description: string | null
          enseignant_id: string
          id: string
          niveau_ressource: Database["public"]["Enums"]["niveau_ressource"]
          nombre_heures_ressource: number
          type_activite: Database["public"]["Enums"]["type_activite"]
          updated_at: string
          valide: boolean
          volume_horaire_calcule: number
        }
        Insert: {
          cours_id?: string | null
          created_at?: string
          date_activite?: string
          description?: string | null
          enseignant_id: string
          id?: string
          niveau_ressource: Database["public"]["Enums"]["niveau_ressource"]
          nombre_heures_ressource: number
          type_activite: Database["public"]["Enums"]["type_activite"]
          updated_at?: string
          valide?: boolean
          volume_horaire_calcule?: number
        }
        Update: {
          cours_id?: string | null
          created_at?: string
          date_activite?: string
          description?: string | null
          enseignant_id?: string
          id?: string
          niveau_ressource?: Database["public"]["Enums"]["niveau_ressource"]
          nombre_heures_ressource?: number
          type_activite?: Database["public"]["Enums"]["type_activite"]
          updated_at?: string
          valide?: boolean
          volume_horaire_calcule?: number
        }
        Relationships: [
          {
            foreignKeyName: "activites_pedagogiques_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activites_pedagogiques_enseignant_id_fkey"
            columns: ["enseignant_id"]
            isOneToOne: false
            referencedRelation: "enseignants"
            referencedColumns: ["id"]
          },
        ]
      }
      cours: {
        Row: {
          created_at: string
          credits: number
          enseignant_id: string | null
          filiere: string
          id: string
          intitule: string
          niveau: Database["public"]["Enums"]["niveau_cours"]
          nombre_heures: number
          semestre: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits?: number
          enseignant_id?: string | null
          filiere: string
          id?: string
          intitule: string
          niveau: Database["public"]["Enums"]["niveau_cours"]
          nombre_heures?: number
          semestre: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          enseignant_id?: string | null
          filiere?: string
          id?: string
          intitule?: string
          niveau?: Database["public"]["Enums"]["niveau_cours"]
          nombre_heures?: number
          semestre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cours_enseignant_id_fkey"
            columns: ["enseignant_id"]
            isOneToOne: false
            referencedRelation: "enseignants"
            referencedColumns: ["id"]
          },
        ]
      }
      departements: {
        Row: {
          code: string | null
          created_at: string
          id: string
          nom: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          nom: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          nom?: string
        }
        Relationships: []
      }
      enseignants: {
        Row: {
          charge_statutaire: number
          created_at: string
          departement_id: string | null
          email: string
          grade: Database["public"]["Enums"]["grade_enseignant"]
          id: string
          nom: string
          prenom: string
          statut: Database["public"]["Enums"]["statut_enseignant"]
          taux_horaire: number
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          charge_statutaire?: number
          created_at?: string
          departement_id?: string | null
          email: string
          grade?: Database["public"]["Enums"]["grade_enseignant"]
          id?: string
          nom: string
          prenom: string
          statut?: Database["public"]["Enums"]["statut_enseignant"]
          taux_horaire?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          charge_statutaire?: number
          created_at?: string
          departement_id?: string | null
          email?: string
          grade?: Database["public"]["Enums"]["grade_enseignant"]
          id?: string
          nom?: string
          prenom?: string
          statut?: Database["public"]["Enums"]["statut_enseignant"]
          taux_horaire?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enseignants_departement_id_fkey"
            columns: ["departement_id"]
            isOneToOne: false
            referencedRelation: "departements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string
          prenom: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nom?: string
          prenom?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string
          prenom?: string
          telephone?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretaire" | "enseignant"
      grade_enseignant: "assistant" | "maitre_assistant" | "professeur"
      niveau_cours: "L1" | "L2" | "L3" | "M1" | "M2"
      niveau_ressource: "niveau_1" | "niveau_2" | "niveau_3"
      statut_enseignant: "permanent" | "vacataire"
      type_activite: "creation" | "mise_a_jour"
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
      app_role: ["admin", "secretaire", "enseignant"],
      grade_enseignant: ["assistant", "maitre_assistant", "professeur"],
      niveau_cours: ["L1", "L2", "L3", "M1", "M2"],
      niveau_ressource: ["niveau_1", "niveau_2", "niveau_3"],
      statut_enseignant: ["permanent", "vacataire"],
      type_activite: ["creation", "mise_a_jour"],
    },
  },
} as const
