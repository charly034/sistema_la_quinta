/**
 * Utilidades para manejo de fechas, semanas y generación de días
 * Spec Etapa 3 - Secciones 6, 10, 22, 24, 25, 26
 */

import { ESTADOS_DIA } from "./menus-semanales.constantes.js";

function crearFechaUtc(fecha) {
  if (fecha instanceof Date) {
    return new Date(
      Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()),
    );
  }

  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return new Date(`${fecha}T00:00:00Z`);
  }

  const date = new Date(fecha);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Obtener el lunes (fecha inicio) de una semana dada una fecha
 * Spec Etapa 3 - Sección 6
 */
export function obtenerLunesDelaSemana(fecha) {
  const date = crearFechaUtc(fecha);
  const dia = date.getUTCDay(); // 0=domingo, 1=lunes, etc.
  const diferencia = dia === 0 ? -6 : 1 - dia; // Si es domingo, resta 6; sino, resta para llegar al lunes
  date.setUTCDate(date.getUTCDate() + diferencia);
  return date;
}

/**
 * Obtener el domingo (fecha fin) de una semana dado el lunes
 * Spec Etapa 3 - Sección 6
 */
export function obtenerDomingoDelaSemana(fechaLunes) {
  const date = crearFechaUtc(fechaLunes);
  date.setUTCDate(date.getUTCDate() + 6);
  return date;
}

/**
 * Validar que una fecha sea lunes
 */
export function esLunes(fecha) {
  const date = crearFechaUtc(fecha);
  return date.getUTCDay() === 1;
}

/**
 * Validar que una fecha sea domingo
 */
export function esDomingo(fecha) {
  const date = crearFechaUtc(fecha);
  return date.getUTCDay() === 0;
}

/**
 * Generar automáticamente los 7 días de una semana
 * Spec Etapa 3 - Sección 10: Creación automática de 7 días
 *
 * @param {Date|string} fechaInicio - Lunes de la semana
 * @returns {Array} Array con 7 días (lunes a domingo)
 */
export function generarSieteDias(fechaInicio) {
  const dias = [];
  const fecha = crearFechaUtc(fechaInicio);
  const nombresDias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  for (let i = 0; i < 7; i++) {
    const fechaDia = new Date(fecha);
    fechaDia.setUTCDate(fechaDia.getUTCDate() + i);

    dias.push({
      numeroDiaIso: (i % 7) + 1, // 1=lunes, 7=domingo
      nombreDia: nombresDias[i],
      fecha: formatoFecha(fechaDia),
      estado: ESTADOS_DIA.SIN_CONFIGURAR,
      orden: i + 1,
    });
  }

  return dias;
}

/**
 * Formatear fecha a string ISO (YYYY-MM-DD)
 */
export function formatoFecha(fecha) {
  const date = crearFechaUtc(fecha);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parsear fecha de string ISO
 */
export function parsearFecha(fechaStr) {
  return new Date(fechaStr + "T00:00:00Z");
}

/**
 * Obtener rango de semana en formato legible (Spec Etapa 3 - Sección 22: WhatsApp)
 * Ejemplo: "13 de octubre - 19 de octubre"
 */
export function obtenerRangoSemana(fechaInicio, fechaFin) {
  const opciones = { day: "numeric", month: "long", year: "numeric" };
  const locale = "es-ES";

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const diaInicio = inicio.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });
  const diaFin = fin.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${diaInicio} - ${diaFin}`;
}

/**
 * Calcular rangos operativos (horarios) para una semana
 * Spec Etapa 3 - Sección 22: Rango operativo para WhatsApp
 * Nota: Esta función es extensible para horarios específicos por marca
 */
export function calcularRangoOperativo(marca) {
  // Por defecto, todas las marcas operan de 11:00 a 21:00
  // Puede personalizarse por marca según negocio
  return {
    horaApertura: "11:00",
    horaCierre: "21:00",
  };
}

/**
 * Generar descripción de un día para WhatsApp/Exportación
 * Spec Etapa 3 - Sección 22, 24
 */
export function generarDescripcionDia(dia, opciones = []) {
  let descripcion = `📅 ${dia.nombreDia} ${formatearFechaMes(dia.fecha)}\n`;

  if (dia.estado === ESTADOS_DIA.CERRADO) {
    descripcion += "🚫 Cerrado\n";
  } else if (dia.estado === ESTADOS_DIA.FERIADO) {
    descripcion += "🎉 Feriado\n";
  } else if (dia.estado === ESTADOS_DIA.SIN_CONFIGURAR) {
    descripcion += "⚠️ Sin configurar\n";
  } else {
    // DIA_LABORAL
    descripcion += `${opciones.length} opciones disponibles\n`;
    opciones.slice(0, 3).forEach((opt, idx) => {
      descripcion += `  ${String.fromCharCode(65 + idx)}) ${opt.nombre}\n`;
    });
    if (opciones.length > 3) {
      descripcion += `  ... y ${opciones.length - 3} más\n`;
    }
  }

  return descripcion;
}

/**
 * Formatear fecha a formato mes legible (Spec Etapa 3 - Sección 22)
 * Ejemplo: "13 de oct"
 */
export function formatearFechaMes(fechaStr) {
  const fecha = new Date(fechaStr + "T00:00:00Z");
  const locale = "es-ES";
  return fecha.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Detectar si un año es bisiesto
 */
export function esBisiesto(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Calcular edad en días entre dos fechas
 */
export function diasEntre(fecha1, fecha2) {
  const date1 = crearFechaUtc(fecha1);
  const date2 = crearFechaUtc(fecha2);
  const diferencia = Math.abs(date2 - date1);
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
}

/**
 * Validar que dos fechas formen una semana completa (lunes-domingo, 6 días de diferencia)
 * Spec Etapa 3 - Sección 8
 */
export function esSemanValida(fechaInicio, fechaFin) {
  if (!esLunes(fechaInicio)) return false;
  if (!esDomingo(fechaFin)) return false;

  const diferencia = diasEntre(fechaInicio, fechaFin);
  return diferencia === 6;
}

/**
 * Normalizar rango de semana (ajustar a lunes-domingo si no son exactos)
 */
export function normalizarRangoSemana(fechaInicio) {
  const lunes = obtenerLunesDelaSemana(fechaInicio);
  const domingo = obtenerDomingoDelaSemana(lunes);

  return {
    fechaInicio: formatoFecha(lunes),
    fechaFin: formatoFecha(domingo),
  };
}

/**
 * Obtener semana anterior (lunes-domingo anterior)
 */
export function obtenerSemanaAnterior(fechaInicio) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() - 7);
  return formatoFecha(fecha);
}

/**
 * Obtener semana siguiente (lunes-domingo siguiente)
 */
export function obtenerSemanaSiguiente(fechaInicio) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + 7);
  return formatoFecha(fecha);
}
