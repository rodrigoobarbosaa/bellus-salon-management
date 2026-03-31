export type EstadoAeat = "pendiente" | "enviado" | "aceptado" | "rechazado";
export type TipoEventoFactura = "emision" | "anulacion" | "rectificacion" | "envio_aeat" | "error_aeat" | "consulta";
export type StatusEnvioAeat = "pendiente" | "enviado" | "aceptado" | "rechazado" | "error";
export type FormaPagamento = "efectivo" | "tarjeta" | "bizum" | "transferencia";

export interface Factura {
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
  forma_pagamento: FormaPagamento;
  hash_anterior: string | null;
  hash_actual: string | null;
  firma_digital: string | null;
  qr_data: string | null;
  estado_aeat: EstadoAeat;
  xml_verifactu: string | null;
  notas: string | null;
  factura_rectificada_id: string | null;
  created_at: string;
}

export interface FacturaLinea {
  id: string;
  factura_id: string;
  servico_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_pct: number;
  subtotal: number;
  created_at: string;
}

export interface FacturaEvento {
  id: string;
  factura_id: string | null;
  salao_id: string;
  tipo_evento: TipoEventoFactura;
  detalle: Record<string, unknown>;
  usuario_id: string | null;
  created_at: string;
}

export interface FacturaEnvioAeat {
  id: string;
  factura_id: string;
  xml_enviado: string | null;
  response_code: string | null;
  response_body: string | null;
  status: StatusEnvioAeat;
  enviado_em: string | null;
  created_at: string;
}

export interface FacturaCompleta extends Factura {
  lineas: FacturaLinea[];
  eventos: FacturaEvento[];
  envios_aeat: FacturaEnvioAeat[];
  cliente?: { id: string; nome: string; email: string | null; telefone: string | null } | null;
  profissional?: { id: string; nome: string } | null;
}

export interface FacturasFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado_aeat?: EstadoAeat;
  cliente_id?: string;
  busca?: string;
  page?: number;
  per_page?: number;
}
