export class ErrorAplicacion extends Error {
  constructor(statusCode, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.name = "ErrorAplicacion";
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.detalles = detalles;
    this.formatoNuevo = true;
  }
}

export function errorAutenticacion(mensaje = "Credenciales invalidas") {
  return new ErrorAplicacion(401, "CREDENCIALES_INVALIDAS", mensaje);
}

export function errorTokenInvalido(mensaje = "Token invalido") {
  return new ErrorAplicacion(401, "TOKEN_INVALIDO", mensaje);
}

export function errorTokenVencido(mensaje = "Token vencido") {
  return new ErrorAplicacion(401, "TOKEN_VENCIDO", mensaje);
}

export function errorSesionRevocada(mensaje = "Sesion revocada") {
  return new ErrorAplicacion(401, "SESION_REVOCADA", mensaje);
}

export function errorPermisoInsuficiente(mensaje = "Permiso insuficiente") {
  return new ErrorAplicacion(403, "PERMISO_INSUFICIENTE", mensaje);
}

export function errorRecursoNoEncontrado(mensaje = "Recurso no encontrado") {
  return new ErrorAplicacion(404, "RECURSO_NO_ENCONTRADO", mensaje);
}

export function errorRegistroDuplicado(mensaje = "Registro duplicado") {
  return new ErrorAplicacion(409, "REGISTRO_DUPLICADO", mensaje);
}

export function errorEstadoInvalido(mensaje = "Estado invalido") {
  return new ErrorAplicacion(409, "ESTADO_INVALIDO", mensaje);
}

export function errorValidacionInvalida(detalles = []) {
  return new ErrorAplicacion(
    400,
    "VALIDACION_INVALIDA",
    "Datos de entrada invalidos",
    detalles,
  );
}

export function errorUsuarioDesactivado(mensaje = "Usuario desactivado") {
  return new ErrorAplicacion(403, "USUARIO_DESACTIVADO", mensaje);
}

export function errorConflictoIntegridad(mensaje = "Conflicto de integridad") {
  return new ErrorAplicacion(409, "CONFLICTO_INTEGRIDAD", mensaje);
}

export function errorPlatoDuplicado(mensaje = "Plato duplicado") {
  return new ErrorAplicacion(409, "PLATO_DUPLICADO", mensaje);
}

export function errorCicloComponentes(mensaje = "Ciclo en componentes") {
  return new ErrorAplicacion(409, "CICLO_COMPONENTES", mensaje);
}

export function errorAliasDuplicado(mensaje = "Alias duplicado") {
  return new ErrorAplicacion(409, "ALIAS_DUPLICADO", mensaje);
}

export function errorClasificacionInvalida(mensaje = "Clasificacion invalida") {
  return new ErrorAplicacion(409, "CLASIFICACION_INVALIDA", mensaje);
}

export function errorComponenteInvalido(mensaje = "Componente invalido") {
  return new ErrorAplicacion(409, "COMPONENTE_INVALIDO", mensaje);
}
