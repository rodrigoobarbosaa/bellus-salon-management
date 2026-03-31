"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getNextFacturaNumero, getSerieFactura } from "@/lib/verifactu/numeracao";
import { calculateFacturaHash, getLastHash, getTipoFactura } from "@/lib/verifactu/hash";
import { signFacturaHash, getSalaoPrivateKey } from "@/lib/verifactu/signature";
import { buildFacturaXml } from "@/lib/verifactu/xml-builder";
import { generateVerifactuQRData } from "@/lib/verifactu/qr-generator";
import { submitFacturaToAeat } from "@/app/actions/verifactu";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Factura,
  FacturaCompleta,
  FacturaLinea,
  FacturasFilters,
  FormaPagamento,
} from "@/lib/verifactu/types";

async function getUserSalaoId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, salaoId: null };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    salaoId: (usuario as { salao_id: string } | null)?.salao_id ?? null,
  };
}

// ============================================================
// createFactura — gera fatura a partir de uma transação
// ============================================================
export async function createFactura(transacaoId: string) {
  const supabase = await createClient();
  const { userId, salaoId } = await getUserSalaoId(supabase);

  if (!salaoId || !userId) {
    return { error: "No autenticado o salón no encontrado.", data: null };
  }

  // 1. Buscar configuração fiscal (NIF obrigatório)
  const { data: configFiscal } = await supabase
    .from("configuracoes_fiscais")
    .select("*")
    .eq("salao_id", salaoId)
    .single();

  const config = configFiscal as {
    iva_pct: number;
    irpf_pct: number;
    nif: string | null;
    nombre_fiscal: string | null;
    serie_factura: string;
  } | null;

  if (!config || !config.nif) {
    return {
      error: "Configure o NIF nas configurações fiscais antes de emitir faturas.",
      data: null,
    };
  }

  // 2. Buscar transação
  const { data: transacao, error: txError } = await supabase
    .from("transacoes")
    .select("*")
    .eq("id", transacaoId)
    .eq("salao_id", salaoId)
    .single();

  if (txError || !transacao) {
    return { error: "Transação não encontrada.", data: null };
  }

  const tx = transacao as {
    id: string;
    salao_id: string;
    agendamento_id: string | null;
    cliente_id: string | null;
    profissional_id: string | null;
    servico_id: string | null;
    valor: number;
    valor_final: number;
    forma_pagamento: FormaPagamento;
    notas: string | null;
  };

  // Buscar nome do serviço se existir
  let servicoNome = "Serviço";
  if (tx.servico_id) {
    const { data: servico } = await supabase
      .from("servicos")
      .select("nome")
      .eq("id", tx.servico_id)
      .single();
    if (servico) servicoNome = (servico as { nome: string }).nome;
  }

  // 3. Verificar se já existe fatura para esta transação
  const { data: existing } = await supabase
    .from("facturas")
    .select("id")
    .eq("transacao_id", transacaoId)
    .limit(1);

  if (existing && (existing as { id: string }[]).length > 0) {
    return { error: "Já existe uma fatura para esta transação.", data: null };
  }

  // 4. Calcular valores fiscais
  const baseImponible = tx.valor_final;
  const ivaPct = config.iva_pct;
  const irpfPct = config.irpf_pct;
  const ivaValor = Math.round(baseImponible * (ivaPct / 100) * 100) / 100;
  const irpfValor = Math.round(baseImponible * (irpfPct / 100) * 100) / 100;
  const total = Math.round((baseImponible + ivaValor - irpfValor) * 100) / 100;

  // 5. Obter série e número atómico
  const serie = config.serie_factura || "B";
  const numero = await getNextFacturaNumero(salaoId, serie);
  const numeroCompleto = `${serie}-${String(numero).padStart(6, "0")}`;
  const fechaEmision = new Date().toISOString();

  // 5b. Calcular hash encadeado (RD 1007/2023)
  const hashAnterior = await getLastHash(salaoId, serie);
  const tipoFactura = getTipoFactura(total);
  const hashActual = calculateFacturaHash({
    nif: config.nif!,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    tipo_factura: tipoFactura,
    base_imponible: baseImponible,
    cuota_iva: ivaValor,
    importe_total: total,
    hash_anterior: hashAnterior,
  });

  // 5c. Assinatura eletrónica (modo degradado se sem certificado)
  const privateKey = await getSalaoPrivateKey(salaoId);
  const signResult = signFacturaHash(hashActual, privateKey);

  // 5d. Gerar XML Verifactu (antes do INSERT — facturas é append-only)
  const preFactura = {
    numero_completo: numeroCompleto,
    fecha_emision: fechaEmision,
    base_imponible: baseImponible,
    iva_pct: ivaPct,
    iva_valor: ivaValor,
    total,
    hash_anterior: hashAnterior,
    hash_actual: hashActual,
    firma_digital: signResult.firma_digital,
  } as Factura;
  const xmlVerifactu = buildFacturaXml({
    factura: preFactura,
    nif_emisor: config.nif!,
    nombre_emisor: config.nombre_fiscal || "Bellus",
  });

  // 5e. QR Code Verifactu
  const qrData = generateVerifactuQRData({
    nif: config.nif!,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    importe_total: total,
    hash_actual: hashActual,
  });

  // 6. Inserir fatura
  const { data: factura, error: insertError } = await supabase
    .from("facturas")
    .insert({
      salao_id: salaoId,
      transacao_id: transacaoId,
      serie,
      numero,
      cliente_id: tx.cliente_id,
      profissional_id: tx.profissional_id,
      agendamento_id: tx.agendamento_id,
      fecha_emision: fechaEmision,
      base_imponible: baseImponible,
      iva_pct: ivaPct,
      iva_valor: ivaValor,
      irpf_pct: irpfPct,
      irpf_valor: irpfValor,
      total,
      forma_pagamento: tx.forma_pagamento,
      hash_anterior: hashAnterior,
      hash_actual: hashActual,
      firma_digital: signResult.firma_digital,
      qr_data: qrData,
      xml_verifactu: xmlVerifactu,
      estado_aeat: "pendiente" as const,
      notas: tx.notas,
    })
    .select("*")
    .single();

  if (insertError || !factura) {
    console.error("Error creating factura:", insertError);
    return { error: "Error al crear la factura.", data: null };
  }

  const f = factura as Factura;

  // 7. Criar linha(s) da fatura
  const precioUnitario = tx.valor_final;

  await supabase.from("factura_lineas").insert({
    factura_id: f.id,
    servico_id: tx.servico_id,
    descripcion: servicoNome,
    cantidad: 1,
    precio_unitario: precioUnitario,
    iva_pct: ivaPct,
    subtotal: precioUnitario,
  });

  // 8. Registrar evento de emissão
  await supabase.from("factura_eventos").insert({
    factura_id: f.id,
    salao_id: salaoId,
    tipo_evento: "emision" as const,
    detalle: {
      transacao_id: transacaoId,
      numero_completo: `${serie}-${String(numero).padStart(6, "0")}`,
      total,
    },
    usuario_id: userId,
  });

  revalidatePath("/dashboard/facturas");
  revalidatePath("/dashboard/caixa");
  return { data: f, error: null };
}

