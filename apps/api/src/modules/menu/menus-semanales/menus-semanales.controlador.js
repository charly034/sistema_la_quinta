import { getPool, ejecutarEnTransaccion } from "../../../config/db.js";
import { responderExito } from "../../../utils/respuestas.js";
import { errorValidacionInvalida } from "../../../utils/errores.js";
import { ApiError } from "../../../utils/api-error.js";
import {
  crearSemanaSchema,
  listarSemanasSchema,
  exportarSemanaSchema,
  importarJSONSchema,
  duplicarSemanaSchema,
} from "./menus-semanales.validaciones.js";
import * as servicio from "./menus-semanales.servicio.js";
import * as servicioExportacion from "../exportaciones-menus/exportaciones-menus.servicio.js";
import * as servicioImportacion from "../importaciones-menus/importaciones-menus.servicio.js";
import * as servicioPlantilla from "../plantillas-menus/plantillas-menus.servicio.js";

function obtenerDb() {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "Pool de base de datos no inicializado", {
      code: "DB_NO_DISPONIBLE",
    });
  }

  return {
    query: (text, params) => pool.query(text, params),
    ejecutarEnTransaccion,
  };
}

function normalizarError(error, next) {
  if (error?.name === "ZodError") {
    return next(errorValidacionInvalida(error.issues || []));
  }
  return next(error);
}

export async function listarSemanasHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const filtros = listarSemanasSchema.parse({
      marcaId: req.query.marcaId,
      canalId: req.query.canalId,
      empresaId: req.query.empresaId,
      estado: req.query.estado,
      desde: req.query.desde,
      hasta: req.query.hasta,
      pagina: req.query.pagina ? parseInt(req.query.pagina, 10) : 1,
      limite: req.query.limite ? parseInt(req.query.limite, 10) : 20,
    });

    filtros.offset = (filtros.pagina - 1) * filtros.limite;
    const semanas = await servicio.listarSemanas(db, filtros);

    return responderExito(
      res,
      { semanas },
      { pagina: filtros.pagina, limite: filtros.limite, total: semanas.length },
    );
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function crearSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const datos = crearSemanaSchema.parse(req.body);
    const resultado = await servicio.crearSemanaMenu(
      db,
      datos,
      req.usuario?.id,
    );
    return responderExito(res, resultado, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function obtenerSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.obtenerSemanaCompleta(
      db,
      req.params.id || req.params.semanaId,
      req.usuario?.id,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return next(error);
  }
}

export async function actualizarSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.actualizarSemanaMenu(
      db,
      req.params.id,
      {
        fechaInicio: req.body?.fechaInicio,
        fechaFin: req.body?.fechaFin,
      },
      req.usuario?.id,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function duplicarSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const body = req.body?.semanaOrigenId
      ? req.body
      : { ...req.body, semanaOrigenId: req.params.id };
    const datos = duplicarSemanaSchema.parse(body);
    const semanaDuplicada = await servicio.duplicarSemana(
      db,
      datos,
      req.usuario?.id,
    );
    return responderExito(res, semanaDuplicada, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function listarVersionesSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const semana = await servicio.obtenerSemanaCompleta(
      db,
      req.params.id,
      req.usuario?.id,
    );
    return responderExito(res, { versiones: semana.versiones || [] });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerVersionSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const semana = await servicio.obtenerSemanaCompleta(
      db,
      req.params.id,
      req.usuario?.id,
    );
    const version = (semana.versiones || []).find(
      (v) => v.id === req.params.versionId,
    );
    if (!version) {
      throw new ApiError(
        "VERSION_NO_ENCONTRADA",
        "La versión no existe en la semana",
        404,
      );
    }
    return responderExito(res, version);
  } catch (error) {
    return next(error);
  }
}

