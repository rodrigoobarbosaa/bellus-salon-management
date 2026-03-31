import type { Factura } from "./types";

/**
 * Gerador XML formato Verifactu — Orden HAC/1177/2024
 *
 * Schema: SuministroLR (Suministro de información de Libros Registro)
 * Namespace: https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SusFactuSistemaFacturacion.xsd
 * Encoding: UTF-8
 * Version: 1.0
 */

const NAMESPACE_SF = "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroFacturacion";
const ID_VERSION = "1.0";

interface XmlFacturaInput {
  factura: Factura;
  nif_emisor: string;
  nombre_emisor: string;
  nif_destinatario?: string;
  nombre_destinatario?: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(isoDate: string): string {
  return isoDate.substring(0, 10); // YYYY-MM-DD
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Gera XML RegistroAlta (nova fatura) conforme Orden HAC/1177/2024.
 */
export function buildRegistroAlta(input: XmlFacturaInput): string {
  const { factura, nif_emisor, nombre_emisor, nif_destinatario, nombre_destinatario } = input;
  const tipoFactura = factura.total < 0 ? "R1" : "F1";
  const claveRegimen = "01"; // Régimen general

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sf:SuministroFacturacion xmlns:sf="${NAMESPACE_SF}">
  <sf:Cabecera>
    <sf:IDVersion>${ID_VERSION}</sf:IDVersion>
    <sf:ObligadoEmision>
      <sf:NombreRazon>${escapeXml(nombre_emisor)}</sf:NombreRazon>
      <sf:NIF>${escapeXml(nif_emisor)}</sf:NIF>
    </sf:ObligadoEmision>
  </sf:Cabecera>
  <sf:RegistroFacturacion>
    <sf:RegistroAlta>
      <sf:IDFactura>
        <sf:IDEmisorFactura>${escapeXml(nif_emisor)}</sf:IDEmisorFactura>
        <sf:NumSerieFactura>${escapeXml(factura.numero_completo)}</sf:NumSerieFactura>
        <sf:FechaExpedicionFactura>${formatDate(factura.fecha_emision)}</sf:FechaExpedicionFactura>
      </sf:IDFactura>
      <sf:TipoFactura>${tipoFactura}</sf:TipoFactura>
      <sf:ClaveRegimenIvaEsp>${claveRegimen}</sf:ClaveRegimenIvaEsp>
      <sf:DescripcionOperacion>Prestacion de servicios</sf:DescripcionOperacion>
      <sf:ImporteTotal>${formatAmount(factura.total)}</sf:ImporteTotal>${nif_destinatario ? `
      <sf:Destinatario>
        <sf:NombreRazon>${escapeXml(nombre_destinatario || "")}</sf:NombreRazon>
        <sf:NIF>${escapeXml(nif_destinatario)}</sf:NIF>
      </sf:Destinatario>` : ""}
      <sf:Desglose>
        <sf:DesgloseTipoOperacion>
          <sf:PrestacionServicios>
            <sf:DetalleIVA>
              <sf:TipoImpositivo>${formatAmount(factura.iva_pct)}</sf:TipoImpositivo>
              <sf:BaseImponible>${formatAmount(factura.base_imponible)}</sf:BaseImponible>
              <sf:CuotaRepercutida>${formatAmount(factura.iva_valor)}</sf:CuotaRepercutida>
            </sf:DetalleIVA>
          </sf:PrestacionServicios>
        </sf:DesgloseTipoOperacion>
      </sf:Desglose>
      <sf:Encadenamiento>
        <sf:PrimerRegistro>${factura.hash_anterior === "0" ? "S" : "N"}</sf:PrimerRegistro>${factura.hash_anterior && factura.hash_anterior !== "0" ? `
        <sf:RegistroAnterior>
          <sf:Huella>${escapeXml(factura.hash_anterior)}</sf:Huella>
        </sf:RegistroAnterior>` : ""}
      </sf:Encadenamiento>
      <sf:SistemaInformatico>
        <sf:NombreRazon>Synkra - Bellus</sf:NombreRazon>
        <sf:NIF>${escapeXml(nif_emisor)}</sf:NIF>
        <sf:NombreSistemaInformatico>Bellus Salon Management</sf:NombreSistemaInformatico>
        <sf:IdSistemaInformatico>BELLUS-V1</sf:IdSistemaInformatico>
        <sf:Version>1.0.0</sf:Version>
        <sf:NumeroInstalacion>1</sf:NumeroInstalacion>
      </sf:SistemaInformatico>
      <sf:Huella>${escapeXml(factura.hash_actual || "")}</sf:Huella>${factura.firma_digital ? `
      <sf:Firma>${escapeXml(factura.firma_digital)}</sf:Firma>` : ""}
    </sf:RegistroAlta>
  </sf:RegistroFacturacion>
</sf:SuministroFacturacion>`;

  return xml;
}

/**
 * Gera XML RegistroAnulacion (anulação de fatura) conforme Orden HAC/1177/2024.
 */
export function buildRegistroAnulacion(input: XmlFacturaInput): string {
  const { factura, nif_emisor, nombre_emisor } = input;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sf:SuministroFacturacion xmlns:sf="${NAMESPACE_SF}">
  <sf:Cabecera>
    <sf:IDVersion>${ID_VERSION}</sf:IDVersion>
    <sf:ObligadoEmision>
      <sf:NombreRazon>${escapeXml(nombre_emisor)}</sf:NombreRazon>
      <sf:NIF>${escapeXml(nif_emisor)}</sf:NIF>
    </sf:ObligadoEmision>
  </sf:Cabecera>
  <sf:RegistroFacturacion>
    <sf:RegistroAnulacion>
      <sf:IDFactura>
        <sf:IDEmisorFactura>${escapeXml(nif_emisor)}</sf:IDEmisorFactura>
        <sf:NumSerieFactura>${escapeXml(factura.numero_completo)}</sf:NumSerieFactura>
        <sf:FechaExpedicionFactura>${formatDate(factura.fecha_emision)}</sf:FechaExpedicionFactura>
      </sf:IDFactura>
      <sf:Encadenamiento>
        <sf:PrimerRegistro>N</sf:PrimerRegistro>
        <sf:RegistroAnterior>
          <sf:Huella>${escapeXml(factura.hash_anterior || "0")}</sf:Huella>
        </sf:RegistroAnterior>
      </sf:Encadenamiento>
      <sf:SistemaInformatico>
        <sf:NombreRazon>Synkra - Bellus</sf:NombreRazon>
        <sf:NIF>${escapeXml(nif_emisor)}</sf:NIF>
        <sf:NombreSistemaInformatico>Bellus Salon Management</sf:NombreSistemaInformatico>
        <sf:IdSistemaInformatico>BELLUS-V1</sf:IdSistemaInformatico>
        <sf:Version>1.0.0</sf:Version>
        <sf:NumeroInstalacion>1</sf:NumeroInstalacion>
      </sf:SistemaInformatico>
      <sf:Huella>${escapeXml(factura.hash_actual || "")}</sf:Huella>${factura.firma_digital ? `
      <sf:Firma>${escapeXml(factura.firma_digital)}</sf:Firma>` : ""}
    </sf:RegistroAnulacion>
  </sf:RegistroFacturacion>
</sf:SuministroFacturacion>`;

  return xml;
}

/**
 * Gera o XML correto baseado no tipo de fatura.
 * F1 (normal) → RegistroAlta
 * R1 (retificativa/anulação) → RegistroAnulacion
 */
export function buildFacturaXml(input: XmlFacturaInput): string {
  if (input.factura.total < 0) {
    return buildRegistroAnulacion(input);
  }
  return buildRegistroAlta(input);
}
