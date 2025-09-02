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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidaturas: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          objetivo_vendas: string
          sobre_voce: string
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          objetivo_vendas: string
          sobre_voce: string
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          objetivo_vendas?: string
          sobre_voce?: string
          status?: string
          telefone?: string
          updated_at?: string
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      colunas_kanban: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          posicao: number
          projeto_id: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          posicao?: number
          projeto_id: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          posicao?: number
          projeto_id?: string
          user_id?: string
        }
        Relationships: []
      }
      comentarios_tarefa: {
        Row: {
          comentario: string
          created_at: string
          id: string
          tarefa_id: string
          user_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          id?: string
          tarefa_id: string
          user_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          id?: string
          tarefa_id?: string
          user_id?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          contrato_id: string | null
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
          venda_id: string | null
          vendedor_id: string
        }
        Insert: {
          contrato_id?: string | null
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
          venda_id?: string | null
          vendedor_id: string
        }
        Update: {
          contrato_id?: string | null
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
          venda_id?: string | null
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
          descricao: string | null
          dia_vencimento: number | null
          id: string
          numero_contrato: string | null
          observacoes: string | null
          pdf_url: string | null
          status: string
          tipo_contrato: string | null
          titulo: string | null
          updated_at: string
          user_id: string
          valor: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_vencimento?: number | null
          id?: string
          numero_contrato?: string | null
          observacoes?: string | null
          pdf_url?: string | null
          status?: string
          tipo_contrato?: string | null
          titulo?: string | null
          updated_at?: string
          user_id: string
          valor?: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_vencimento?: number | null
          id?: string
          numero_contrato?: string | null
          observacoes?: string | null
          pdf_url?: string | null
          status?: string
          tipo_contrato?: string | null
          titulo?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_contratos_cliente_id"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_recorrencias: {
        Row: {
          contrato_id: string
          created_at: string
          data_processamento: string | null
          id: string
          mes_referencia: string
          status: string
          updated_at: string
          valor_mes: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_processamento?: string | null
          id?: string
          mes_referencia: string
          status?: string
          updated_at?: string
          valor_mes?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_processamento?: string | null
          id?: string
          mes_referencia?: string
          status?: string
          updated_at?: string
          valor_mes?: number
        }
        Relationships: []
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
      eventos: {
        Row: {
          cor: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          google_event_id: string | null
          id: string
          local: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          google_event_id?: string | null
          id?: string
          local?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          google_event_id?: string | null
          id?: string
          local?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string
          updated_at?: string
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
          percentual_comissao_contrato: number | null
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
          percentual_comissao_contrato?: number | null
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
          percentual_comissao_contrato?: number | null
          role?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          privado: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          privado?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          privado?: boolean
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
          custo: number | null
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
          custo?: number | null
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
          custo?: number | null
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
      tarefa_responsaveis: {
        Row: {
          created_at: string
          id: string
          tarefa_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tarefa_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tarefa_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          coluna_id: string
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          id: string
          labels: string[] | null
          posicao: number
          prioridade: string | null
          projeto_id: string
          status: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coluna_id: string
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          labels?: string[] | null
          posicao?: number
          prioridade?: string | null
          projeto_id: string
          status?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coluna_id?: string
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          labels?: string[] | null
          posicao?: number
          prioridade?: string | null
          projeto_id?: string
          status?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          categoria_id: string | null
          comissao_id: string | null
          comprovante_url: string | null
          created_at: string
          data_transacao: string
          data_vencimento: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          parcela_atual: number | null
          parcelas: number | null
          status: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
          venda_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          comissao_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_transacao?: string
          data_vencimento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          parcelas?: number | null
          status?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
          venda_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          comissao_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_transacao?: string
          data_vencimento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          parcelas?: number | null
          status?: string | null
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
            foreignKeyName: "transacoes_financeiras_comissao_id_fkey"
            columns: ["comissao_id"]
            isOneToOne: false
            referencedRelation: "comissoes"
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
      calculate_missing_commissions: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      cancel_future_contract_accounts: {
        Args: { p_contrato_id: string }
        Returns: undefined
      }
      cleanup_orphan_commission_payables: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_orphan_receivables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_default_kanban_columns: {
        Args: { projeto_id: string; user_id: string }
        Returns: undefined
      }
      fix_contract_types_and_generate_missing_installments: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          contrato_id: string
          installments_created: number
          months_duration: number
          numero_contrato: string
        }[]
      }
      fix_sales_financial_transactions: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          cliente_nome: string
          data_venda: string
          message: string
          valor: number
          venda_id: string
        }[]
      }
      generate_contract_number: {
        Args: { client_id: string; client_name: string }
        Returns: string
      }
      generate_future_contract_commissions: {
        Args: { p_contrato_id: string }
        Returns: undefined
      }
      generate_future_receivables_and_payables: {
        Args: { p_contrato_id: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_sales_financial_issues_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          count_issues: number
          description: string
          issue_type: string
        }[]
      }
      mark_commission_as_paid: {
        Args: { p_comissao_id: string }
        Returns: undefined
      }
      process_contract_recurrences: {
        Args: { target_month?: string }
        Returns: undefined
      }
      sync_all_commissions_to_financial: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_commissions_to_financial: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      validate_delete_conta_receber: {
        Args: { conta_id: string }
        Returns: {
          can_delete: boolean
          message: string
        }[]
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
      verify_admin_role: {
        Args: Record<PropertyKey, never>
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