export async function crearVersionHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const semanaId = req.params.id || req.params.semanaId;
    const versionNueva = await servicio.crearNuevaVersion(
      db,
      { ...req.body, semanaId },
      req.usuario?.id,
    );
    return responderExito(res, versionNueva, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function actualizarVersionHandler(_req, _res, next) {
  return next(
    new ApiError(
      501,
      "PUT /menu/semanas/:id/versiones/:versionId aún no implementado",
      { code: "NOT_IMPLEMENTED" },
    ),
  );
}

export async function transicionarEstadoHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const versionId = req.params.versionId;
    const versionActualizada = await servicio.transicionarEstado(
      db,
      { ...req.body, versionId },
      req.usuario?.id,
    );
    return responderExito(res, versionActualizada);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function proponerVersionHandler(req, res, next) {
  req.body.estadoNuevo = "PROPUESTO";
  return transicionarEstadoHandler(req, res, next);
}

export async function aprobarVersionHandler(req, res, next) {
  req.body.estadoNuevo = "APROBADO";
  return transicionarEstadoHandler(req, res, next);
}

export async function publicarVersionHandler(req, res, next) {
  req.body.estadoNuevo = "PUBLICADO";
  return transicionarEstadoHandler(req, res, next);
}

export async function finalizarVersionHandler(req, res, next) {
  req.body.estadoNuevo = "FINALIZADO";
  return transicionarEstadoHandler(req, res, next);
}

export async function cancelarVersionHandler(req, res, next) {
  req.body.estadoNuevo = "CANCELADO";
  return transicionarEstadoHandler(req, res, next);
}

export async function actualizarDiaPorFechaHandler(_req, _res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.actualizarDiaPorFecha(
      db,
      {
        versionId: _req.params.versionId,
        fecha: _req.params.fecha,
        estado: _req.body?.estado,
        textoEstado: _req.body?.textoEstado,
        observaciones: _req.body?.observaciones,
      },
      _req.usuario?.id,
    );
    return responderExito(_res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function actualizarOpcionesPorFechaHandler(_req, _res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.actualizarOpcionesPorFecha(
      db,
      {
        versionId: _req.params.versionId,
        fecha: _req.params.fecha,
        opciones: _req.body?.opciones || [],
      },
      _req.usuario?.id,
    );
    return responderExito(_res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function asignarPlatoHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const opcion = await servicio.asignarPlatoAOpcion(
      db,
      { ...req.body, diaId: req.body.diaId },
      req.usuario?.id,
    );
    return responderExito(res, opcion, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function obtenerHistorialPlatoHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const marcaId = req.query.marcaId;
    if (!marcaId) {
      throw new ApiError(400, "marcaId es requerido", {
        code: "VALIDACION_INVALIDA",
      });
    }
    const historial = await servicio.obtenerHistorialUsoPlato(
      db,
      req.params.id || req.params.platoId,
      marcaId,
    );
    return responderExito(res, { historial });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerHistorialVersionesHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const historial = await servicio.obtenerHistorialVersiones(
      db,
      req.params.id || req.params.semanaId,
    );
    return responderExito(res, { historial });
  } catch (error) {
    return next(error);
  }
}

export async function exportarSemanaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const datos = exportarSemanaSchema.parse(req.body);
    const { versionId, formato, plantillaId } = datos;
    const version = await servicio.obtenerVersionConContexto(db, versionId);
    const semana = await servicio.obtenerSemana(db, version.semana_menu_id);

    if (formato === "TEXTO") {
      const texto = await servicioExportacion.exportarATexto(
        db,
        versionId,
        semana,
      );
      return responderExito(res, {
        contenido: texto,
        nombre: servicioExportacion.generarNombreArchivoExportacion(
          semana.nombre_marca || "menu",
          semana.fecha_inicio,
          "txt",
        ),
        tipo: "text/plain",
      });
    }

    if (formato === "EXCEL") {
      const workbook = await servicioExportacion.exportarAExcel(
        db,
        versionId,
        semana,
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${servicioExportacion.generarNombreArchivoExportacion(semana.nombre_marca || "menu", semana.fecha_inicio, "xlsx")}"`,
      );
      return res.send(buffer);
    }

    if (formato === "WHATSAPP") {
      const mensaje = await servicioPlantilla.generarMensajeWhatsapp(
        db,
        versionId,
        plantillaId,
        semana.marca_id,
        semana,
      );
      return responderExito(res, {
        contenido: mensaje.mensaje,
        plantilla: mensaje.plantilla,
        caracteres: mensaje.caracteres,
        tipo: "WHATSAPP",
      });
    }

    throw new ApiError(400, `Formato no soportado: ${formato}`, {
      code: "FORMATO_INVALIDO",
    });
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function importarSemanasHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const datos = importarJSONSchema.parse(req.body);
    if (!req.usuario?.id) {
      throw new ApiError(400, "Usuario autenticado requerido para importar", {
        code: "USUARIO_REQUERIDO",
      });
    }

    const resultado = await servicioImportacion.importarJSON(
      db,
      datos,
      req.usuario.id,
      datos.modoSimulacion || false,
      datos.estrategiaConflicto || "ERROR",
    );
    return responderExito(res, resultado, {}, datos.modoSimulacion ? 200 : 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function obtenerMensajeWhatsappHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const semana = await servicio.obtenerSemanaCompleta(
      db,
      req.params.id,
      req.usuario?.id,
    );
    const version = semana.versionPublicada || semana.versionActual;
    if (!version) {
      throw new ApiError(
        404,
        "No hay versión disponible para generar mensaje",
        { code: "VERSION_NO_ENCONTRADA" },
      );
    }

    const mensaje = await servicioPlantilla.generarMensajeWhatsapp(
      db,
      version.id,
      req.query.plantillaId,
      semana.semana.marca_id,
      semana.semana,
    );
    return responderExito(res, mensaje);
  } catch (error) {
    return next(error);
  }
}

export async function exportarTextoHandler(req, res, next) {
  req.body = {
    versionId: req.query.versionId,
    formato: "TEXTO",
    plantillaId: req.query.plantillaId,
  };
  return exportarSemanaHandler(req, res, next);
}

export async function exportarExcelHandler(req, res, next) {
  req.body = {
    versionId: req.query.versionId,
    formato: "EXCEL",
    plantillaId: req.query.plantillaId,
  };
  return exportarSemanaHandler(req, res, next);
}
