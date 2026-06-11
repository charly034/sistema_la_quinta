import { responderExito } from "../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../utils/paginacion.js";
import {
  listarEmpresasServicio,
  obtenerEmpresaServicio,
  crearEmpresaServicio,
  actualizarEmpresaServicio,
  reemplazarMarcasEmpresaServicio,
} from "./empresas.servicio.js";
export async function listarEmpresasControlador(req, res, next) {
  try {
    const pag = obtenerPaginacion(req.query);
    const resultado = await listarEmpresasServicio({
      ...pag,
      buscar: req.query.buscar,
      estado: req.query.estado,
      marca: req.query.marca,
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
export async function obtenerEmpresaControlador(req, res, next) {
  try {
    return responderExito(res, await obtenerEmpresaServicio(req.params.id), {});
  } catch (error) {
    return next(error);
  }
}
export async function crearEmpresaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearEmpresaServicio({
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
export async function actualizarEmpresaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarEmpresaServicio({
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
export async function cambiarEstadoEmpresaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarEmpresaServicio({
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
export async function reemplazarMarcasEmpresaControlador(req, res, next) {
  try {
    return responderExito(
      res,
      {
        marcas: await reemplazarMarcasEmpresaServicio({
          id: req.params.id,
          marcas: req.body.marcas,
          usuarioAutenticado: req.usuario,
        }),
      },
      {},
    );
  } catch (error) {
    return next(error);
  }
}
