import { responderExito } from "../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../utils/paginacion.js";
import {
  listarCanalesServicio,
  obtenerCanalServicio,
  crearCanalServicio,
  actualizarCanalServicio,
} from "./canales.servicio.js";
export async function listarCanalesControlador(req, res, next) {
  try {
    const pag = obtenerPaginacion(req.query);
    const resultado = await listarCanalesServicio({
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
export async function obtenerCanalControlador(req, res, next) {
  try {
    return responderExito(res, await obtenerCanalServicio(req.params.id), {});
  } catch (error) {
    return next(error);
  }
}
export async function crearCanalControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearCanalServicio({
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
export async function actualizarCanalControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarCanalServicio({
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
export async function cambiarEstadoCanalControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarCanalServicio({
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
