import { ApiError } from "../../../utils/api-error.js";
import { validarConfiguracionParametros } from "../reglas/reglas.utilidades.js";
import * as repo from "./perfiles-reglas.repositorio.js";

function resolverPaginacionYOrden(query) {
  return {
    ...query,
    offset: (query.pagina - 1) * query.limite,
  };
}

export async function listarPerfiles(db, filtros) {
  return repo.listarPerfiles(db, resolverPaginacionYOrden(filtros));
}

export async function obtenerPerfil(db, perfilId) {
  const perfil = await repo.obtenerPerfilPorId(db, perfilId);
  if (!perfil) {
    throw new ApiError(404, "Perfil no encontrado", {
      code: "PERFIL_NO_ENCONTRADO",
    });
  }
  const detalle = await repo.obtenerDetallePerfil(db, perfilId);
  return {
    ...perfil,
    reglas: detalle,
  };
}

export async function crearPerfil(db, datos, usuarioId) {
  try {
    return await db.ejecutarEnTransaccion(async (tx) => {
      const perfil = await repo.crearPerfil(tx, { ...datos, usuarioId });

      if (datos.reglas?.length) {
        await validarReglasDetalle(tx, datos.reglas);
        await repo.reemplazarReglasPerfil(tx, perfil.id, datos.reglas);
      }

      await repo.registrarAuditoria(tx, {
        usuarioId,
        accion: "CREAR_PERFIL",
        entidad: "perfiles_reglas",
        entidadId: perfil.id,
        datosPosteriores: { codigo: perfil.codigo, estado: perfil.estado },
        motivo: "Crear perfil de reglas",
      });

      return obtenerPerfil(tx, perfil.id);
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw new ApiError(409, "Perfil duplicado", { code: "PERFIL_DUPLICADO" });
    }
    throw error;
  }
}

export async function actualizarPerfil(db, perfilId, patch, usuarioId) {
  const perfilActual = await obtenerPerfil(db, perfilId);
  const perfil = await repo.actualizarPerfil(db, perfilId, patch, usuarioId);
  if (!perfil)
    throw new ApiError(404, "Perfil no encontrado", {
      code: "PERFIL_NO_ENCONTRADO",
    });

  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "ACTUALIZAR_PERFIL",
    entidad: "perfiles_reglas",
    entidadId: perfilId,
    datosAnteriores: {
      codigo: perfilActual.codigo,
      estado: perfilActual.estado,
    },
    datosPosteriores: { codigo: perfil.codigo, estado: perfil.estado },
    motivo: "Actualizar perfil de reglas",
  });

  return obtenerPerfil(db, perfilId);
}

export async function cambiarEstadoPerfil(db, perfilId, estado, usuarioId) {
  return actualizarPerfil(db, perfilId, { estado }, usuarioId);
}

async function validarReglasDetalle(db, reglas) {
  const ids = reglas.map((r) => r.reglaId);
  const set = new Set(ids);
  if (set.size !== ids.length) {
    throw new ApiError(409, "Regla repetida dentro del perfil", {
      code: "REGLA_DUPLICADA",
    });
  }

  const reglasDb = await repo.obtenerReglasPorIds(db, ids);
  if (reglasDb.length !== ids.length) {
    throw new ApiError(404, "Regla no encontrada para detalle de perfil", {
      code: "REGLA_NO_ENCONTRADA",
    });
  }

  const reglaById = new Map(reglasDb.map((r) => [r.id, r]));
  for (const detalle of reglas) {
    if (detalle.parametrosPersonalizados) {
      const regla = reglaById.get(detalle.reglaId);
      validarConfiguracionParametros(
        regla.tipo,
        detalle.parametrosPersonalizados,
      );
    }
  }
}

export async function reemplazarReglasPerfil(db, perfilId, reglas, usuarioId) {
  const perfil = await repo.obtenerPerfilPorId(db, perfilId);
  if (!perfil)
    throw new ApiError(404, "Perfil no encontrado", {
      code: "PERFIL_NO_ENCONTRADO",
    });

  await validarReglasDetalle(db, reglas);
  await db.ejecutarEnTransaccion(async (tx) => {
    const anterior = await repo.obtenerDetallePerfil(tx, perfilId);
    await repo.reemplazarReglasPerfil(tx, perfilId, reglas);

    await repo.registrarAuditoria(tx, {
      usuarioId,
      accion: "REEMPLAZAR_REGLAS_PERFIL",
      entidad: "perfiles_reglas",
      entidadId: perfilId,
      datosAnteriores: { total: anterior.length },
      datosPosteriores: { total: reglas.length },
      motivo: "Reemplazo transaccional de reglas de perfil",
    });
  });

  return obtenerPerfil(db, perfilId);
}

export async function duplicarPerfil(db, perfilId, usuarioId) {
  return db.ejecutarEnTransaccion(async (tx) => {
    const perfil = await repo.obtenerPerfilPorId(tx, perfilId);
    if (!perfil)
      throw new ApiError(404, "Perfil no encontrado", {
        code: "PERFIL_NO_ENCONTRADO",
      });
    const detalle = await repo.obtenerDetallePerfil(tx, perfilId);

    const copia = await repo.duplicarPerfil(tx, perfil, usuarioId);
    await repo.reemplazarReglasPerfil(
      tx,
      copia.id,
      detalle.map((d) => ({
        reglaId: d.regla_id,
        orden: d.orden,
        activa: d.activa,
        pesoPersonalizado: d.peso_personalizado,
        prioridadPersonalizada: d.prioridad_personalizada,
        parametrosPersonalizados: d.parametros_personalizados,
      })),
    );

    await repo.registrarAuditoria(tx, {
      usuarioId,
      accion: "DUPLICAR_PERFIL",
      entidad: "perfiles_reglas",
      entidadId: copia.id,
      datosAnteriores: { perfilOrigenId: perfil.id },
      datosPosteriores: { perfilCopiaId: copia.id, codigo: copia.codigo },
      motivo: "Duplicar perfil de reglas",
    });

    return obtenerPerfil(tx, copia.id);
  });
}
