import { getPool, ejecutarEnTransaccion } from "../../../config/db.js";
import { responderExito } from "../../../utils/respuestas.js";
import { errorValidacionInvalida } from "../../../utils/errores.js";
import { ApiError } from "../../../utils/api-error.js";
import {
  crearPerfilSchema,
  actualizarPerfilSchema,
  listarPerfilesSchema,
  cambiarEstadoPerfilSchema,
  reemplazarReglasPerfilSchema,
} from "./perfiles-reglas.validaciones.js";
import * as servicio from "./perfiles-reglas.servicio.js";

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

export async function listarPerfilesHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const filtros = listarPerfilesSchema.parse({ query: req.query }).query;
    const perfiles = await servicio.listarPerfiles(db, filtros);
    return responderExito(
      res,
      { perfiles },
      { pagina: filtros.pagina, limite: filtros.limite },
    );
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function obtenerPerfilHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const perfil = await servicio.obtenerPerfil(db, req.params.id);
    return responderExito(res, perfil);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function crearPerfilHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = crearPerfilSchema.parse({ body: req.body });
    const perfil = await servicio.crearPerfil(db, body, req.usuario.id);
    return responderExito(res, perfil, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function actualizarPerfilHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = actualizarPerfilSchema.parse({ body: req.body });
    const perfil = await servicio.actualizarPerfil(
      db,
      req.params.id,
      body,
      req.usuario.id,
    );
    return responderExito(res, perfil);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function cambiarEstadoPerfilHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = cambiarEstadoPerfilSchema.parse({ body: req.body });
    const perfil = await servicio.cambiarEstadoPerfil(
      db,
      req.params.id,
      body.estado,
      req.usuario.id,
    );
    return responderExito(res, perfil);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function reemplazarReglasPerfilHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const { body } = reemplazarReglasPerfilSchema.parse({ body: req.body });
    const perfil = await servicio.reemplazarReglasPerfil(
      db,
      req.params.id,
      body.reglas,
      req.usuario.id,
    );
    return responderExito(res, perfil);
  } catch (error) {
    return normalizarError(error, next);
  }
}

export async function duplicarPerfilHandler(req, res, next) {
  try {
    const db = obtenerDb();
    const perfil = await servicio.duplicarPerfil(
      db,
      req.params.id,
      req.usuario.id,
    );
    return responderExito(res, perfil, {}, 201);
  } catch (error) {
    return normalizarError(error, next);
  }
}
