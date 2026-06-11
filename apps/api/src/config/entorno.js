export function obtenerListaOrigenes(valor) {
  if (!valor) return [];

  return String(valor)
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);
}

export function obtenerConfiguracionAplicacion() {
  return {
    entorno: (process.env.NODE_ENV || "development").toLowerCase(),
    puerto: Number(process.env.PORT) || 3000,
    zonaHoraria: process.env.ZONA_HORARIA || "America/Argentina/Mendoza",
    origenesPermitidos: obtenerListaOrigenes(
      process.env.CORS_ORIGENES_PERMITIDOS,
    ),
    duracionAccessToken: process.env.JWT_DURACION_ACCESO || "15m",
    secretoAccessToken: process.env.JWT_SECRETO_ACCESO || "",
    duracionRefreshToken: process.env.DURACION_REFRESH_TOKEN || "30d",
    costoHashContrasena: Number(process.env.COSTO_HASH_CONTRASENA) || 12,
    rateLimitAutenticacionVentanaMs:
      Number(process.env.RATE_LIMIT_AUTENTICACION_VENTANA_MS) || 60000,
    rateLimitAutenticacionMaximo:
      Number(process.env.RATE_LIMIT_AUTENTICACION_MAXIMO) || 10,
    auditoriaHabilitada:
      String(process.env.AUDITORIA_HABILITADA || "true").toLowerCase() !==
      "false",
  };
}
