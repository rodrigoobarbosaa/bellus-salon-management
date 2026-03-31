/**
 * Validador estrutural XML Verifactu — Orden HAC/1177/2024
 *
 * Valida campos obrigatórios, formatos e valores permitidos
 * no XML gerado antes de envio à AEAT.
 *
 * Abordagem: validação TypeScript sem dependências nativas
 * (libxmljs2 requer bindings C++ incompatíveis com Vercel serverless).
 */

// --- Tipos permitidos conforme Orden HAC/1177/2024 ---

const TIPOS_FACTURA = ["F1", "F2", "F3", "R1", "R2", "R3", "R4", "R5"] as const;
const CLAVES_REGIMEN = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17"] as const;
const PRIMER_REGISTRO_VALUES = ["S", "N"] as const;

// NIF espanhol: letra + 8 dígitos, ou 8 dígitos + letra, ou X/Y/Z + 7 dígitos + letra
const NIF_REGEX = /^[A-Z]\d{8}$|^\d{8}[A-Z]$|^[XYZ]\d{7}[A-Z]$/;

// Data YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Importes: número com 2 decimais (pode ser negativo)
const AMOUNT_REGEX = /^-?\d+\.\d{2}$/;

// Hash SHA-256: 64 hex chars
const HASH_REGEX = /^[a-f0-9]{64}$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Extrai o texto entre tags XML (simples, sem atributos).
 * Retorna null se a tag não for encontrada.
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Verifica se o XML contém uma tag (com ou sem conteúdo, com ou sem atributos).
 */
function hasTag(xml: string, tagName: string): boolean {
  const regex = new RegExp(`<${tagName}[\\s>/]`);
  return regex.test(xml);
}

/**
 * Valida um RegistroAlta (nova fatura).
 */
