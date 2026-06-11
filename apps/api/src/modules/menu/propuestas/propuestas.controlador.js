import { getPool, ejecutarEnTransaccion } from "../../../config/db.js";
import { responderExito } from "../../../utils/respuestas.js";
import { errorValidacionInvalida } from "../../../utils/errores.js";
import { ApiError } from "../../../utils/api-error.js";
import {
  generarPropuestasSchema,
  generarPropuestaPersonalizadaSchema,
  listarPropuestasSchema,
  descartarPropuestaSchema,
} from "./propuestas.validaciones.js";
import * as servicio from "./propuestas.servicio.js";

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

export async function generarPropuestasHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const body = generarPropuestasSchema.parse({ body: req.body }).body;
    const resultado = await servicio.generarTresPropuestas(
      db,
      req.params.id,
      req.params.versionId,
      body,
      req.usuario.id,
    );
    return responderExito(res, resultado, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function generarPropuestaPersonalizadaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const body = generarPropuestaPersonalizadaSchema.parse({
      body: req.body,
    }).body;
    const resultado = await servicio.generarPropuestaPersonalizada(
      db,
      req.params.id,
      req.params.versionId,
      body,
      req.usuario.id,
    );
    return responderExito(res, resultado, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function listarPropuestasHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const filtros = listarPropuestasSchema.parse({ query: req.query }).query;
    const resultado = await servicio.listarPropuestas(
      db,
      req.params.id,
      req.params.versionId,
      filtros,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function obtenerPropuestaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.obtenerPropuesta(
      db,
      req.params.id,
      req.params.versionId,
      req.params.propuestaId,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function aprobarPropuestaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.aprobarPropuesta(
      db,
      req.params.id,
      req.params.versionId,
      req.params.propuestaId,
      req.usuario.id,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function descartarPropuestaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const body = descartarPropuestaSchema.parse({ body: req.body }).body;
    const resultado = await servicio.descartarPropuesta(
      db,
      req.params.id,
      req.params.versionId,
      req.params.propuestaId,
      body.motivo,
      req.usuario.id,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function aplicarPropuestaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const resultado = await servicio.aplicarPropuesta(
      db,
      req.params.id,
      req.params.versionId,
      req.params.propuestaId,
      req.usuario.id,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}
