import { responderExito } from "../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../utils/paginacion.js";
import { listarAuditoriaServicio } from "./auditoria.servicio.js";

export async function listarAuditoriaControlador(req, res, next) {
  try {
    const paginacion = obtenerPaginacion(req.query);
    const resultado = await listarAuditoriaServicio({
      ...paginacion,
      usuarioId: req.query.usuarioId,
      accion: req.query.accion,
      entidad: req.query.entidad,
      entidadId: req.query.entidadId,
      desde: req.query.desde,
      hasta: req.query.hasta,
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
