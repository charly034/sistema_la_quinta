/**
 * Códigos de error para menús semanales
 * Spec Etapa 3 - Sección 32: Códigos de error
 */

export const CODIGOS_ERROR_MENUS = {
  // Semanas
  SEMANA_NO_ENCONTRADA: {
    codigo: "SEMANA_NO_ENCONTRADA",
    mensaje: "La semana no existe o fue eliminada",
    statusHttp: 404,
  },
  SEMANA_DUPLICADA_CONTEXTO: {
    codigo: "SEMANA_DUPLICADA_CONTEXTO",
    mensaje:
      "Ya existe una semana para este contexto (marca, canal, empresa, fecha)",
    statusHttp: 409,
  },

  // Versiones
  VERSION_NO_ENCONTRADA: {
    codigo: "VERSION_NO_ENCONTRADA",
    mensaje: "La versión no existe",
    statusHttp: 404,
  },
  TRANSICION_ESTADO_INVALIDA: {
    codigo: "TRANSICION_ESTADO_INVALIDA",
    mensaje: "Transición de estado no permitida",
    statusHttp: 400,
    detalles: "Consulte la máquina de estados para transiciones válidas",
  },
  VERSION_YA_PUBLICADA: {
    codigo: "VERSION_YA_PUBLICADA",
    mensaje: "No se puede modificar una versión publicada",
    statusHttp: 400,
  },

  // Días
  DIA_NO_ENCONTRADO: {
    codigo: "DIA_NO_ENCONTRADO",
    mensaje: "El día no existe en la versión",
    statusHttp: 404,
  },

  // Opciones y platos
  OPCION_MENU_NO_ENCONTRADA: {
    codigo: "OPCION_MENU_NO_ENCONTRADA",
    mensaje: "La opción de menú no existe",
    statusHttp: 404,
  },
  PLATO_REPETIDO_EN_SEMANA: {
    codigo: "PLATO_REPETIDO_EN_SEMANA",
    mensaje: "Este plato ya está asignado a otro día de la misma semana",
    statusHttp: 409,
    validacion: "Spec Etapa 3 - Sección 11",
  },
  PLATO_NO_ENCONTRADO: {
    codigo: "PLATO_NO_ENCONTRADO",
    mensaje: "El plato no existe o fue eliminado",
    statusHttp: 404,
  },

  // Duplicación
  SEMANA_ORIGEN_NO_ENCONTRADA: {
    codigo: "SEMANA_ORIGEN_NO_ENCONTRADA",
    mensaje: "La semana de origen para duplicación no existe",
    statusHttp: 404,
  },
  SIN_VERSION_PARA_CLONAR: {
    codigo: "SIN_VERSION_PARA_CLONAR",
    mensaje: "No hay versión para clonar desde la semana de origen",
    statusHttp: 400,
  },

  // Importación
  ARCHIVO_YA_IMPORTADO: {
    codigo: "ARCHIVO_YA_IMPORTADO",
    mensaje: "Este archivo ya fue importado previamente",
    statusHttp: 409,
    detalles: "El hash del archivo coincide con una importación anterior",
  },
  DATOS_IMPORTACION_INVALIDOS: {
    codigo: "DATOS_IMPORTACION_INVALIDOS",
    mensaje: "Los datos de importación no cumplen el formato requerido",
    statusHttp: 400,
  },
  CONFLICTOS_IMPORTACION: {
    codigo: "CONFLICTOS_IMPORTACION",
    mensaje: "Se detectaron conflictos durante la importación",
    statusHttp: 409,
  },
  IMPORTACION_CON_ERRORES: {
    codigo: "IMPORTACION_CON_ERRORES",
    mensaje: "La importación completó parcialmente con errores",
    statusHttp: 400,
  },
  IMPORTACION_NO_ENCONTRADA: {
    codigo: "IMPORTACION_NO_ENCONTRADA",
    mensaje: "El registro de importación no existe",
    statusHttp: 404,
  },

  // Plantillas
  PLANTILLA_NO_ENCONTRADA: {
    codigo: "PLANTILLA_NO_ENCONTRADA",
    mensaje: "La plantilla no existe para el contexto especificado",
    statusHttp: 404,
  },

  // Exportación
  EXPORTACION_NO_SOPORTADA: {
    codigo: "EXPORTACION_NO_SOPORTADA",
    mensaje: "El formato de exportación no es soportado",
    statusHttp: 400,
    formatos: ["TEXTO", "EXCEL", "WHATSAPP"],
  },

  // Permisos
  PERMISO_DENEGADO_MENUS: {
    codigo: "PERMISO_DENEGADO_MENUS",
    mensaje: "No tiene permiso para realizar esta operación en menús",
    statusHttp: 403,
  },

  // Validaciones
  FECHA_INICIO_NO_LUNES: {
    codigo: "FECHA_INICIO_NO_LUNES",
    mensaje: "La fecha de inicio debe ser un lunes",
    statusHttp: 400,
  },
  FECHA_FIN_NO_DOMINGO: {
    codigo: "FECHA_FIN_NO_DOMINGO",
    mensaje: "La fecha de fin debe ser un domingo",
    statusHttp: 400,
  },
  RANGO_FECHA_INVALIDO: {
    codigo: "RANGO_FECHA_INVALIDO",
    mensaje: "El rango de fechas no forma una semana válida",
    statusHttp: 400,
  },
  MARCA_NO_ENCONTRADA: {
    codigo: "MARCA_NO_ENCONTRADA",
    mensaje: "La marca no existe",
    statusHttp: 404,
  },
};

/**
 * Crear error de menú con contexto
 */
export function crearErrorMenu(codigoError, detalleAdicional = null) {
  const definicion = CODIGOS_ERROR_MENUS[codigoError];

  if (!definicion) {
    throw new Error(`Código de error desconocido: ${codigoError}`);
  }

  const mensaje = detalleAdicional
    ? `${definicion.mensaje}. ${detalleAdicional}`
    : definicion.mensaje;

  return {
    codigo: definicion.codigo,
    mensaje,
    statusHttp: definicion.statusHttp,
    detalles: definicion.detalles || null,
  };
}

/**
 * Mapear códigos de error SQL a códigos de aplicación
 */
export function mapearErrorSQL(codigoSQL, contexto) {
  const mapeo = {
    23505: "SEMANA_DUPLICADA_CONTEXTO", // unique_constraint
    23503: "MARCA_NO_ENCONTRADA", // foreign_key_constraint
    "42P01": "ERROR_INTERNO", // tabla no existe
  };

  return mapeo[codigoSQL] || "ERROR_INTERNO";
}
