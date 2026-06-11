/**
 * Servicio de exportaciones
 * Spec Etapa 3 - Secciones 24, 25
 */

import * as repo from "../menus-semanales/menus-semanales.repositorio.js";
import * as util from "../menus-semanales/menus-semanales.utilidades.js";
import { ESTADOS_DIA } from "../menus-semanales/menus-semanales.constantes.js";
import { ApiError } from "../../../utils/api-error.js";
import ExcelJS from "exceljs";

/**
 * Exportar semana a texto
 * Spec Etapa 3 - Sección 24: Exportación a texto
 */
export async function exportarATexto(db, versionId, semanaData) {
  // Obtener días y opciones
  const dias = await db.query(
    `SELECT * FROM dias_version_menu WHERE version_semana_id = $1 ORDER BY orden ASC`,
    [versionId],
  );

  let texto = "";

  // Encabezado
  texto += "═════════════════════════════════════════════════════════════\n";
  texto += `MENÚ SEMANAL: ${util.obtenerRangoSemana(semanaData.fechaInicio, semanaData.fechaFin)}\n`;
  texto += `Marca: ${semanaData.nombreMarca || "La Quinta"}\n`;
  texto += `Generado: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}\n`;
  texto += "═════════════════════════════════════════════════════════════\n\n";

  // Contenido por día
  for (const diaRow of dias.rows) {
    const opciones = await db.query(
      `SELECT * FROM opciones_dia_menu WHERE dia_version_menu_id = $1 ORDER BY orden ASC`,
      [diaRow.id],
    );

    texto += `\n📅 ${diaRow.nombre_dia.toUpperCase()} - ${util.formatearFechaMes(diaRow.fecha)}\n`;
    texto += "─────────────────────────────────────────────────────────────\n";

    if (diaRow.estado_dia === ESTADOS_DIA.CERRADO) {
      texto += "🚫 CERRADO\n";
    } else if (diaRow.estado_dia === ESTADOS_DIA.FERIADO) {
      texto += "🎉 FERIADO\n";
    } else if (diaRow.estado_dia === ESTADOS_DIA.SIN_CONFIGURAR) {
      texto += "⚠️  SIN CONFIGURAR\n";
    } else {
      if (opciones.rows.length === 0) {
        texto += "Sin opciones configuradas\n";
      } else {
        opciones.rows.forEach((opcion, idx) => {
          const letra = String.fromCharCode(65 + idx);
          texto += `${letra}) ${opcion.nombre_opcion}\n`;
        });
      }
    }

    if (diaRow.observaciones) {
      texto += `Nota: ${diaRow.observaciones}\n`;
    }
  }

  texto += "\n═════════════════════════════════════════════════════════════\n";

  return texto;
}

/**
 * Exportar semana a Excel
 * Spec Etapa 3 - Sección 25: Exportación a Excel legible
 */
export async function exportarAExcel(db, versionId, semanaData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Menú Semanal");

  // Estilos
  const estiloEncabezado = {
    font: { bold: true, size: 14, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: { top: {}, bottom: {}, left: {}, right: {} },
  };

  const estiloDia = {
    font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
    alignment: { horizontal: "center", vertical: "center" },
  };

  const estiloOpcion = {
    font: { size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBE5F1" } },
    border: { top: { style: "thin" }, bottom: { style: "thin" } },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
  };

  const estiloCerrado = {
    font: { size: 10, italic: true, color: { argb: "FFFF0000" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE6E6" } },
    alignment: { horizontal: "center", vertical: "center" },
  };

  // Establecer ancho de columnas
  worksheet.columns = [
    { header: "Día", width: 15 },
    { header: "Fecha", width: 15 },
    { header: "Estado", width: 15 },
    { header: "Opciones", width: 50 },
    { header: "Observaciones", width: 30 },
  ];

  // Encabezado
  const rango = util.obtenerRangoSemana(
    semanaData.fechaInicio,
    semanaData.fechaFin,
  );
  worksheet.mergeCells("A1:E1");
  const headerCell = worksheet.getCell("A1");
  headerCell.value = `MENÚ SEMANAL: ${rango}`;
  headerCell.style = estiloEncabezado;

  worksheet.mergeCells("A2:E2");
  const subheaderCell = worksheet.getCell("A2");
  subheaderCell.value = `Marca: ${semanaData.nombreMarca || "La Quinta"} | Generado: ${new Date().toLocaleDateString("es-ES")}`;
  subheaderCell.style = {
    ...estiloEncabezado,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF595959" } },
  };

  worksheet.insertRow(3);

  // Encabezados de columna
  const headerRow = worksheet.getRow(4);
  headerRow.values = ["Día", "Fecha", "Estado", "Opciones", "Observaciones"];
  headerRow.style = estiloDia;
  headerRow.height = 20;

  // Obtener datos
  const dias = await db.query(
    `SELECT * FROM dias_version_menu WHERE version_semana_id = $1 ORDER BY orden ASC`,
    [versionId],
  );

  let rowNum = 5;

  for (const diaRow of dias.rows) {
    const opciones = await db.query(
      `SELECT nombre_opcion FROM opciones_dia_menu WHERE dia_version_menu_id = $1 ORDER BY orden ASC`,
      [diaRow.id],
    );

    const row = worksheet.getRow(rowNum);

    row.values = [
      diaRow.nombre_dia,
      util.formatearFechaMes(diaRow.fecha),
      diaRow.estado_dia === ESTADOS_DIA.CERRADO
        ? "🚫 Cerrado"
        : diaRow.estado_dia === ESTADOS_DIA.FERIADO
          ? "🎉 Feriado"
          : diaRow.estado_dia === ESTADOS_DIA.SIN_CONFIGURAR
            ? "⚠️  Sin configurar"
            : `✅ ${opciones.rows.length} opciones`,
      opciones.rows
        .map((o, i) => `${String.fromCharCode(65 + i)}) ${o.nombre_opcion}`)
        .join("\n"),
      diaRow.observaciones || "",
    ];

    if (diaRow.estado_dia === ESTADOS_DIA.CERRADO) {
      row.style = estiloCerrado;
    } else {
      row.style = estiloOpcion;
    }

    row.height = Math.max(20, (opciones.rows.length || 1) * 15);
    rowNum++;
  }

  // Nota al pie
  worksheet.insertRow(rowNum + 1);
  const notaRow = worksheet.getRow(rowNum + 2);
  notaRow.values = [`Generado: ${new Date().toLocaleString("es-ES")}`];
  notaRow.font = { size: 9, italic: true };

  return workbook;
}

/**
 * Generar nombre de archivo de exportación
 */
export function generarNombreArchivoExportacion(
  marcaNombre,
  fechaInicio,
  formato,
) {
  const fecha = new Date().toISOString().slice(0, 10);
  const marcaSegura = String(marcaNombre || "menu")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const fechaInicioSegura = String(fechaInicio || "sin-fecha").replace(
    /[^0-9-]/g,
    "",
  );
  return `menu-${marcaSegura}-${fechaInicioSegura}-${fecha}.${formato}`;
}
