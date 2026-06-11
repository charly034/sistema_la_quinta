import { getPool, ejecutarEnTransaccion } from "../../../config/db.js";
import { responderExito } from "../../../utils/respuestas.js";
import { errorValidacionInvalida } from "../../../utils/errores.js";
import { ApiError } from "../../../utils/api-error.js";
import {
  cambiarEstadoReglaSchema,
  crearReglaSchema,
  evaluarReglasSchema,
  listarReglasSchema,
  actualizarReglaSchema,
} from "./reglas.validaciones.js";
import { resolverPaginacionYOrden } from "./reglas.utilidades.js";
import * as servicioReglas from "./reglas.servicio.js";
import * as servicioPropuestas from "../propuestas/propuestas.servicio.js";

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

export async function listarReglasHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const filtros = listarReglasSchema.parse({ query: req.query }).query;
    const reglas = await servicioReglas.listarReglas(
      db,
      resolverPaginacionYOrden(filtros),
    );
    return responderExito(
      res,
      { reglas },
      { pagina: filtros.pagina, limite: filtros.limite },
    );
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function obtenerReglaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const regla = await servicioReglas.obtenerRegla(db, req.params.id);
    return responderExito(res, regla);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function crearReglaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = crearReglaSchema.parse({ body: req.body });
    const regla = await servicioReglas.crearRegla(db, body, req.usuario.id);
    return responderExito(res, regla, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function actualizarReglaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = actualizarReglaSchema.parse({ body: req.body });
    const regla = await servicioReglas.actualizarRegla(
      db,
      req.params.id,
      body,
      req.usuario.id,
    );
    return responderExito(res, regla);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function cambiarEstadoReglaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = cambiarEstadoReglaSchema.parse({ body: req.body });
    const regla = await servicioReglas.cambiarEstadoRegla(
      db,
      req.params.id,
      body.estado,
      req.usuario.id,
    );
    return responderExito(res, regla);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function duplicarReglaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const regla = await servicioReglas.duplicarRegla(
      db,
      req.params.id,
      req.usuario.id,
    );
    return responderExito(res, regla, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function evaluarReglaHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const payload = evaluarReglasSchema.parse({ body: req.body }).body;
    const resultado = await servicioPropuestas.evaluarContextoReglas(
      db,
      payload,
      req.usuario.id,
    );
    return responderExito(res, resultado);
  } catch (error) {
    return normalizarError(error, next);
  }
}
