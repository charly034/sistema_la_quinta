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
  SEMANA_DUPLICADA_CONTEXTO: "Ya existe una semana para ese contexto y fecha.",
  EMPRESA_NO_ASOCIADA_A_MARCA:
    "La empresa seleccionada no pertenece a la marca.",
  CANAL_NO_ENCONTRADO: "El canal seleccionado no existe.",
  MARCA_NO_ENCONTRADA: "La marca seleccionada no existe.",
  PERMISO_INSUFICIENTE: "No tenés permisos para realizar esta acción.",
  SIN_PERMISO: "No tenés permisos para realizar esta acción.",
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
  const code =
    data?.error?.code ||
    data?.error?.codigo ||
    data?.meta?.code ||
    data?.meta?.codigo ||
    data?.code ||
    data?.codigo;
  const messageApi =
    data?.error?.message ||
    data?.error?.mensaje ||
    data?.message ||
    data?.mensaje;

  const details =
    data?.error?.details ||
    data?.error?.detalles ||
    data?.details ||
    data?.detalles ||
    [];

  const detalleFechaInicio = Array.isArray(details)
    ? details.find(
        (detalle) =>
          detalle?.path?.includes?.("fechaInicio") ||
          detalle?.path?.includes?.("fecha_inicio"),
      )
    : null;

  const messageValidacionFechaInicio =
    code === "VALIDACION_INVALIDA" && detalleFechaInicio
      ? "La fecha de inicio debe ser un lunes."
      : null;

  return {
    status,
    code,
    message:
      messageValidacionFechaInicio ||
      MENSAJES_DOMINIO[code] ||
      messageApi ||
      MENSAJES_HTTP[status] ||
      "No pudimos completar la operación.",
    details,
  };
}
