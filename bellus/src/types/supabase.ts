// Tipos gerados manualmente baseados no schema de migrations.
// Após conectar ao Supabase, regenerar com:
// supabase gen types typescript --local > src/types/supabase.ts

export type Database = {
  public: {
    Tables: {
      saloes: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          whatsapp: string | null;
          timezone: string;
          moeda: string;
          logo_url: string | null;
          cor_primaria: string;
          endereco: string | null;
          telefone: string | null;
          horario_funcionamento: Record<string, unknown> | null;
          instagram_url: string | null;
          google_maps_url: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          whatsapp?: string | null;
          timezone?: string;
          moeda?: string;
          logo_url?: string | null;
          cor_primaria?: string;
          endereco?: string | null;
          telefone?: string | null;
          horario_funcionamento?: Record<string, unknown> | null;
          instagram_url?: string | null;
          google_maps_url?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          whatsapp?: string | null;
          timezone?: string;
          moeda?: string;
          logo_url?: string | null;
          cor_primaria?: string;
          endereco?: string | null;
          telefone?: string | null;
          horario_funcionamento?: Record<string, unknown> | null;
          instagram_url?: string | null;
          google_maps_url?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      usuarios: {
        Row: {
          id: string;
          salao_id: string;
          role: "proprietario" | "profissional" | "cliente";
          nome: string;
          email: string;
          criado_em: string;
        };
        Insert: {
          id: string;
          salao_id: string;
          role: "proprietario" | "profissional" | "cliente";
          nome: string;
          email: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          salao_id?: string;
          role?: "proprietario" | "profissional" | "cliente";
          nome?: string;
          email?: string;
          criado_em?: string;
        };
        Relationships: [];
      };
      profissionais: {
        Row: {
          id: string;
          user_id: string;
          salao_id: string | null;
          nome: string;
          email: string;
          telefone: string | null;
          role: "proprietario" | "profissional";
          cor_agenda: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          salao_id?: string | null;
          nome: string;
          email: string;
          telefone?: string | null;
          role?: "proprietario" | "profissional";
          cor_agenda?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          salao_id?: string | null;
          nome?: string;
          email?: string;
          telefone?: string | null;
          role?: "proprietario" | "profissional";
          cor_agenda?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          salao_id: string | null;
          nome: string;
          email: string | null;
          telefone: string | null;
          idioma_preferido: "pt" | "es" | "en" | "ru";
          notas: string | null;
          intervalo_retorno_dias: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          idioma_preferido?: "pt" | "es" | "en" | "ru";
          notas?: string | null;
          intervalo_retorno_dias?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          idioma_preferido?: "pt" | "es" | "en" | "ru";
          notas?: string | null;
          intervalo_retorno_dias?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      servicos: {
        Row: {
          id: string;
          salao_id: string | null;
          nome: string;
          descricao: string | null;
          duracao_minutos: number;
          preco_base: number;
          categoria: "corte" | "coloracao" | "mechas" | "tratamento" | "outro";
          intervalo_retorno_dias: number | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          nome: string;
          descricao?: string | null;
          duracao_minutos: number;
          preco_base: number;
          categoria?: "corte" | "coloracao" | "mechas" | "tratamento" | "outro";
          intervalo_retorno_dias?: number | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          nome?: string;
          descricao?: string | null;
          duracao_minutos?: number;
          preco_base?: number;
          categoria?: "corte" | "coloracao" | "mechas" | "tratamento" | "outro";
          intervalo_retorno_dias?: number | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      servicos_profissionais: {
        Row: {
          id: string;
          servico_id: string;
          profissional_id: string;
          preco_override: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          servico_id: string;
          profissional_id: string;
          preco_override?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          servico_id?: string;
          profissional_id?: string;
          preco_override?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agendamentos: {
        Row: {
          id: string;
          salao_id: string | null;
          cliente_id: string;
          profissional_id: string;
          servico_id: string;
          data_hora_inicio: string;
          data_hora_fim: string;
          status: "pendente" | "confirmado" | "concluido" | "cancelado";
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          cliente_id: string;
          profissional_id: string;
          servico_id: string;
          data_hora_inicio: string;
          data_hora_fim: string;
          status?: "pendente" | "confirmado" | "concluido" | "cancelado";
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          cliente_id?: string;
          profissional_id?: string;
          servico_id?: string;
          data_hora_inicio?: string;
          data_hora_fim?: string;
          status?: "pendente" | "confirmado" | "concluido" | "cancelado";
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pagamentos: {
        Row: {
          id: string;
          salao_id: string | null;
          agendamento_id: string;
          valor_bruto: number;
          desconto: number;
          valor_liquido: number;
          iva_pct: number;
          iva_valor: number;
          forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          created_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          agendamento_id: string;
          valor_bruto: number;
          desconto?: number;
          valor_liquido: number;
          iva_pct?: number;
          iva_valor: number;
          forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          created_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          agendamento_id?: string;
          valor_bruto?: number;
          desconto?: number;
          valor_liquido?: number;
          iva_pct?: number;
          iva_valor?: number;
          forma_pagamento?: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          created_at?: string;
        };
        Relationships: [];
      };
      transacoes_fiscais: {
        Row: {
          id: string;
          salao_id: string | null;
          pagamento_id: string;
          trimestre: number;
          ano: number;
          tipo: "IVA" | "IRPF";
          valor: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          pagamento_id: string;
          trimestre: number;
          ano: number;
          tipo: "IVA" | "IRPF";
          valor: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          pagamento_id?: string;
          trimestre?: number;
          ano?: number;
          tipo?: "IVA" | "IRPF";
          valor?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      lembretes_config: {
        Row: {
          id: string;
          salao_id: string | null;
          servico_id: string;
          cliente_id: string | null;
          intervalo_dias: number;
          template_mensagem: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          servico_id: string;
          cliente_id?: string | null;
          intervalo_dias: number;
          template_mensagem: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          servico_id?: string;
          cliente_id?: string | null;
          intervalo_dias?: number;
          template_mensagem?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notificacoes_log: {
        Row: {
          id: string;
          salao_id: string | null;
          cliente_id: string;
          agendamento_id: string | null;
          tipo: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
          mensagem: string;
          status: "pendente" | "enviado" | "falhou";
          enviado_em: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salao_id?: string | null;
          cliente_id: string;
          agendamento_id?: string | null;
          tipo: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
          mensagem: string;
          status?: "pendente" | "enviado" | "falhou";
          enviado_em?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string | null;
          cliente_id?: string;
          agendamento_id?: string | null;
          tipo?: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
          mensagem?: string;
          status?: "pendente" | "enviado" | "falhou";
          enviado_em?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      salao_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      role_profissional: "proprietario" | "profissional";
      idioma: "pt" | "es" | "en" | "ru";
      categoria_servico: "corte" | "coloracao" | "mechas" | "tratamento" | "outro";
      status_agendamento: "pendente" | "confirmado" | "concluido" | "cancelado";
      forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
      tipo_transacao: "IVA" | "IRPF";
      tipo_notificacao: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
      status_notificacao: "pendente" | "enviado" | "falhou";
      role_usuario: "proprietario" | "profissional" | "cliente";
    };
  };
};
