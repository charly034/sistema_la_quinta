const MENSAJES_HTTP = {
  400: "Revisá los datos enviados.",
  401: "Tu sesión venció. Iniciá sesión nuevamente.",
  403: "No tenés permisos para realizar esta acción.",
  404: "No encontramos el recurso solicitado.",
  409: "Hay un conflicto de negocio.",
  422: "Hay errores de validación.",
  500: "Ocurrió un error inesperado en el servidor.",
};

const MENSAJES_DOMINIO = {
  SEMANA_DUPLICADA:
    "Ya existe una semana con ese rango para esa marca/canal/empresa.",
  PLATO_REPETIDO_EN_SEMANA:
    "El plato ya está asignado en esa semana donde no corresponde repetir.",
  PROPUESTA_DESACTUALIZADA:
    "El menú fue modificado después de generar esta propuesta. Generá una nueva propuesta antes de aplicarla.",
  POSICION_BLOQUEADA_CONFLICTIVA:
    "Hay posiciones bloqueadas conflictivas en la propuesta.",
  SIN_SOLUCION_COMPLETA:
    "No se encontró una solución completa con las restricciones actuales.",
};

export function normalizarError(error) {
  const status = error?.response?.status || error?.status;
  const data = error?.response?.data || error?.data || {};
  const code = data?.error?.code || data?.meta?.code || data?.code;
  const messageApi =
    data?.error?.message ||
    data?.error?.mensaje ||
    data?.message ||
    data?.mensaje;

  return {
    status,
    code,
    message:
      MENSAJES_DOMINIO[code] ||
      messageApi ||
      MENSAJES_HTTP[status] ||
      "No pudimos completar la operación.",
    details: data?.error?.details || data?.detalles || [],
  };
}
