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
      atividades: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_atividade: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          proxima_acao: string | null
          resultado: string | null
          status: string | null
          tipo: string
          titulo: string
          user_id: string
          vendedor_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_atividade?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          proxima_acao?: string | null
          resultado?: string | null
          status?: string | null
          tipo: string
          titulo: string
          user_id: string
          vendedor_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_atividade?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          proxima_acao?: string | null
          resultado?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          created_at: string
          data_pagamento: string | null
          id: string
          mes_referencia: string
          observacoes: string | null
          percentual: number
          status: string
          updated_at: string
          user_id: string
          valor_comissao: number
          valor_venda: number
          venda_id: string
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          observacoes?: string | null
          percentual: number
          status?: string
          updated_at?: string
          user_id: string
          valor_comissao: number
          valor_venda: number
          venda_id: string
          vendedor_id: string
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          observacoes?: string | null
          percentual?: number
          status?: string
          updated_at?: string
          user_id?: string
          valor_comissao?: number
          valor_venda?: number
          venda_id?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      contrato_servicos: {
        Row: {
          contrato_id: string
          created_at: string
          id: string
          quantidade: number
          servico_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          id?: string
          quantidade?: number
          servico_id: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          id?: string
          quantidade?: number
          servico_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_contrato_servicos_contrato_id"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contrato_servicos_servico_id"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cliente_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          pdf_url: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          pdf_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          pdf_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_contratos_cliente_id"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_images: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          id: string
          ordem: number | null
          tipo: string | null
          titulo: string
          updated_at: string
          url_imagem: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          url_imagem: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          url_imagem?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          cargo: string | null
          created_at: string
          data_contato: string | null
          data_proxima_acao: string | null
          email: string
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          proxima_acao: string | null
          status: string
          telefone: string | null
          temperatura: string | null
          updated_at: string
          user_id: string
          valor_estimado: number | null
          vendedor_id: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          data_contato?: string | null
          data_proxima_acao?: string | null
          email: string
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          proxima_acao?: string | null
          status?: string
          telefone?: string | null
          temperatura?: string | null
          updated_at?: string
          user_id: string
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          data_contato?: string | null
          data_proxima_acao?: string | null
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          proxima_acao?: string | null
          status?: string
          telefone?: string | null
          temperatura?: string | null
          updated_at?: string
          user_id?: string
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Relationships: []
      }
      metas_faturamento: {
        Row: {
          bonus_meta: number | null
          created_at: string
          descricao: string | null
          id: string
          mes_ano: string
          meta_contratos: number | null
          meta_faturamento: number
          meta_novos_clientes: number | null
          meta_vendas: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_meta?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          mes_ano: string
          meta_contratos?: number | null
          meta_faturamento: number
          meta_novos_clientes?: number | null
          meta_vendas?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_meta?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          mes_ano?: string
          meta_contratos?: number | null
          meta_faturamento?: number
          meta_novos_clientes?: number | null
          meta_vendas?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metas_vendedores: {
        Row: {
          bonus_meta: number | null
          created_at: string
          id: string
          mes_ano: string
          meta_clientes: number | null
          meta_vendas: number
          status: string | null
          updated_at: string
          user_id: string
          vendedor_id: string
        }
        Insert: {
          bonus_meta?: number | null
          created_at?: string
          id?: string
          mes_ano: string
          meta_clientes?: number | null
          meta_vendas: number
          status?: string | null
          updated_at?: string
          user_id: string
          vendedor_id: string
        }
        Update: {
          bonus_meta?: number | null
          created_at?: string
          id?: string
          mes_ano?: string
          meta_clientes?: number | null
          meta_vendas?: number
          status?: string | null
          updated_at?: string
          user_id?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          endereco: string | null
          id: string
          meta_mensal: number | null
          name: string | null
          percentual_comissao: number | null
          role: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          meta_mensal?: number | null
          name?: string | null
          percentual_comissao?: number | null
          role?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          meta_mensal?: number | null
          name?: string | null
          percentual_comissao?: number | null
          role?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          nivel_complexidade: string | null
          nome: string
          tempo_entrega_dias: number | null
          tipo_cobranca: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nivel_complexidade?: string | null
          nome: string
          tempo_entrega_dias?: number | null
          tipo_cobranca?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nivel_complexidade?: string | null
          nome?: string
          tempo_entrega_dias?: number | null
          tipo_cobranca?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          categoria_id: string | null
          comprovante_url: string | null
          created_at: string
          data_transacao: string
          descricao: string | null
          id: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
          venda_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string | null
          id?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
          venda_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string | null
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_servicos: {
        Row: {
          created_at: string
          id: string
          quantidade: number
          servico_id: string
          valor_total: number
          valor_unitario: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantidade?: number
          servico_id: string
          valor_total: number
          valor_unitario: number
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantidade?: number
          servico_id?: string
          valor_total?: number
          valor_unitario?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_servicos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_id: string
          created_at: string
          data_venda: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          parcelas: number | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_venda?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          parcelas?: number | null
          status: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_venda?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          parcelas?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendas_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
