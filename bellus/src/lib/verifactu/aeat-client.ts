/**
 * Cliente API AEAT — Envio Verifactu
 *
 * Endpoints AEAT:
 * - Pruebas: https://prewww10.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV2SOAP
 * - Produccion: https://www10.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV2SOAP
 *
 * Autenticacao: Certificado digital .p12 (mutual TLS) — quando disponível.
 * Modo degradado: Sem certificado, faturas ficam pendientes para envio posterior.
 */

import https from "node:https";

// --- Config ---

export type AeatEnvironment = "pruebas" | "produccion";

interface AeatConfig {
  environment: AeatEnvironment;
  urlPruebas: string;
  urlProduccion: string;
  certificateP12?: Buffer;
  certificatePassword?: string;
}

function getAeatConfig(): AeatConfig {
  return {
    environment: (process.env.AEAT_VERIFACTU_ENV as AeatEnvironment) || "pruebas",
    urlPruebas:
      process.env.AEAT_VERIFACTU_URL_PRUEBAS ||
      "https://prewww10.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV2SOAP",
    urlProduccion:
      process.env.AEAT_VERIFACTU_URL_PROD ||
      "https://www10.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV2SOAP",
  };
}

function getEndpointUrl(config: AeatConfig): string {
  return config.environment === "produccion" ? config.urlProduccion : config.urlPruebas;
}

// --- SOAP Envelope ---

function wrapInSOAPEnvelope(xmlBody: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    ${xmlBody}
  </soapenv:Body>
</soapenv:Envelope>`;
}

// --- Response Types ---

export interface AeatResponse {
  success: boolean;
  status: "aceptado" | "rechazado" | "error";
  response_code: string;
  response_body: string;
  csv?: string; // Codigo Seguro de Verificacion
  error_description?: string;
}

// --- Response Parser ---

function parseAeatResponse(responseXml: string): AeatResponse {
  // Look for EstadoRegistro value in SOAP response
  const estadoMatch = responseXml.match(/<[^:]*:?EstadoRegistro>([^<]+)<\//);
  const csvMatch = responseXml.match(/<[^:]*:?CSV>([^<]+)<\//);
  const errorMatch = responseXml.match(/<[^:]*:?DescripcionErrorRegistro>([^<]+)<\//);
  const codigoMatch = responseXml.match(/<[^:]*:?CodigoErrorRegistro>([^<]+)<\//);

  const estado = estadoMatch?.[1]?.trim().toLowerCase() || "";

  if (estado === "correcto" || estado === "aceptado") {
    return {
      success: true,
      status: "aceptado",
      response_code: codigoMatch?.[1] || "0000",
      response_body: responseXml,
      csv: csvMatch?.[1],
    };
  }

  if (estado === "incorrecto" || estado === "rechazado") {
    return {
      success: false,
      status: "rechazado",
      response_code: codigoMatch?.[1] || "UNKNOWN",
      response_body: responseXml,
      error_description: errorMatch?.[1] || "Registro rechazado por la AEAT",
    };
  }

  // Fallback: try to detect fault
  const faultMatch = responseXml.match(/<[^:]*:?faultstring>([^<]+)<\//);
  if (faultMatch) {
    return {
      success: false,
      status: "error",
      response_code: "SOAP_FAULT",
      response_body: responseXml,
      error_description: faultMatch[1],
    };
  }

  return {
    success: false,
    status: "error",
    response_code: "PARSE_ERROR",
    response_body: responseXml,
    error_description: "No se pudo interpretar la respuesta de la AEAT",
  };
}

// --- HTTP Client ---

async function sendToAeat(
  soapXml: string,
  config: AeatConfig
): Promise<AeatResponse> {
  const url = getEndpointUrl(config);

  // If we have a certificate, use mutual TLS via node https
  if (config.certificateP12 && config.certificatePassword) {
    return sendWithCertificate(url, soapXml, config.certificateP12, config.certificatePassword);
  }

  // Standard HTTPS POST (no mutual TLS — for testing environments)
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
        SOAPAction: "SuministroFacturacion",
      },
      body: soapXml,
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return {
        success: false,
        status: "error",
        response_code: `HTTP_${response.status}`,
        response_body: responseBody,
        error_description: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return parseAeatResponse(responseBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      status: "error",
      response_code: "NETWORK_ERROR",
      response_body: "",
      error_description: `Error de conexion con AEAT: ${message}`,
    };
  }
}

function sendWithCertificate(
  url: string,
  soapXml: string,
  p12Buffer: Buffer,
  password: string
): Promise<AeatResponse> {
  return new Promise((resolve) => {
    const parsed = new URL(url);

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
        SOAPAction: "SuministroFacturacion",
        "Content-Length": Buffer.byteLength(soapXml, "utf-8"),
      },
      pfx: p12Buffer,
      passphrase: password,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parseAeatResponse(body));
        } else {
          resolve({
            success: false,
            status: "error",
            response_code: `HTTP_${res.statusCode}`,
            response_body: body,
            error_description: `HTTP ${res.statusCode}`,
          });
        }
      });
    });

    req.on("error", (err) => {
      resolve({
        success: false,
        status: "error",
        response_code: "NETWORK_ERROR",
        response_body: "",
        error_description: `Error de conexion con AEAT: ${err.message}`,
      });
    });

    req.write(soapXml);
    req.end();
  });
}

// --- Public API ---

/**
 * Verifica se o sistema pode enviar à AEAT (tem certificado configurado).
 */
export function canSubmitToAeat(): boolean {
  return Boolean(process.env.AEAT_CERTIFICATE_P12_PATH);
}

/**
 * Envia um XML Verifactu (RegistroAlta ou RegistroAnulacion) à AEAT.
 * Retorna a resposta parseada.
 */
export async function submitXmlToAeat(xmlContent: string): Promise<AeatResponse> {
  const config = getAeatConfig();

  // Load certificate if configured
  if (process.env.AEAT_CERTIFICATE_P12_PATH) {
    try {
      const fs = await import("node:fs");
      config.certificateP12 = fs.readFileSync(process.env.AEAT_CERTIFICATE_P12_PATH);
      config.certificatePassword = process.env.AEAT_CERTIFICATE_PASSWORD || "";
    } catch {
      // Certificate file not accessible — proceed without mTLS
    }
  }

  const soapEnvelope = wrapInSOAPEnvelope(xmlContent);
  return sendToAeat(soapEnvelope, config);
}

/**
 * Retorna o ambiente atual da AEAT (pruebas ou produccion).
 */
export function getAeatEnvironment(): AeatEnvironment {
  return getAeatConfig().environment;
}
