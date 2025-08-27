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
      configuracion_sitio: {
        Row: {
          clave: string
          descripcion: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          clave: string
          descripcion?: string | null
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          clave?: string
          descripcion?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      estadisticas: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          numero: string
          orden: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          numero: string
          orden?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          numero?: string
          orden?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      eventos_deportivos: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          orden: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          orden?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          orden?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos_destacados: {
        Row: {
          activo: boolean | null
          audiencia: string
          created_at: string
          id: string
          nombre: string
          orden: number | null
          participantes: string
          ranking: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          audiencia: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number | null
          participantes: string
          ranking: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          audiencia?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number | null
          participantes?: string
          ranking?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos_digitales: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          orden: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          orden?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          orden?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          id: string
          logo: string | null
          nombre: string
          orden: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          id?: string
          logo?: string | null
          nombre: string
          orden?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          id?: string
          logo?: string | null
          nombre?: string
          orden?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          items: string[]
          orden: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          items?: string[]
          orden?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          items?: string[]
          orden?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonios: {
        Row: {
          activo: boolean | null
          avatar: string | null
          cargo: string
          created_at: string
          id: string
          nombre: string
          orden: number | null
          testimonio: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          avatar?: string | null
          cargo: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number | null
          testimonio: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          avatar?: string | null
          cargo?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number | null
          testimonio?: string
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
  public: {
    Enums: {},
  },
} as const
