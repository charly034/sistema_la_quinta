import { responderExito } from "../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../utils/paginacion.js";
import {
  listarUsuariosServicio,
  obtenerUsuarioServicio,
  crearUsuarioServicio,
  actualizarUsuarioServicio,
  cambiarEstadoUsuarioServicio,
  reemplazarRolesUsuarioServicio,
} from "./usuarios.servicio.js";

export async function listarUsuariosControlador(req, res, next) {
  try {
    const paginacion = obtenerPaginacion(req.query);
    const resultado = await listarUsuariosServicio({
      ...paginacion,
      buscar: req.query.buscar,
      estado: req.query.estado,
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

export async function obtenerUsuarioControlador(req, res, next) {
  try {
    const resultado = await obtenerUsuarioServicio(req.params.id);
    return responderExito(res, resultado, {});
  } catch (error) {
    return next(error);
  }
}

export async function crearUsuarioControlador(req, res, next) {
  try {
    const resultado = await crearUsuarioServicio({
      cuerpo: req.body,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, resultado, {}, 201);
  } catch (error) {
    return next(error);
  }
}

export async function actualizarUsuarioControlador(req, res, next) {
  try {
    const resultado = await actualizarUsuarioServicio({
      id: req.params.id,
      cuerpo: req.body,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, resultado, {});
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstadoUsuarioControlador(req, res, next) {
  try {
    const resultado = await cambiarEstadoUsuarioServicio({
      id: req.params.id,
      estado: req.body.estado,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, resultado, {});
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarRolesUsuarioControlador(req, res, next) {
  try {
    const resultado = await reemplazarRolesUsuarioServicio({
      id: req.params.id,
      roles: req.body.roles,
      usuarioAutenticado: req.usuario,
    });
    return responderExito(res, { roles: resultado }, {});
  } catch (error) {
    return next(error);
  }
}