// ============================================================
// createFacturaFromComanda — gera fatura a partir de múltiplas transações de comanda
// ============================================================
export async function createFacturaFromComanda(transacaoIds: string[]) {
  const supabase = await createClient();
  const { userId, salaoId } = await getUserSalaoId(supabase);

  if (!salaoId || !userId) {
    return { error: "No autenticado o salón no encontrado.", data: null };
  }

  // 1. Buscar configuração fiscal
  const { data: configFiscal } = await supabase
    .from("configuracoes_fiscais")
    .select("*")
    .eq("salao_id", salaoId)
    .single();

  const config = configFiscal as {
    iva_pct: number;
    irpf_pct: number;
    nif: string | null;
    serie_factura: string;
  } | null;

  if (!config || !config.nif) {
    return { error: "Configure o NIF nas configurações fiscais antes de emitir faturas.", data: null };
  }

  // 2. Buscar transações
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("*")
    .in("id", transacaoIds)
    .eq("salao_id", salaoId);

  if (!transacoes || (transacoes as unknown[]).length === 0) {
    return { error: "Transações não encontradas.", data: null };
  }

  const txList = transacoes as {
    id: string;
    cliente_id: string | null;
    profissional_id: string | null;
    agendamento_id: string | null;
    valor_final: number;
    forma_pagamento: FormaPagamento;
    servico_id: string | null;
    notas: string | null;
  }[];

  // Buscar nomes dos serviços
  const servicoIds = txList.map((t) => t.servico_id).filter(Boolean) as string[];
  const servicoMap = new Map<string, string>();
  if (servicoIds.length > 0) {
    const { data: servicos } = await supabase
      .from("servicos")
      .select("id, nome")
      .in("id", servicoIds);
    if (servicos) {
      for (const s of servicos as { id: string; nome: string }[]) {
        servicoMap.set(s.id, s.nome);
      }
    }
  }

  // 3. Calcular totais
  const totalBase = txList.reduce((sum, tx) => sum + tx.valor_final, 0);
  const ivaPct = config.iva_pct;
  const irpfPct = config.irpf_pct;
  const ivaValor = Math.round(totalBase * (ivaPct / 100) * 100) / 100;
  const irpfValor = Math.round(totalBase * (irpfPct / 100) * 100) / 100;
  const total = Math.round((totalBase + ivaValor - irpfValor) * 100) / 100;

  const serie = config.serie_factura || "B";
  const numero = await getNextFacturaNumero(salaoId, serie);
  const numeroCompleto = `${serie}-${String(numero).padStart(6, "0")}`;
  const fechaEmision = new Date().toISOString();

  // 3b. Hash encadeado
  const hashAnterior = await getLastHash(salaoId, serie);
  const tipoFactura = getTipoFactura(total);
  const hashActual = calculateFacturaHash({
    nif: config.nif!,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    tipo_factura: tipoFactura,
    base_imponible: totalBase,
    cuota_iva: ivaValor,
    importe_total: total,
    hash_anterior: hashAnterior,
  });

  // 3c. Assinatura eletrónica
  const privateKey = await getSalaoPrivateKey(salaoId);
  const signResult = signFacturaHash(hashActual, privateKey);

  // 3d. Gerar XML Verifactu
  const preFactura = {
    numero_completo: numeroCompleto,
    fecha_emision: fechaEmision,
    base_imponible: totalBase,
    iva_pct: ivaPct,
    iva_valor: ivaValor,
    total,
    hash_anterior: hashAnterior,
    hash_actual: hashActual,
    firma_digital: signResult.firma_digital,
  } as Factura;
  const xmlVerifactu = buildFacturaXml({
    factura: preFactura,
    nif_emisor: config.nif!,
    nombre_emisor: "Bellus",
  });
  const qrData = generateVerifactuQRData({
    nif: config.nif!,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    importe_total: total,
    hash_actual: hashActual,
  });

  const firstTx = txList[0];

  // 4. Inserir fatura
  const { data: factura, error: insertError } = await supabase
    .from("facturas")
    .insert({
      salao_id: salaoId,
      transacao_id: firstTx.id,
      serie,
      numero,
      cliente_id: firstTx.cliente_id,
      profissional_id: firstTx.profissional_id,
      agendamento_id: firstTx.agendamento_id,
      fecha_emision: fechaEmision,
      base_imponible: totalBase,
      iva_pct: ivaPct,
      iva_valor: ivaValor,
      irpf_pct: irpfPct,
      irpf_valor: irpfValor,
      total,
      forma_pagamento: firstTx.forma_pagamento,
      hash_anterior: hashAnterior,
      hash_actual: hashActual,
      firma_digital: signResult.firma_digital,
      qr_data: qrData,
      xml_verifactu: xmlVerifactu,
      estado_aeat: "pendiente" as const,
    })
    .select("*")
    .single();

  if (insertError || !factura) {
    console.error("Error creating factura:", insertError);
    return { error: "Error al crear la factura.", data: null };
  }

  const f = factura as Factura;

  // 5. Criar linhas para cada transação/serviço
  const lineas = txList.map((tx) => ({
    factura_id: f.id,
    servico_id: tx.servico_id,
    descripcion: (tx.servico_id ? servicoMap.get(tx.servico_id) : null) ?? "Serviço",
    cantidad: 1,
    precio_unitario: tx.valor_final,
    iva_pct: ivaPct,
    subtotal: tx.valor_final,
  }));

  await supabase.from("factura_lineas").insert(lineas);

  // 6. Registrar evento
  await supabase.from("factura_eventos").insert({
    factura_id: f.id,
    salao_id: salaoId,
    tipo_evento: "emision" as const,
    detalle: {
      transacao_ids: transacaoIds,
      numero_completo: `${serie}-${String(numero).padStart(6, "0")}`,
      total,
    },
    usuario_id: userId,
  });

  revalidatePath("/dashboard/facturas");
  revalidatePath("/dashboard/caixa");
  return { data: f, error: null };
}

