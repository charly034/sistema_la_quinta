import {
  iniciarSesionServicio,
  renovarSesionServicio,
  cerrarSesionServicio,
  cambiarContrasenaServicio,
  obtenerMiPerfilServicio,
} from "./autenticacion.servicio.js";
import { responderExito } from "../../utils/respuestas.js";

function obtenerMetadatosPeticion(req) {
  return {
    direccionIp: req.ip,
    agenteUsuario: req.headers["user-agent"] || null,
  };
}

export async function iniciarSesionControlador(req, res, next) {
  try {
    const resultado = await iniciarSesionServicio({
      ...req.body,
      ...obtenerMetadatosPeticion(req),
    });

    return responderExito(
      res,
      {
        usuario: resultado.usuario,
        accessToken: resultado.accessToken,
        refreshToken: resultado.refreshToken,
      },
      { sesionId: resultado.sesionId },
      200,
    );
  } catch (error) {
    return next(error);
  }
}

export async function renovarSesionControlador(req, res, next) {
  try {
    const resultado = await renovarSesionServicio({
      ...req.body,
      ...obtenerMetadatosPeticion(req),
    });

    return responderExito(
      res,
      {
        accessToken: resultado.accessToken,
        refreshToken: resultado.refreshToken,
        usuario: resultado.usuario,
      },
      { sesionId: resultado.sesionId },
      200,
    );
  } catch (error) {
    return next(error);
  }
}

export async function cerrarSesionControlador(req, res, next) {
  try {
    await cerrarSesionServicio({
      ...req.body,
      ...obtenerMetadatosPeticion(req),
    });

    return responderExito(res, { cerrado: true }, {}, 200);
  } catch (error) {
    return next(error);
  }
}

export async function cambiarContrasenaControlador(req, res, next) {
  try {
    const resultado = await cambiarContrasenaServicio({
      usuarioId: req.usuario.id,
      ...req.body,
      ...obtenerMetadatosPeticion(req),
    });

    return responderExito(res, resultado, {}, 200);
  } catch (error) {
    return next(error);
  }
}

export async function miPerfilControlador(req, res, next) {
  try {
    const resultado = await obtenerMiPerfilServicio(req.usuario.id);
    return responderExito(res, resultado, {}, 200);
  } catch (error) {
    return next(error);
  }
}
