import { responderExito } from "../../../utils/respuestas.js";
import {
  obtenerPaginacion,
  construirMetaPaginacion,
} from "../../../utils/paginacion.js";
import {
  listarPlatosServicio,
  obtenerPlatoPorIdServicio,
  obtenerComponentesPlatoServicio,
  obtenerRelacionesPlatoServicio,
  crearPlatoServicio,
  actualizarPlatoServicio,
  actualizarComponentesPlatoServicio,
  crearAliasPlatoServicio,
  eliminarAliasPlatoServicio,
  reemplazarRelacionBasicaPlatoServicio,
  reemplazarIngredientesPlatoServicio,
  reemplazarAlergenosPlatoServicio,
  reemplazarCaracteristicasPlatoServicio,
  listarClasificacionesServicio,
  obtenerClasificacionPorIdServicio,
  crearClasificacionServicio,
  actualizarClasificacionServicio,
} from "./platos.servicio.js";

export async function listarPlatosControlador(req, res, next) {
  try {
    const pag = obtenerPaginacion(req.query);
    const resultado = await listarPlatosServicio({
      ...pag,
      marcaId: req.query.marcaId,
      tipo: req.query.tipo,
      estado: req.query.estado,
      categoriaId: req.query.categoriaId,
      proteinaId: req.query.proteinaId,
      favorito: req.query.favorito,
      buscar: req.query.buscar,
      q: req.query.q,
      includeArchivados: req.query.includeArchivados,
      sortBy: req.query.sortBy,
      sortDir: req.query.sortDir,
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

export async function obtenerPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await obtenerPlatoPorIdServicio(req.params.id),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function obtenerComponentesPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await obtenerComponentesPlatoServicio(req.params.id),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function obtenerRelacionesPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await obtenerRelacionesPlatoServicio(req.params.id),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function crearPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearPlatoServicio({
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

export async function actualizarPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarPlatoServicio({
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

export async function actualizarEstadoPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarPlatoServicio({
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

export async function actualizarFavoritoPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarPlatoServicio({
        id: req.params.id,
        cuerpo: { favorito: req.body.favorito },
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarComponentesPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarComponentesPlatoServicio({
        id: req.params.id,
        componentes: req.body.componentes,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function crearAliasPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearAliasPlatoServicio({
        id: req.params.id,
        alias: req.body.alias,
        usuarioAutenticado: req.usuario,
      }),
      {},
      201,
    );
  } catch (error) {
    return next(error);
  }
}

export async function eliminarAliasPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await eliminarAliasPlatoServicio({
        id: req.params.id,
        aliasId: req.params.aliasId,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarRelacionBasicaPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await reemplazarRelacionBasicaPlatoServicio({
        id: req.params.id,
        tipoRelacion: req.params.relacion,
        ids: req.body.ids,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarIngredientesPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await reemplazarIngredientesPlatoServicio({
        id: req.params.id,
        items: req.body.items,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarAlergenosPlatoControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await reemplazarAlergenosPlatoServicio({
        id: req.params.id,
        items: req.body.items,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function reemplazarCaracteristicasPlatoControlador(
  req,
  res,
  next,
) {
  try {
    return responderExito(
      res,
      await reemplazarCaracteristicasPlatoServicio({
        id: req.params.id,
        items: req.body.items,
        usuarioAutenticado: req.usuario,
      }),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function listarClasificacionesControlador(req, res, next) {
  try {
    const pag = obtenerPaginacion(req.query);
    const resultado = await listarClasificacionesServicio(req.params.recurso, {
      ...pag,
      marcaId: req.query.marcaId,
      estado: req.query.estado,
      q: req.query.q,
      includeArchivadas: req.query.includeArchivadas,
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

export async function obtenerClasificacionControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await obtenerClasificacionPorIdServicio(
        req.params.recurso,
        req.params.id,
      ),
      {},
    );
  } catch (error) {
    return next(error);
  }
}

export async function crearClasificacionControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await crearClasificacionServicio({
        recurso: req.params.recurso,
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

export async function actualizarClasificacionControlador(req, res, next) {
  try {
    return responderExito(
      res,
      await actualizarClasificacionServicio({
        recurso: req.params.recurso,
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
