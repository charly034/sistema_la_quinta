import { responderExito } from "../../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../../utils/paginacion.js";
import {
  listarOpcionesMenuServicio,
  obtenerOpcionMenuServicio,
  crearOpcionMenuServicio,
  actualizarOpcionMenuServicio,
  reordenarOpcionesMenuServicio,
} from "./opciones-menu.servicio.js";
export async function listarOpcionesMenuControlador(req, res, next) {
  try {
    const pag = obtenerPaginacion(req.query);
    const resultado = await listarOpcionesMenuServicio({
      ...pag,
      marca: req.query.marca,
      estado: req.query.estado,
    });
    return responderExito(
      res,
      resultado.filas,
      construirMetaPaginacion({ ...pag, total: resultado.total }),
    );
  } catch (error) {
    return next(error);
  }
}
export async function obtenerOpcionMenuControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await obtenerOpcionMenuServicio(req.params.id),
      {},
    );
  } catch (error) {
    return next(error);
  }
}
export async function crearOpcionMenuControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearOpcionMenuServicio({
        cuerpo: req.body,
        usuarioAutenticado: req.usuario,
      }),
      {},
      201,
    );
  } catch (error) {
    return next(error);
  }
}
export async function actualizarOpcionMenuControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarOpcionMenuServicio({
        id: req.params.id,
        cuerpo: req.body,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}
export async function cambiarEstadoOpcionMenuControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarOpcionMenuServicio({
        id: req.params.id,
        cuerpo: { estado: req.body.estado },
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}
export async function reordenarOpcionesMenuControlador(req, res, next) {
  try {
    return responderExito(
      res,
      { opciones: await reordenarOpcionesMenuServicio(req.body) },
      {},
    );
  } catch (error) {
    return next(error);
  }
}
