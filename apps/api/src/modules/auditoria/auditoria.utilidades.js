const CAMPOS_SENSIBLES = new Set([
  "hash_contrasena",
  "contrasena",
  "contrasena_actual",
  "nueva_contrasena",
  "token",
  "refreshToken",
  "refresh_token",
  "hash_token",
  "JWT_SECRETO_ACCESO",
  "DATABASE_URL",
  "DB_PASSWORD",
]);

export function sanitizarDatosAuditoria(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarDatosAuditoria(item));
  }

  if (!valor || typeof valor !== "object") {
    return valor;
  }

  const resultado = {};
  for (const [clave, contenido] of Object.entries(valor)) {
    if (CAMPOS_SENSIBLES.has(clave)) continue;
    if (/contrasena|token|secret|password/i.test(clave)) continue;
    resultado[clave] = sanitizarDatosAuditoria(contenido);
  }
  return resultado;
}