// ============================================================
// getFacturas — listagem com paginação e filtros
// ============================================================
export async function getFacturas(filters: FacturasFilters = {}) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado.", data: null, count: 0 };
  }

  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("facturas")
    .select("*", { count: "exact" })
    .eq("salao_id", salaoId)
    .order("fecha_emision", { ascending: false })
    .range(from, to);

  if (filters.fecha_desde) {
    query = query.gte("fecha_emision", filters.fecha_desde);
  }
  if (filters.fecha_hasta) {
    query = query.lte("fecha_emision", filters.fecha_hasta);
  }
  if (filters.estado_aeat) {
    query = query.eq("estado_aeat", filters.estado_aeat);
  }
  if (filters.cliente_id) {
    query = query.eq("cliente_id", filters.cliente_id);
  }
  if (filters.busca) {
    query = query.ilike("numero_completo", `%${filters.busca}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching facturas:", error);
    return { error: "Error al obtener facturas.", data: null, count: 0 };
  }

  return {
    data: (data ?? []) as Factura[],
    count: count ?? 0,
    error: null,
  };
}

// ============================================================
// getFacturaById — detalhe completo com linhas, eventos e envios
// ============================================================
export async function getFacturaById(facturaId: string) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado.", data: null };
  }

  const { data: factura, error } = await supabase
    .from("facturas")
    .select("*")
    .eq("id", facturaId)
    .eq("salao_id", salaoId)
    .single();

  if (error || !factura) {
    return { error: "Factura no encontrada.", data: null };
  }

  const f = factura as Factura;

  // Buscar linhas, eventos, envios + relações em paralelo
  const [lineasRes, eventosRes, enviosRes, clienteRes, profRes] = await Promise.all([
    supabase
      .from("factura_lineas")
      .select("*")
      .eq("factura_id", facturaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("factura_eventos")
      .select("*")
      .eq("factura_id", facturaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("factura_envios_aeat")
      .select("*")
      .eq("factura_id", facturaId)
      .order("created_at", { ascending: false }),
    f.cliente_id
      ? supabase.from("clientes").select("id, nome, email, telefone").eq("id", f.cliente_id).single()
      : Promise.resolve({ data: null }),
    f.profissional_id
      ? supabase.from("profissionais").select("id, nome").eq("id", f.profissional_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const result: FacturaCompleta = {
    ...f,
    cliente: (clienteRes.data as { id: string; nome: string; email: string | null; telefone: string | null } | null) ?? null,
    profissional: (profRes.data as { id: string; nome: string } | null) ?? null,
    lineas: (lineasRes.data ?? []) as FacturaLinea[],
    eventos: (eventosRes.data ?? []) as FacturaCompleta["eventos"],
    envios_aeat: (enviosRes.data ?? []) as FacturaCompleta["envios_aeat"],
  };

  return { data: result, error: null };
}

// ============================================================
// anularFactura — cria fatura retificativa com valores negativos
// ============================================================
export async function anularFactura(facturaId: string, motivo: string) {
  const supabase = await createClient();
  const { userId, salaoId } = await getUserSalaoId(supabase);

  if (!salaoId || !userId) {
    return { error: "No autenticado o salón no encontrado.", data: null };
  }

  if (!motivo || motivo.trim().length === 0) {
    return { error: "O motivo da anulação é obrigatório.", data: null };
  }

  // 1. Buscar fatura original
  const { data: original, error: fetchError } = await supabase
    .from("facturas")
    .select("*")
    .eq("id", facturaId)
    .eq("salao_id", salaoId)
    .single();

  if (fetchError || !original) {
    return { error: "Factura no encontrada.", data: null };
  }

  const orig = original as Factura;

  // 2. Verificar se já foi anulada
  const { data: existingAnulacao } = await supabase
    .from("factura_eventos")
    .select("id")
    .eq("factura_id", facturaId)
    .eq("tipo_evento", "anulacion")
    .limit(1);

  if (existingAnulacao && (existingAnulacao as { id: string }[]).length > 0) {
    return { error: "Esta factura ya fue anulada.", data: null };
  }

  // 3. Obter número para a retificativa + NIF para hash
  const serie = orig.serie;
  const numero = await getNextFacturaNumero(salaoId, serie);
  const numeroCompleto = `${serie}-${String(numero).padStart(6, "0")}`;
  const fechaEmision = new Date().toISOString();

  const { data: configFiscal } = await supabase
    .from("configuracoes_fiscais")
    .select("nif")
    .eq("salao_id", salaoId)
    .single();
  const nif = (configFiscal as { nif: string | null } | null)?.nif || "";

  // 3b. Hash encadeado para a retificativa
  const negTotal = -orig.total;
  const hashAnterior = await getLastHash(salaoId, serie);
  const hashActual = calculateFacturaHash({
    nif,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    tipo_factura: "R1",
    base_imponible: -orig.base_imponible,
    cuota_iva: -orig.iva_valor,
    importe_total: negTotal,
    hash_anterior: hashAnterior,
  });

  // 3c. Assinatura eletrónica
  const privateKey = await getSalaoPrivateKey(salaoId);
  const signResult = signFacturaHash(hashActual, privateKey);

  // 3d. Gerar XML Verifactu (RegistroAnulacion)
  const preRetificativa = {
    numero_completo: numeroCompleto,
    fecha_emision: fechaEmision,
    base_imponible: -orig.base_imponible,
    iva_pct: orig.iva_pct,
    iva_valor: -orig.iva_valor,
    total: negTotal,
    hash_anterior: hashAnterior,
    hash_actual: hashActual,
    firma_digital: signResult.firma_digital,
  } as Factura;
  const xmlVerifactu = buildFacturaXml({
    factura: preRetificativa,
    nif_emisor: nif,
    nombre_emisor: "Bellus",
  });
  const qrData = generateVerifactuQRData({
    nif,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    importe_total: negTotal,
    hash_actual: hashActual,
  });

  // 4. Criar fatura retificativa (valores negativos)
  const { data: retificativa, error: insertError } = await supabase
    .from("facturas")
    .insert({
      salao_id: salaoId,
      transacao_id: orig.transacao_id,
      serie,
      numero,
      cliente_id: orig.cliente_id,
      profissional_id: orig.profissional_id,
      agendamento_id: orig.agendamento_id,
      fecha_emision: fechaEmision,
      base_imponible: -orig.base_imponible,
      iva_pct: orig.iva_pct,
      iva_valor: -orig.iva_valor,
      irpf_pct: orig.irpf_pct,
      irpf_valor: -orig.irpf_valor,
      total: negTotal,
      forma_pagamento: orig.forma_pagamento,
      hash_anterior: hashAnterior,
      hash_actual: hashActual,
      firma_digital: signResult.firma_digital,
      qr_data: qrData,
      xml_verifactu: xmlVerifactu,
      estado_aeat: "pendiente" as const,
      notas: `Anulación de ${orig.numero_completo}: ${motivo}`,
      factura_rectificada_id: facturaId,
    })
    .select("*")
    .single();

  if (insertError || !retificativa) {
    console.error("Error creating retificativa:", insertError);
    return { error: "Error al crear la factura rectificativa.", data: null };
  }

  const ret = retificativa as Factura;

  // 5. Copiar linhas com valores negativos
  const { data: lineasOrig } = await supabase
    .from("factura_lineas")
    .select("*")
    .eq("factura_id", facturaId);

  if (lineasOrig && (lineasOrig as FacturaLinea[]).length > 0) {
    const lineasNeg = (lineasOrig as FacturaLinea[]).map((l) => ({
      factura_id: ret.id,
      servico_id: l.servico_id,
      descripcion: l.descripcion,
      cantidad: -l.cantidad,
      precio_unitario: l.precio_unitario,
      iva_pct: l.iva_pct,
      subtotal: -l.subtotal,
    }));
    await supabase.from("factura_lineas").insert(lineasNeg);
  }

  // 6. Registrar evento de anulação na fatura original
  await supabase.from("factura_eventos").insert({
    factura_id: facturaId,
    salao_id: salaoId,
    tipo_evento: "anulacion" as const,
    detalle: {
      motivo,
      retificativa_id: ret.id,
      retificativa_numero: ret.numero_completo,
    },
    usuario_id: userId,
  });

  // 7. Registrar evento de emissão na retificativa
  await supabase.from("factura_eventos").insert({
    factura_id: ret.id,
    salao_id: salaoId,
    tipo_evento: "rectificacion" as const,
    detalle: {
      factura_original_id: facturaId,
      factura_original_numero: orig.numero_completo,
      motivo,
    },
    usuario_id: userId,
  });

  // 8. Envio automático da retificativa à AEAT
  try {
    await submitFacturaToAeat(ret.id);
  } catch {
    // Non-blocking: retificativa criada mesmo se envio falhar
    console.error("AEAT submission failed for rectificativa:", ret.id);
  }

  revalidatePath("/dashboard/facturas");
  return { data: ret, error: null };
}
