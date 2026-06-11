import jwt from "jsonwebtoken";
import { obtenerConfiguracionAplicacion } from "../../config/entorno.js";
import {
  generarTokenAleatorio,
  hashTokenSeguro,
  hashContrasena,
  verificarContrasena,
} from "../../utils/seguridad.js";

export function crearRefreshToken() {
  return generarTokenAleatorio(48);
}

export function hashearRefreshToken(token) {
  return hashTokenSeguro(token);
}

export function crearTokenAcceso({ usuarioId, sesionId }) {
  const configuracion = obtenerConfiguracionAplicacion();
  if (!configuracion.secretoAccessToken) {
    throw new Error("JWT_SECRETO_ACCESO no configurado");
  }

  return jwt.sign(
    { sub: usuarioId, sesionId },
    configuracion.secretoAccessToken,
    { expiresIn: configuracion.duracionAccessToken },
  );
}

export function verificarTokenAcceso(token) {
  const configuracion = obtenerConfiguracionAplicacion();
  if (!configuracion.secretoAccessToken) {
    throw new Error("JWT_SECRETO_ACCESO no configurado");
  }

  return jwt.verify(token, configuracion.secretoAccessToken);
}

export { hashContrasena, verificarContrasena };
