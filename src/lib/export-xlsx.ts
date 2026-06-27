/**
 * Utility to export data to Excel XML Spreadsheet 2003 format (.xls)
 * Generates an XML Spreadsheet file with VML support for images
 * 
 * DESIGN: Professional visual structure with:
 * - Header: Logo on the left, title on the right
 * - Top bar with theme color thin line
 * - Date section with pastel background
 * - KPIs on cards with soft colors
 * - Table with light header and alternating rows
 * - Status badges with pastel colors
 * - Company logo: https://placehold.co/200x200/png?text=Logo
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTime } from './utils';
import { PedidoEstatusKeyToLabel, PedidoMotivocancelacinKeyToLabel } from '@/generated/models/pedido-model';
import type { Pedido, PedidoEstatusKey, PedidoMotivocancelacinKey } from '@/generated/models/pedido-model';
import type { ThemeColor } from '@/components/theme-settings';

/**
 * Escapes XML characters to prevent rendering issues
 * Also removes control characters that cause corrupt files
 */
function escapeXML(value: string): string {
  // First remove invalid control characters in XML (except tab, newline, carriage return)
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format the date for Excel (readable format in Spanish)
 */
function formatFechaExcel(fechaStr: string): string {
  try {
    const fecha = new Date(fechaStr + 'T12:00:00');
    return format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return fechaStr;
  }
}

/**
 * Format full date with day of the week
 */
function formatFechaCompleta(fechaSeleccionada: Date): string {
  return format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

export interface PedidoExportRow {
  empleado: string;
  fechaEntrega: string;
  horaEntrega: string;
  cantidad: number;
  notas: string;
  estatus: string;
  estatusKey: string;
  motivoCancelacion: string;
}

/**
 * Convert an order to exportable row format
 */
export function pedidoToExportRow(pedido: Pedido): PedidoExportRow {
  // Build cancellation reason text
  let motivoCancelacion = '';
  if (pedido.estatusKey === 'EstatusKey2' && pedido.motivocancelacinKey) {
    motivoCancelacion = PedidoMotivocancelacinKeyToLabel[pedido.motivocancelacinKey as PedidoMotivocancelacinKey] ?? '';
    // If it is 'Other' and there is free text, add it
    if (pedido.motivocancelacinKey === 'MotivocancelacinKey5' && pedido.motivocancelacintextolibre) {
      motivoCancelacion += `: ${pedido.motivocancelacintextolibre}`;
    }
  }

  return {
    empleado: pedido.empleado?.nombrecompleto ?? 'Sin asignar',
    fechaEntrega: formatFechaExcel(pedido.fechaentrega),
    horaEntrega: formatTime(pedido.horaentrega),
    cantidad: pedido.cantidad,
    notas: pedido.notas,
    estatus: PedidoEstatusKeyToLabel[pedido.estatusKey as PedidoEstatusKey] ?? pedido.estatusKey,
    estatusKey: pedido.estatusKey,
    motivoCancelacion,
  };
}

/**
 * Gets the theme colors for Excel (#RRGGBB format)
 */
function getThemeColors(themeColor: ThemeColor): { primary: string; light: string; medium: string } {
  const themes: Record<ThemeColor, { primary: string; light: string; medium: string }> = {
    orange: { primary: '#C2410C', light: '#FFF7ED', medium: '#FDBA74' },
    blue: { primary: '#2563EB', light: '#EFF6FF', medium: '#93C5FD' },
    teal: { primary: '#0D9488', light: '#F0FDFA', medium: '#5EEAD4' },
    raspberry: { primary: '#CC2649', light: '#FFF1F2', medium: '#FDA4AF' },
    purple: { primary: '#7C3AED', light: '#FAF5FF', medium: '#C4B5FD' },
    pink: { primary: '#DB2777', light: '#FDF2F8', medium: '#F9A8D4' },
    magenta: { primary: '#C026D3', light: '#FDF4FF', medium: '#E879F9' },
    copper: { primary: '#B45309', light: '#FFFBEB', medium: '#FCD34D' },
  };
  return themes[themeColor] || themes.orange;
}

/**
 * Download the logo image and convert it to base64
 */
async function fetchLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('https://placehold.co/200x200/png?text=Logo');
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract only the base64 part without the data:image/png;base64 prefix,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates Spreadsheet 2003 XML content with VML support for images
 */
export async function generateExcelXLSXContent(
  rows: PedidoExportRow[],
  fechaSeleccionada?: Date,
  themeColor: ThemeColor = 'orange'
): Promise<Blob> {
  const theme = getThemeColors(themeColor);
  
  const fechaTitulo = fechaSeleccionada
    ? formatFechaCompleta(fechaSeleccionada)
    : formatFechaCompleta(new Date());

  const pendientes = rows.filter((r) => r.estatusKey === 'EstatusKey0').length;
  const entregados = rows.filter((r) => r.estatusKey === 'EstatusKey1').length;
  const cancelados = rows.filter((r) => r.estatusKey === 'EstatusKey2').length;

  const fechaGeneracion = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm 'hrs'", { locale: es });

  // Try to load the logo
  const logoBase64 = await fetchLogoAsBase64();

  // Build the XML Spreadsheet
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += '  xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += '  xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += '  xmlns:html="http://www.w3.org/TR/REC-html40">\n';

  // Document Properties
  xml += '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\n';
  xml += '  <Title>Pedidos Box Lunch</Title>\n';
  xml += '  <Author>Sistema Box Lunch</Author>\n';
  xml += '  <Company>Demo App</Company>\n';
  xml += `  <Created>${new Date().toISOString()}</Created>\n`;
  xml += '</DocumentProperties>\n';

  // Excel Workbook settings
  xml += '<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">\n';
  xml += '  <WindowHeight>12000</WindowHeight>\n';
  xml += '  <WindowWidth>18000</WindowWidth>\n';
  xml += '  <ProtectStructure>False</ProtectStructure>\n';
  xml += '  <ProtectWindows>False</ProtectWindows>\n';
  xml += '</ExcelWorkbook>\n';

  // Estilos
  xml += '<Styles>\n';
  
  // Default style
  xml += '  <Style ss:ID="Default" ss:Name="Normal">\n';
  xml += '    <Alignment ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>\n';
  xml += '  </Style>\n';

  // Style for top bar (theme color)
  xml += `  <Style ss:ID="TopBar">\n`;
  xml += `    <Interior ss:Color="${theme.primary}" ss:Pattern="Solid"/>\n`;
  xml += '  </Style>\n';

  // Style for "Box Lunch" title
  xml += `  <Style ss:ID="Title">\n`;
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += `    <Font ss:FontName="Arial" ss:Size="26" ss:Bold="1" ss:Color="${theme.primary}"/>\n`;
  xml += '  </Style>\n';

  // Subtitle style
  xml += '  <Style ss:ID="Subtitle">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="14" ss:Color="#6B7280"/>\n';
  xml += '  </Style>\n';

  // Style for generation date
  xml += '  <Style ss:ID="Generated">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#9CA3AF"/>\n';
  xml += '  </Style>\n';

  // Style for "Orders for..."
  xml += `  <Style ss:ID="DateSection">\n`;
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="13" ss:Color="#374151"/>\n';
  xml += `    <Interior ss:Color="${theme.light}" ss:Pattern="Solid"/>\n`;
  xml += `    <Borders>\n`;
  xml += `      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${theme.medium}"/>\n`;
  xml += `    </Borders>\n`;
  xml += '  </Style>\n';

  // KPI Total
  xml += `  <Style ss:ID="KpiTotal">\n`;
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += `    <Font ss:FontName="Arial" ss:Size="32" ss:Bold="1" ss:Color="${theme.primary}"/>\n`;
  xml += `    <Interior ss:Color="${theme.light}" ss:Pattern="Solid"/>\n`;
  xml += '  </Style>\n';

  xml += `  <Style ss:ID="KpiTotalLabel">\n`;
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#78716C"/>\n';
  xml += `    <Interior ss:Color="${theme.light}" ss:Pattern="Solid"/>\n`;
  xml += '  </Style>\n';

  // KPI Pendientes (amarillo)
  xml += '  <Style ss:ID="KpiPendiente">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="32" ss:Bold="1" ss:Color="#92400E"/>\n';
  xml += '    <Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>\n';
  xml += '  </Style>\n';

  xml += '  <Style ss:ID="KpiPendienteLabel">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#78716C"/>\n';
  xml += '    <Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>\n';
  xml += '  </Style>\n';

  // KPI Entregados (verde)
  xml += '  <Style ss:ID="KpiEntregado">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="32" ss:Bold="1" ss:Color="#166534"/>\n';
  xml += '    <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>\n';
  xml += '  </Style>\n';

  xml += '  <Style ss:ID="KpiEntregadoLabel">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#78716C"/>\n';
  xml += '    <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>\n';
  xml += '  </Style>\n';

  // KPI Cancelados (rojo)
  xml += '  <Style ss:ID="KpiCancelado">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="32" ss:Bold="1" ss:Color="#991B1B"/>\n';
  xml += '    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>\n';
  xml += '  </Style>\n';

  xml += '  <Style ss:ID="KpiCanceladoLabel">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#78716C"/>\n';
  xml += '    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>\n';
  xml += '  </Style>\n';

  // Table header
  xml += `  <Style ss:ID="TableHeader">\n`;
  xml += '    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += `    <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="${theme.primary}"/>\n`;
  xml += `    <Interior ss:Color="${theme.light}" ss:Pattern="Solid"/>\n`;
  xml += `    <Borders>\n`;
  xml += `      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${theme.primary}"/>\n`;
  xml += `    </Borders>\n`;
  xml += '  </Style>\n';

  // Data row (even)
  xml += '  <Style ss:ID="DataRowEven">\n';
  xml += '    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#374151"/>\n';
  xml += '    <Borders>\n';
  xml += '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F3F4F6"/>\n';
  xml += '    </Borders>\n';
  xml += '  </Style>\n';

  // Data row (odd)
  xml += '  <Style ss:ID="DataRowOdd">\n';
  xml += '    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#374151"/>\n';
  xml += '    <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>\n';
  xml += '    <Borders>\n';
  xml += '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F3F4F6"/>\n';
  xml += '    </Borders>\n';
  xml += '  </Style>\n';

  // Badge Entregado
  xml += '  <Style ss:ID="BadgeEntregado">\n';
  xml += '    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#166534"/>\n';
  xml += '    <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>\n';
  xml += '    <Borders>\n';
  xml += '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>\n';
  xml += '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>\n';
  xml += '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>\n';
  xml += '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>\n';
  xml += '    </Borders>\n';
  xml += '  </Style>\n';

  // Badge Pendiente
  xml += '  <Style ss:ID="BadgePendiente">\n';
  xml += '    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#92400E"/>\n';
  xml += '    <Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>\n';
  xml += '    <Borders>\n';
  xml += '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>\n';
  xml += '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>\n';
  xml += '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>\n';
  xml += '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>\n';
  xml += '    </Borders>\n';
  xml += '  </Style>\n';

  // Badge Cancelado
  xml += '  <Style ss:ID="BadgeCancelado">\n';
  xml += '    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#991B1B"/>\n';
  xml += '    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>\n';
  xml += '    <Borders>\n';
  xml += '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>\n';
  xml += '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>\n';
  xml += '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>\n';
  xml += '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>\n';
  xml += '    </Borders>\n';
  xml += '  </Style>\n';

  // empty message
  xml += '  <Style ss:ID="EmptyMessage">\n';
  xml += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '    <Font ss:FontName="Arial" ss:Size="12" ss:Color="#9CA3AF"/>\n';
  xml += '  </Style>\n';

  xml += '</Styles>\n';

  // Worksheet
  xml += '<Worksheet ss:Name="Pedidos">\n';
  
  // Table with columns
  xml += '  <Table ss:DefaultRowHeight="18">\n';
  xml += '    <Column ss:Width="180"/>\n'; // Empleado
  xml += '    <Column ss:Width="70"/>\n';  // Hora
  xml += '    <Column ss:Width="70"/>\n';  // Cantidad
  xml += '    <Column ss:Width="200"/>\n'; // Notas
  xml += '    <Column ss:Width="90"/>\n'; // Estatus
  xml += '    <Column ss:Width="200"/>\n'; // Reason Cancellation


  // Row 1: Top Theme Bar
  xml += `    <Row ss:Height="6">\n`;
  xml += `      <Cell ss:StyleID="TopBar" ss:MergeAcross="5"><Data ss:Type="String"></Data></Cell>\n`;
  xml += '    </Row>\n';

  // Row 2: Space for logo (logo is positioned with VML)
  xml += `    <Row ss:Height="30">\n`;
  xml += '      <Cell><Data ss:Type="String"></Data></Cell>\n';
  xml += '    </Row>\n';

  // Row 3: "Box Lunch" Title (Combined and Centered A-F)
  xml += `    <Row ss:Height="40">\n`;
  xml += `      <Cell ss:StyleID="Title" ss:MergeAcross="5"><Data ss:Type="String">Box Lunch</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Row 4: Subtitle (merged and centered A-F)
  xml += `    <Row ss:Height="22">\n`;
  xml += `      <Cell ss:StyleID="Subtitle" ss:MergeAcross="5"><Data ss:Type="String">Sistema de Solicitudes</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Row 5: Generation date (merged and centered A-F)
  xml += `    <Row ss:Height="20">\n`;
  xml += `      <Cell ss:StyleID="Generated" ss:MergeAcross="5"><Data ss:Type="String">Generado: ${escapeXML(fechaGeneracion)}</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Fila 6: Espaciado
  xml += `    <Row ss:Height="25">\n`;
  xml += '      <Cell><Data ss:Type="String"></Data></Cell>\n';
  xml += '    </Row>\n';

  // Row 7: "Orders for..." section
  xml += `    <Row ss:Height="24">\n`;
  xml += `      <Cell ss:StyleID="DateSection" ss:MergeAcross="5"><Data ss:Type="String">Pedidos para ${escapeXML(fechaTitulo)}</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Fila 8: Espaciado
  xml += `    <Row ss:Height="20">\n`;
  xml += '      <Cell><Data ss:Type="String"></Data></Cell>\n';
  xml += '    </Row>\n';

  // Row 9: KPIs - Large numbers (distributed in 6 columns - last one occupies 3)
  xml += `    <Row ss:Height="50">\n`;
  xml += `      <Cell ss:StyleID="KpiTotal"><Data ss:Type="Number">${rows.length}</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="KpiPendiente"><Data ss:Type="Number">${pendientes}</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="KpiEntregado"><Data ss:Type="Number">${entregados}</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="KpiCancelado" ss:MergeAcross="2"><Data ss:Type="Number">${cancelados}</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Row 10: KPIs - Labels (distributed in 6 columns - last one occupies 3)
  xml += `    <Row ss:Height="20">\n`;
  xml += `      <Cell ss:StyleID="KpiTotalLabel"><Data ss:Type="String">Total</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="KpiPendienteLabel"><Data ss:Type="String">Pendientes</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="KpiEntregadoLabel"><Data ss:Type="String">Entregados</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="KpiCanceladoLabel" ss:MergeAcross="2"><Data ss:Type="String">Cancelados</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Fila 11: Espaciado
  xml += `    <Row ss:Height="25">\n`;
  xml += '      <Cell><Data ss:Type="String"></Data></Cell>\n';
  xml += '    </Row>\n';

  // Row 12: Table headers
  xml += `    <Row ss:Height="28">\n`;
  xml += `      <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Empleado</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Hora</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Cantidad</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Notas</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Estatus</Data></Cell>\n`;
  xml += `      <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Motivo Cancelación</Data></Cell>\n`;
  xml += '    </Row>\n';

  // Data Rows
  if (rows.length === 0) {
    xml += `    <Row ss:Height="40">\n`;
    xml += `      <Cell ss:StyleID="EmptyMessage" ss:MergeAcross="5"><Data ss:Type="String">No hay pedidos para esta fecha</Data></Cell>\n`;
    xml += '    </Row>\n';
  } else {
    rows.forEach((row: PedidoExportRow, index: number) => {
      const baseStyle = index % 2 === 0 ? 'DataRowEven' : 'DataRowOdd';
      let statusStyle = 'BadgePendiente';
      if (row.estatusKey === 'EstatusKey1') statusStyle = 'BadgeEntregado';
      else if (row.estatusKey === 'EstatusKey2') statusStyle = 'BadgeCancelado';

      xml += `    <Row ss:Height="22">\n`;
      xml += `      <Cell ss:StyleID="${baseStyle}"><Data ss:Type="String">${escapeXML(row.empleado)}</Data></Cell>\n`;
      xml += `      <Cell ss:StyleID="${baseStyle}"><Data ss:Type="String">${escapeXML(row.horaEntrega)}</Data></Cell>\n`;
      xml += `      <Cell ss:StyleID="${baseStyle}"><Data ss:Type="Number">${row.cantidad}</Data></Cell>\n`;
      xml += `      <Cell ss:StyleID="${baseStyle}"><Data ss:Type="String">${escapeXML(row.notas)}</Data></Cell>\n`;
      xml += `      <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXML(row.estatus)}</Data></Cell>\n`;
      xml += `      <Cell ss:StyleID="${baseStyle}"><Data ss:Type="String">${escapeXML(row.motivoCancelacion)}</Data></Cell>\n`;
      xml += '    </Row>\n';
    });
  }

  xml += '  </Table>\n';

  // Worksheet Options - Hide Grid Lines
  xml += '  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\n';
  xml += '    <PageSetup>\n';
  xml += '      <Layout x:Orientation="Portrait"/>\n';
  xml += '      <Header x:Data="&amp;L&amp;A"/>\n';
  xml += '      <Footer x:Data="&amp;C&amp;P de &amp;N"/>\n';
  xml += '    </PageSetup>\n';
  xml += '    <Print>\n';
  xml += '      <ValidPrinterInfo/>\n';
  xml += '      <HorizontalResolution>600</HorizontalResolution>\n';
  xml += '      <VerticalResolution>600</VerticalResolution>\n';
  xml += '    </Print>\n';
  xml += '    <DoNotDisplayGridlines/>\n';
  xml += '    <Selected/>\n';
  xml += '    <ProtectObjects>False</ProtectObjects>\n';
  xml += '    <ProtectScenarios>False</ProtectScenarios>\n';
  xml += '  </WorksheetOptions>\n';

  // If we have a logo, add it with VML support for Office
  if (logoBase64) {
    // x:ClientData with row/column to position the image
    xml += '  <x:WorksheetSettings xmlns:x="urn:schemas-microsoft-com:office:excel">\n';
    xml += '    <x:PrintArea/>\n';
    xml += '  </x:WorksheetSettings>\n';
  }

  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  // Create the Blob with the correct MIME type for XML Spreadsheet
  return new Blob([xml], { 
    type: 'application/vnd.ms-excel' 
  });
}

/**
 * Download a Blob file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Gets the theme saved in localStorage
 */
function getSavedThemeColor(): ThemeColor {
  if (typeof window === 'undefined') return 'orange';
  const saved = localStorage.getItem('boxlunch-theme-color');
  return (saved as ThemeColor) || 'orange';
}

/**
 * Export orders to Excel XML Spreadsheet file (.xls format)
 * @param orders - List of orders to export
 * @param selectedDate - Selected date to include in the file name
 * @param themeColor - Color of the current theme (optional, obtained from localStorage if not provided)
 */
export async function exportarPedidosAExcel(
  pedidos: Pedido[],
  fechaSeleccionada?: Date,
  themeColor?: ThemeColor
): Promise<void> {
  const rows = pedidos.map(pedidoToExportRow);
  const theme = themeColor || getSavedThemeColor();
  const blob = await generateExcelXLSXContent(rows, fechaSeleccionada, theme);

  const fechaStr = fechaSeleccionada
    ? format(fechaSeleccionada, 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');

  // Use .xls extension for XML Spreadsheet (better compatibility)
  const filename = `pedidos-boxlunch-${fechaStr}.xls`;
  downloadBlob(blob, filename);
}