function validateRegistroAlta(xml: string): string[] {
  const errors: string[] = [];

  // --- Cabecera ---
  if (!hasTag(xml, "sf:Cabecera")) {
    errors.push("Cabecera: bloco obrigatório em falta");
  } else {
    const version = extractTag(xml, "sf:IDVersion");
    if (!version) {
      errors.push("Cabecera.IDVersion: campo obrigatório em falta");
    } else if (version !== "1.0") {
      errors.push(`Cabecera.IDVersion: valor '${version}' inválido, esperado '1.0'`);
    }

    if (!hasTag(xml, "sf:ObligadoEmision")) {
      errors.push("Cabecera.ObligadoEmision: bloco obrigatório em falta");
    } else {
      const nifObligado = extractTag(xml, "sf:NIF");
      if (!nifObligado) {
        errors.push("ObligadoEmision.NIF: campo obrigatório em falta");
      }
      const nombreObligado = extractTag(xml, "sf:NombreRazon");
      if (!nombreObligado) {
        errors.push("ObligadoEmision.NombreRazon: campo obrigatório em falta");
      }
    }
  }

  // --- RegistroAlta ---
  if (!hasTag(xml, "sf:RegistroAlta")) {
    errors.push("RegistroAlta: bloco obrigatório em falta");
    return errors;
  }

  // IDFactura
  if (!hasTag(xml, "sf:IDFactura")) {
    errors.push("IDFactura: bloco obrigatório em falta");
  } else {
    const emisor = extractTag(xml, "sf:IDEmisorFactura");
    if (!emisor) {
      errors.push("IDFactura.IDEmisorFactura: campo obrigatório em falta");
    } else if (!NIF_REGEX.test(emisor)) {
      errors.push(`IDFactura.IDEmisorFactura: NIF '${emisor}' com formato inválido`);
    }

    const numSerie = extractTag(xml, "sf:NumSerieFactura");
    if (!numSerie) {
      errors.push("IDFactura.NumSerieFactura: campo obrigatório em falta");
    } else if (numSerie.length > 60) {
      errors.push(`IDFactura.NumSerieFactura: comprimento ${numSerie.length} excede máximo de 60 caracteres`);
    }

    const fecha = extractTag(xml, "sf:FechaExpedicionFactura");
    if (!fecha) {
      errors.push("IDFactura.FechaExpedicionFactura: campo obrigatório em falta");
    } else if (!DATE_REGEX.test(fecha)) {
      errors.push(`IDFactura.FechaExpedicionFactura: formato '${fecha}' inválido, esperado YYYY-MM-DD`);
    }
  }

  // TipoFactura
  const tipoFactura = extractTag(xml, "sf:TipoFactura");
  if (!tipoFactura) {
    errors.push("TipoFactura: campo obrigatório em falta");
  } else if (!(TIPOS_FACTURA as readonly string[]).includes(tipoFactura)) {
    errors.push(`TipoFactura: valor '${tipoFactura}' não é válido. Permitidos: ${TIPOS_FACTURA.join(", ")}`);
  }

  // ClaveRegimenIvaEsp
  const clave = extractTag(xml, "sf:ClaveRegimenIvaEsp");
  if (!clave) {
    errors.push("ClaveRegimenIvaEsp: campo obrigatório em falta");
  } else if (!(CLAVES_REGIMEN as readonly string[]).includes(clave)) {
    errors.push(`ClaveRegimenIvaEsp: valor '${clave}' não é válido. Permitidos: ${CLAVES_REGIMEN.join(", ")}`);
  }

  // DescripcionOperacion
  const desc = extractTag(xml, "sf:DescripcionOperacion");
  if (!desc) {
    errors.push("DescripcionOperacion: campo obrigatório em falta");
  } else if (desc.length > 500) {
    errors.push(`DescripcionOperacion: comprimento ${desc.length} excede máximo de 500 caracteres`);
  }

  // ImporteTotal
  const importeTotal = extractTag(xml, "sf:ImporteTotal");
  if (!importeTotal) {
    errors.push("ImporteTotal: campo obrigatório em falta");
  } else if (!AMOUNT_REGEX.test(importeTotal)) {
    errors.push(`ImporteTotal: formato '${importeTotal}' inválido, esperado número com 2 decimais`);
  }

  // Desglose > DetalleIVA
  if (!hasTag(xml, "sf:Desglose")) {
    errors.push("Desglose: bloco obrigatório em falta");
  } else {
    const baseImponible = extractTag(xml, "sf:BaseImponible");
    if (!baseImponible) {
      errors.push("Desglose.BaseImponible: campo obrigatório em falta");
    } else if (!AMOUNT_REGEX.test(baseImponible)) {
      errors.push(`Desglose.BaseImponible: formato '${baseImponible}' inválido`);
    }

    const cuota = extractTag(xml, "sf:CuotaRepercutida");
    if (!cuota) {
      errors.push("Desglose.CuotaRepercutida: campo obrigatório em falta");
    } else if (!AMOUNT_REGEX.test(cuota)) {
      errors.push(`Desglose.CuotaRepercutida: formato '${cuota}' inválido`);
    }

    const tipoImpositivo = extractTag(xml, "sf:TipoImpositivo");
    if (!tipoImpositivo) {
      errors.push("Desglose.TipoImpositivo: campo obrigatório em falta");
    } else if (!AMOUNT_REGEX.test(tipoImpositivo)) {
      errors.push(`Desglose.TipoImpositivo: formato '${tipoImpositivo}' inválido`);
    }
  }

  // Encadenamiento
  if (!hasTag(xml, "sf:Encadenamiento")) {
    errors.push("Encadenamiento: bloco obrigatório em falta");
  } else {
    const primer = extractTag(xml, "sf:PrimerRegistro");
    if (!primer) {
      errors.push("Encadenamiento.PrimerRegistro: campo obrigatório em falta");
    } else if (!(PRIMER_REGISTRO_VALUES as readonly string[]).includes(primer)) {
      errors.push(`Encadenamiento.PrimerRegistro: valor '${primer}' inválido, esperado S ou N`);
    }

    // Se não é primeiro registro, deve ter RegistroAnterior com Huella
    if (primer === "N") {
      if (!hasTag(xml, "sf:RegistroAnterior")) {
        errors.push("Encadenamiento.RegistroAnterior: obrigatório quando PrimerRegistro=N");
      }
    }
  }

  // SistemaInformatico
  if (!hasTag(xml, "sf:SistemaInformatico")) {
    errors.push("SistemaInformatico: bloco obrigatório em falta");
  } else {
    const nombreSistema = extractTag(xml, "sf:NombreSistemaInformatico");
    if (!nombreSistema) {
      errors.push("SistemaInformatico.NombreSistemaInformatico: campo obrigatório em falta");
    }
    const idSistema = extractTag(xml, "sf:IdSistemaInformatico");
    if (!idSistema) {
      errors.push("SistemaInformatico.IdSistemaInformatico: campo obrigatório em falta");
    }
    const versionSistema = extractTag(xml, "sf:Version");
    if (!versionSistema) {
      errors.push("SistemaInformatico.Version: campo obrigatório em falta");
    }
  }

  // Huella (hash da fatura)
  const huellas = xml.match(/<sf:Huella>([^<]*)<\/sf:Huella>/g) || [];
  // A última Huella no RegistroAlta é o hash_actual
  if (huellas.length === 0) {
    errors.push("Huella: pelo menos um hash obrigatório em falta");
  }

  return errors;
}

