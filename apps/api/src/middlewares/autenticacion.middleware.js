import { verificarTokenAcceso } from "../modules/autenticacion/autenticacion.utilidades.js";
import {
  obtenerSesionActivaPorId,
  obtenerUsuarioConPermisosPorId,
} from "../modules/autenticacion/autenticacion.repositorio.js";
import {
  errorSesionRevocada,
  errorTokenInvalido,
  errorUsuarioDesactivado,
  errorPermisoInsuficiente,
} from "../utils/errores.js";

function extraerTokenAutorizacion(autorizacion) {
  if (!autorizacion) return null;
  const partes = String(autorizacion).split(" ");
  if (partes.length !== 2) return null;
  if (partes[0] !== "Bearer") return null;
  return partes[1];
}

export async function autenticar(req, _res, next) {
  try {
    const token = extraerTokenAutorizacion(req.headers.authorization);
    if (!token) {
      throw errorTokenInvalido();
    }

    const payload = verificarTokenAcceso(token);
    const sesion = await obtenerSesionActivaPorId(payload.sesionId);
    if (!sesion) {
      throw errorSesionRevocada();
    }

    const usuario = await obtenerUsuarioConPermisosPorId(payload.sub);
    if (!usuario || usuario.estado !== "ACTIVO") {
      throw errorUsuarioDesactivado();
    }

    req.usuario = {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      estado: usuario.estado,
      roles: usuario.roles,
      permisos: usuario.permisos,
      sesionId: sesion.id,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export function requierePermiso(codigoPermiso) {
  return async (req, _res, next) => {
    try {
      if (!req.usuario) {
        return next(errorTokenInvalido());
      }

      const permisos = Array.isArray(req.usuario.permisos)
        ? req.usuario.permisos
        : [];

      if (!permisos.includes(codigoPermiso)) {
        return next(errorPermisoInsuficiente());
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
