import {
  obtenerRolesServicio,
  obtenerRolServicio,
  crearRolServicio,
  actualizarRolServicio,
  reemplazarPermisosRolServicio,
  listarPermisosServicio,
} from "./roles.servicio.js";
import { responderExito } from "../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../utils/paginacion.js";

export async function listarRolesControlador(req, res, next) {
  try {
    const paginacion = obtenerPaginacion(req.query);
    const resultado = await obtenerRolesServicio({
      ...paginacion,
      buscar: req.query.buscar,
    });
    return responderExito(
      res,
      resultado.filas,
      construirMetaPaginacion({ ...paginacion, total: resultado.total }),
    );
  } catch (error) {
    return next(error);
  }
}

export async function obtenerRolControlador(req, res, next) {
  try {
    const rol = await obtenerRolServicio(req.params.id);
    return responderExito(res, rol, {});
  } catch (error) {
    return next(error);
  }
}

export async function crearRolControlador(req, res, next) {
  try {
    const resultado = await crearRolServicio({
      cuerpo: req.body,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, resultado, {}, 201);
  } catch (error) {
    return next(error);
  }
}

export async function actualizarRolControlador(req, res, next) {
  try {
    const resultado = await actualizarRolServicio({
      id: req.params.id,
      cuerpo: req.body,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, resultado, {});
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarPermisosRolControlador(req, res, next) {
  try {
    const resultado = await reemplazarPermisosRolServicio({
      id: req.params.id,
      permisos: req.body.permisos,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, { permisos: resultado }, {});
  } catch (error) {
    return next(error);
  }
}

export async function listarPermisosControlador(_req, res, next) {
  try {
    const permisos = await listarPermisosServicio();
    return responderExito(res, permisos, {});
  } catch (error) {
    return next(error);
  }
}