/**
 * Valida um RegistroAnulacion (anulação de fatura).
 */
function validateRegistroAnulacion(xml: string): string[] {
  const errors: string[] = [];

  // Cabecera
  if (!hasTag(xml, "sf:Cabecera")) {
    errors.push("Cabecera: bloco obrigatório em falta");
  }

  if (!hasTag(xml, "sf:RegistroAnulacion")) {
    errors.push("RegistroAnulacion: bloco obrigatório em falta");
    return errors;
  }

  // IDFactura
  if (!hasTag(xml, "sf:IDFactura")) {
    errors.push("IDFactura: bloco obrigatório em falta");
  } else {
    const emisor = extractTag(xml, "sf:IDEmisorFactura");
    if (!emisor) errors.push("IDFactura.IDEmisorFactura: campo obrigatório em falta");

    const numSerie = extractTag(xml, "sf:NumSerieFactura");
    if (!numSerie) errors.push("IDFactura.NumSerieFactura: campo obrigatório em falta");

    const fecha = extractTag(xml, "sf:FechaExpedicionFactura");
    if (!fecha) {
      errors.push("IDFactura.FechaExpedicionFactura: campo obrigatório em falta");
    } else if (!DATE_REGEX.test(fecha)) {
      errors.push(`IDFactura.FechaExpedicionFactura: formato '${fecha}' inválido`);
    }
  }

  // Encadenamiento
  if (!hasTag(xml, "sf:Encadenamiento")) {
    errors.push("Encadenamiento: bloco obrigatório em falta");
  }

  // SistemaInformatico
  if (!hasTag(xml, "sf:SistemaInformatico")) {
    errors.push("SistemaInformatico: bloco obrigatório em falta");
  }

  // Huella
  if (!hasTag(xml, "sf:Huella")) {
    errors.push("Huella: hash obrigatório em falta");
  }

  return errors;
}

/**
 * Valida XML Verifactu antes de envio à AEAT.
 *
 * Verifica:
 * - Estrutura XML correcta (SuministroFacturacion root)
 * - Todos os campos obrigatórios presentes
 * - Formatos de dados (NIF, datas, importes)
 * - Valores permitidos (TipoFactura, ClaveRegimen, etc.)
 * - Integridade do encadenamiento
 */
export function validateVerifactuXml(xml: string): ValidationResult {
  const errors: string[] = [];

  // Verificações básicas
  if (!xml || xml.trim().length === 0) {
    return { valid: false, errors: ["XML vazio"] };
  }

  if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
    errors.push("Declaração XML em falta ou incorreta (esperado: <?xml version=\"1.0\" encoding=\"UTF-8\"?>)");
  }

  if (!hasTag(xml, "sf:SuministroFacturacion")) {
    errors.push("Elemento raiz sf:SuministroFacturacion em falta");
    return { valid: false, errors };
  }

  // Namespace check
  if (!xml.includes("xmlns:sf=")) {
    errors.push("Namespace sf não declarado");
  }

  // Determinar tipo de registro e validar
  const isAlta = hasTag(xml, "sf:RegistroAlta");
  const isAnulacion = hasTag(xml, "sf:RegistroAnulacion");

  if (!isAlta && !isAnulacion) {
    errors.push("Nenhum tipo de registro encontrado (esperado RegistroAlta ou RegistroAnulacion)");
    return { valid: false, errors };
  }

  if (isAlta && isAnulacion) {
    errors.push("XML contém ambos RegistroAlta e RegistroAnulacion — apenas um é permitido");
    return { valid: false, errors };
  }

  // Validar tipo específico
  if (isAlta) {
    errors.push(...validateRegistroAlta(xml));
  } else {
    errors.push(...validateRegistroAnulacion(xml));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
