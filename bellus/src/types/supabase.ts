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
          comissao_salao_pct: number;
          meta_comissao_salao: number;
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
          comissao_salao_pct?: number;
          meta_comissao_salao?: number;
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
          comissao_salao_pct?: number;
          meta_comissao_salao?: number;
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
          opt_out_notificacoes: boolean;
          proximo_retorno: string | null;
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
          opt_out_notificacoes?: boolean;
          proximo_retorno?: string | null;
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
          opt_out_notificacoes?: boolean;
          proximo_retorno?: string | null;
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
      notification_templates: {
        Row: {
          id: string;
          salao_id: string;
          tipo: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
          idioma: "pt" | "es" | "en" | "ru";
          template: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salao_id: string;
          tipo: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
          idioma: "pt" | "es" | "en" | "ru";
          template: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string;
          tipo?: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
          idioma?: "pt" | "es" | "en" | "ru";
          template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transacoes: {
        Row: {
          id: string;
          salao_id: string;
          agendamento_id: string | null;
          cliente_id: string | null;
          profissional_id: string | null;
          servico_id: string | null;
          valor: number;
          tipo_desconto: "percentual" | "fixo" | null;
          valor_desconto: number;
          valor_final: number;
          forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salao_id: string;
          agendamento_id?: string | null;
          cliente_id?: string | null;
          profissional_id?: string | null;
          servico_id?: string | null;
          valor: number;
          tipo_desconto?: "percentual" | "fixo" | null;
          valor_desconto?: number;
          valor_final: number;
          forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string;
          agendamento_id?: string | null;
          cliente_id?: string | null;
          profissional_id?: string | null;
          servico_id?: string | null;
          valor?: number;
          tipo_desconto?: "percentual" | "fixo" | null;
          valor_desconto?: number;
          valor_final?: number;
          forma_pagamento?: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      despesas: {
        Row: {
          id: string;
          salao_id: string;
          descricao: string;
          categoria: "produtos" | "aluguel" | "formacao" | "suprimentos" | "cuota_autonomos" | "outros";
          valor: number;
          data: string;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salao_id: string;
          descricao: string;
          categoria: "produtos" | "aluguel" | "formacao" | "suprimentos" | "cuota_autonomos" | "outros";
          valor: number;
          data?: string;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string;
          descricao?: string;
          categoria?: "produtos" | "aluguel" | "formacao" | "suprimentos" | "cuota_autonomos" | "outros";
          valor?: number;
          data?: string;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      configuracoes_fiscais: {
        Row: {
          id: string;
          salao_id: string;
          iva_pct: number;
          irpf_pct: number;
          cuota_autonomos_mensual: number;
          nif: string | null;
          nombre_fiscal: string | null;
          serie_factura: string;
          emitir_factura_auto: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salao_id: string;
          iva_pct?: number;
          irpf_pct?: number;
          cuota_autonomos_mensual?: number;
          nif?: string | null;
          nombre_fiscal?: string | null;
          serie_factura?: string;
          emitir_factura_auto?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salao_id?: string;
          iva_pct?: number;
          irpf_pct?: number;
          cuota_autonomos_mensual?: number;
          nif?: string | null;
          nombre_fiscal?: string | null;
          serie_factura?: string;
          emitir_factura_auto?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bloqueios: {
        Row: {
          id: string;
          profissional_id: string;
          salao_id: string;
          data_hora_inicio: string;
          data_hora_fim: string;
          dia_inteiro: boolean;
          motivo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profissional_id: string;
          salao_id: string;
          data_hora_inicio: string;
          data_hora_fim: string;
          dia_inteiro?: boolean;
          motivo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profissional_id?: string;
          salao_id?: string;
          data_hora_inicio?: string;
          data_hora_fim?: string;
          dia_inteiro?: boolean;
          motivo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // EPIC-09 Verifactu — Story 9.1
      facturas: {
        Row: {
          id: string;
          salao_id: string;
          transacao_id: string | null;
          serie: string;
          numero: number;
          numero_completo: string;
          cliente_id: string | null;
          profissional_id: string | null;
          agendamento_id: string | null;
          fecha_emision: string;
          base_imponible: number;
          iva_pct: number;
          iva_valor: number;
          irpf_pct: number;
          irpf_valor: number;
          total: number;
          forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          hash_anterior: string | null;
          hash_actual: string | null;
          firma_digital: string | null;
          qr_data: string | null;
          estado_aeat: "pendiente" | "enviado" | "aceptado" | "rechazado";
          xml_verifactu: string | null;
          notas: string | null;
          factura_rectificada_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salao_id: string;
          transacao_id?: string | null;
          serie?: string;
          numero: number;
          cliente_id?: string | null;
          profissional_id?: string | null;
          agendamento_id?: string | null;
          fecha_emision?: string;
          base_imponible: number;
          iva_pct?: number;
          iva_valor: number;
          irpf_pct?: number;
          irpf_valor?: number;
          total: number;
          forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
          hash_anterior?: string | null;
          hash_actual?: string | null;
          firma_digital?: string | null;
          qr_data?: string | null;
          estado_aeat?: "pendiente" | "enviado" | "aceptado" | "rechazado";
          xml_verifactu?: string | null;
          notas?: string | null;
          factura_rectificada_id?: string | null;
          created_at?: string;
        };
        Update: {
          estado_aeat?: "pendiente" | "enviado" | "aceptado" | "rechazado";
        }; // apenas estado_aeat atualizavel (resposta AEAT)
        Relationships: [];
      };
      factura_lineas: {
        Row: {
          id: string;
          factura_id: string;
          servico_id: string | null;
          descripcion: string;
          cantidad: number;
          precio_unitario: number;
          iva_pct: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          factura_id: string;
          servico_id?: string | null;
          descripcion: string;
          cantidad?: number;
          precio_unitario: number;
          iva_pct?: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          factura_id?: string;
          servico_id?: string | null;
          descripcion?: string;
          cantidad?: number;
          precio_unitario?: number;
          iva_pct?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      factura_eventos: {
        Row: {
          id: string;
          factura_id: string | null;
          salao_id: string;
          tipo_evento: "emision" | "anulacion" | "rectificacion" | "envio_aeat" | "error_aeat" | "consulta";
          detalle: Record<string, unknown>;
          usuario_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          factura_id?: string | null;
          salao_id: string;
          tipo_evento: "emision" | "anulacion" | "rectificacion" | "envio_aeat" | "error_aeat" | "consulta";
          detalle?: Record<string, unknown>;
          usuario_id?: string | null;
          created_at?: string;
        };
        Update: never; // append-only (audit log imutavel)
        Relationships: [];
      };
      factura_envios_aeat: {
        Row: {
          id: string;
          factura_id: string;
          xml_enviado: string | null;
          response_code: string | null;
          response_body: string | null;
          status: "pendiente" | "enviado" | "aceptado" | "rechazado" | "error";
          enviado_em: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          factura_id: string;
          xml_enviado?: string | null;
          response_code?: string | null;
          response_body?: string | null;
          status?: "pendiente" | "enviado" | "aceptado" | "rechazado" | "error";
          enviado_em?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          factura_id?: string;
          xml_enviado?: string | null;
          response_code?: string | null;
          response_body?: string | null;
          status?: "pendiente" | "enviado" | "aceptado" | "rechazado" | "error";
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
      get_next_factura_numero: {
        Args: { p_salao_id: string; p_serie?: string };
        Returns: number;
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
      estado_aeat: "pendiente" | "enviado" | "aceptado" | "rechazado";
      tipo_evento_factura: "emision" | "anulacion" | "rectificacion" | "envio_aeat" | "error_aeat" | "consulta";
      status_envio_aeat: "pendiente" | "enviado" | "aceptado" | "rechazado" | "error";
    };
  };
};
