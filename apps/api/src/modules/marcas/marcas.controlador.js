import { responderExito } from "../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../utils/paginacion.js";
import {
  listarMarcasServicio,
  obtenerMarcaServicio,
  crearMarcaServicio,
  actualizarMarcaServicio,
} from "./marcas.servicio.js";

export async function listarMarcasControlador(req, res, next) {
  try {
    const pag = obtenerPaginacion(req.query);
    const resultado = await listarMarcasServicio({
      ...pag,
      buscar: req.query.buscar,
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
export async function obtenerMarcaControlador(req, res, next) {
  try {
    return responderExito(res, await obtenerMarcaServicio(req.params.id), {});
  } catch (error) {
    return next(error);
  }
}
export async function crearMarcaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearMarcaServicio({
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
export async function actualizarMarcaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarMarcaServicio({
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
export async function cambiarEstadoMarcaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarMarcaServicio({
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
