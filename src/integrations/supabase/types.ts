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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      certificados: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          razao_social: string | null
          senha_certificado: string
          storage_path: string | null
          ultimo_nsu: string | null
          updated_at: string | null
          user_id: string
          validade: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          razao_social?: string | null
          senha_certificado: string
          storage_path?: string | null
          ultimo_nsu?: string | null
          updated_at?: string | null
          user_id: string
          validade?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          razao_social?: string | null
          senha_certificado?: string
          storage_path?: string | null
          ultimo_nsu?: string | null
          updated_at?: string | null
          user_id?: string
          validade?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          cargo: string | null
          created_at: string | null
          email: string | null
          fornecedor_id: string
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          fornecedor_id: string
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          fornecedor_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      dividas_fornecedor: {
        Row: {
          created_at: string | null
          fornecedor_id: string
          id: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          fornecedor_id: string
          id?: string
          updated_at?: string | null
          valor_total?: number
        }
        Update: {
          created_at?: string | null
          fornecedor_id?: string
          id?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividas_fornecedor_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cnpj: string
          created_at: string | null
          endereco: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          telefone: string | null
          total_compras: number | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          telefone?: string | null
          total_compras?: number | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          telefone?: string | null
          total_compras?: number | null
        }
        Relationships: []
      }
      historico_pedidos: {
        Row: {
          created_at: string | null
          data: string
          despesa_valor_cofins: number | null
          despesa_valor_desconto: number | null
          despesa_valor_frete: number | null
          despesa_valor_icms: number | null
          despesa_valor_icms_st: number | null
          despesa_valor_ipi: number | null
          despesa_valor_outras: number | null
          despesa_valor_pis: number | null
          despesa_valor_produto: number | null
          despesa_valor_seguro: number | null
          fornecedor_id: string
          fornecedor_nome: string
          id: string
          nfe_id: string
          nfe_numero: string
          produto_id: string
          quantidade: number
          quantidade_embalagem: number | null
          valor_imposto: number | null
          valor_total: number
          valor_total_com_despesas: number
          valor_unitario: number
          valor_unitario_real: number
        }
        Insert: {
          created_at?: string | null
          data: string
          despesa_valor_cofins?: number | null
          despesa_valor_desconto?: number | null
          despesa_valor_frete?: number | null
          despesa_valor_icms?: number | null
          despesa_valor_icms_st?: number | null
          despesa_valor_ipi?: number | null
          despesa_valor_outras?: number | null
          despesa_valor_pis?: number | null
          despesa_valor_produto?: number | null
          despesa_valor_seguro?: number | null
          fornecedor_id: string
          fornecedor_nome: string
          id?: string
          nfe_id: string
          nfe_numero: string
          produto_id: string
          quantidade: number
          quantidade_embalagem?: number | null
          valor_imposto?: number | null
          valor_total: number
          valor_total_com_despesas: number
          valor_unitario: number
          valor_unitario_real: number
        }
        Update: {
          created_at?: string | null
          data?: string
          despesa_valor_cofins?: number | null
          despesa_valor_desconto?: number | null
          despesa_valor_frete?: number | null
          despesa_valor_icms?: number | null
          despesa_valor_icms_st?: number | null
          despesa_valor_ipi?: number | null
          despesa_valor_outras?: number | null
          despesa_valor_pis?: number | null
          despesa_valor_produto?: number | null
          despesa_valor_seguro?: number | null
          fornecedor_id?: string
          fornecedor_nome?: string
          id?: string
          nfe_id?: string
          nfe_numero?: string
          produto_id?: string
          quantidade?: number
          quantidade_embalagem?: number | null
          valor_imposto?: number | null
          valor_total?: number
          valor_total_com_despesas?: number
          valor_unitario?: number
          valor_unitario_real?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_pedidos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_pedidos_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_pedidos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_produtos: {
        Row: {
          cfop: string | null
          codigo: string
          codigo_barras: string | null
          created_at: string | null
          descricao: string
          despesa_valor_cofins: number | null
          despesa_valor_desconto: number | null
          despesa_valor_frete: number | null
          despesa_valor_icms: number | null
          despesa_valor_icms_st: number | null
          despesa_valor_ipi: number | null
          despesa_valor_outras: number | null
          despesa_valor_pis: number | null
          despesa_valor_produto: number | null
          despesa_valor_seguro: number | null
          id: string
          ncm: string | null
          nfe_id: string
          produto_id: string
          quantidade: number
          quantidade_embalagem: number | null
          unidade: string
          valor_imposto: number | null
          valor_total: number
          valor_total_com_despesas: number
          valor_unitario: number
          valor_unitario_real: number
        }
        Insert: {
          cfop?: string | null
          codigo: string
          codigo_barras?: string | null
          created_at?: string | null
          descricao: string
          despesa_valor_cofins?: number | null
          despesa_valor_desconto?: number | null
          despesa_valor_frete?: number | null
          despesa_valor_icms?: number | null
          despesa_valor_icms_st?: number | null
          despesa_valor_ipi?: number | null
          despesa_valor_outras?: number | null
          despesa_valor_pis?: number | null
          despesa_valor_produto?: number | null
          despesa_valor_seguro?: number | null
          id?: string
          ncm?: string | null
          nfe_id: string
          produto_id: string
          quantidade: number
          quantidade_embalagem?: number | null
          unidade: string
          valor_imposto?: number | null
          valor_total: number
          valor_total_com_despesas: number
          valor_unitario: number
          valor_unitario_real: number
        }
        Update: {
          cfop?: string | null
          codigo?: string
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string
          despesa_valor_cofins?: number | null
          despesa_valor_desconto?: number | null
          despesa_valor_frete?: number | null
          despesa_valor_icms?: number | null
          despesa_valor_icms_st?: number | null
          despesa_valor_ipi?: number | null
          despesa_valor_outras?: number | null
          despesa_valor_pis?: number | null
          despesa_valor_produto?: number | null
          despesa_valor_seguro?: number | null
          id?: string
          ncm?: string | null
          nfe_id?: string
          produto_id?: string
          quantidade?: number
          quantidade_embalagem?: number | null
          unidade?: string
          valor_imposto?: number | null
          valor_total?: number
          valor_total_com_despesas?: number
          valor_unitario?: number
          valor_unitario_real?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfe_produtos_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      nfes: {
        Row: {
          chave_acesso: string
          created_at: string | null
          data_emissao: string
          fornecedor_id: string
          id: string
          importado_em: string | null
          numero: string
          serie: string
          valor_impostos: number | null
          valor_total: number
          xml_original: string | null
        }
        Insert: {
          chave_acesso: string
          created_at?: string | null
          data_emissao: string
          fornecedor_id: string
          id?: string
          importado_em?: string | null
          numero: string
          serie: string
          valor_impostos?: number | null
          valor_total: number
          xml_original?: string | null
        }
        Update: {
          chave_acesso?: string
          created_at?: string | null
          data_emissao?: string
          fornecedor_id?: string
          id?: string
          importado_em?: string | null
          numero?: string
          serie?: string
          valor_impostos?: number | null
          valor_total?: number
          xml_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_divida: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          divida_id: string
          id: string
          observacao: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          divida_id: string
          id?: string
          observacao?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          divida_id?: string
          id?: string
          observacao?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_divida_divida_id_fkey"
            columns: ["divida_id"]
            isOneToOne: false
            referencedRelation: "dividas_fornecedor"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          codigo: string
          codigo_barras: string | null
          created_at: string | null
          descricao: string
          id: string
          ncm: string | null
          quantidade_embalagem: number | null
          unidade: string
        }
        Insert: {
          codigo: string
          codigo_barras?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          ncm?: string | null
          quantidade_embalagem?: number | null
          unidade: string
        }
        Update: {
          codigo?: string
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          ncm?: string | null
          quantidade_embalagem?: number | null
          unidade?: string
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
