import { ApiError } from "../../../utils/api-error.js";
import * as repo from "./reglas.repositorio.js";
import {
  CODIGOS_REGLAS_RESERVADAS,
  ORIGEN_REGLA,
} from "./reglas.constantes.js";
import {
  validarCompatibilidadContextoEmpresa,
  validarConfiguracionParametros,
  validarVigencia,
} from "./reglas.utilidades.js";

export async function listarReglas(db, filtros) {
  return repo.listarReglas(db, filtros);
}

export async function obtenerRegla(db, reglaId) {
  const regla = await repo.obtenerReglaPorId(db, reglaId);
  if (!regla) {
    throw new ApiError(404, "Regla no encontrada", {
      code: "REGLA_NO_ENCONTRADA",
    });
  }
  return regla;
}

function validarEdicionTipoEnUso(reglaActual, patch) {
  if (patch.tipo && patch.tipo !== reglaActual.tipo) {
    throw new ApiError(409, "No se puede modificar tipo de regla en uso", {
      code: "REGLA_EN_USO",
    });
  }
}

export async function crearRegla(db, datos, usuarioId) {
  const empresa = await repo.obtenerEmpresa(db, datos.empresaId || null);
  validarCompatibilidadContextoEmpresa({
    marcaId: datos.marcaId || null,
    empresa,
    empresaId: datos.empresaId || null,
  });
  validarVigencia(datos.vigenciaDesde || null, datos.vigenciaHasta || null);

  const parametros = validarConfiguracionParametros(
    datos.tipo,
    datos.parametros || {},
  );

  try {
    const regla = await repo.crearRegla(db, {
      ...datos,
      parametros,
      usuarioId,
    });

    await repo.registrarAuditoria(db, {
      usuarioId,
      accion: "CREAR_REGLA",
      entidad: "reglas_menu",
      entidadId: regla.id,
      datosPosteriores: {
        codigo: regla.codigo,
        tipo: regla.tipo,
        naturaleza: regla.naturaleza,
      },
      motivo: "Crear regla de menú",
    });

    return regla;
  } catch (error) {
    if (error?.code === "23505") {
      throw new ApiError(409, "Regla duplicada para el contexto", {
        code: "REGLA_DUPLICADA",
      });
    }
    throw error;
  }
}

export async function actualizarRegla(db, reglaId, patch, usuarioId) {
  const reglaActual = await obtenerRegla(db, reglaId);
  validarEdicionTipoEnUso(reglaActual, patch);

  const tipoFinal = patch.tipo || reglaActual.tipo;
  const marcaFinal = Object.prototype.hasOwnProperty.call(patch, "marcaId")
    ? patch.marcaId
    : reglaActual.marca_id;
  const empresaFinal = Object.prototype.hasOwnProperty.call(patch, "empresaId")
    ? patch.empresaId
    : reglaActual.empresa_id;

  const empresa = await repo.obtenerEmpresa(db, empresaFinal || null);
  validarCompatibilidadContextoEmpresa({
    marcaId: marcaFinal || null,
    empresa,
    empresaId: empresaFinal || null,
  });

  const vigenciaDesde = Object.prototype.hasOwnProperty.call(
    patch,
    "vigenciaDesde",
  )
    ? patch.vigenciaDesde
    : reglaActual.vigencia_desde;
  const vigenciaHasta = Object.prototype.hasOwnProperty.call(
    patch,
    "vigenciaHasta",
  )
    ? patch.vigenciaHasta
    : reglaActual.vigencia_hasta;
  validarVigencia(vigenciaDesde || null, vigenciaHasta || null);

  if (Object.prototype.hasOwnProperty.call(patch, "parametros")) {
    patch.parametros = validarConfiguracionParametros(
      tipoFinal,
      patch.parametros || {},
    );
  }

  const actualizada = await repo.actualizarRegla(db, reglaId, patch, usuarioId);
  if (!actualizada) {
    throw new ApiError(404, "Regla no encontrada", {
      code: "REGLA_NO_ENCONTRADA",
    });
  }

  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "ACTUALIZAR_REGLA",
    entidad: "reglas_menu",
    entidadId: reglaId,
    datosAnteriores: {
      codigo: reglaActual.codigo,
      tipo: reglaActual.tipo,
      naturaleza: reglaActual.naturaleza,
      estado: reglaActual.estado,
    },
    datosPosteriores: {
      codigo: actualizada.codigo,
      tipo: actualizada.tipo,
      naturaleza: actualizada.naturaleza,
      estado: actualizada.estado,
    },
    motivo: "Actualizar regla de menú",
  });

  return actualizada;
}

export async function cambiarEstadoRegla(db, reglaId, estado, usuarioId) {
  const regla = await obtenerRegla(db, reglaId);
  const actualizada = await repo.cambiarEstadoRegla(
    db,
    reglaId,
    estado,
    usuarioId,
  );
  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "CAMBIAR_ESTADO_REGLA",
    entidad: "reglas_menu",
    entidadId: reglaId,
    datosAnteriores: { estado: regla.estado },
    datosPosteriores: { estado: actualizada.estado },
    motivo: "Cambio de estado de regla",
  });
  return actualizada;
}

export async function duplicarRegla(db, reglaId, usuarioId) {
  const regla = await obtenerRegla(db, reglaId);
  const copia = await repo.duplicarRegla(db, regla, usuarioId);
  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "DUPLICAR_REGLA",
    entidad: "reglas_menu",
    entidadId: copia.id,
    datosAnteriores: { reglaOrigenId: regla.id },
    datosPosteriores: { reglaCopiaId: copia.id, codigo: copia.codigo },
    motivo: "Duplicar regla de menú",
  });
  return copia;
}

export function resolverOrigenRegla(regla, contexto) {
  if (regla.empresa_id && regla.empresa_id === contexto.empresaId)
    return ORIGEN_REGLA.EMPRESA;
  if (regla.canal_id && regla.canal_id === contexto.canalId)
    return ORIGEN_REGLA.CANAL;
  if (regla.marca_id && regla.marca_id === contexto.marcaId)
    return ORIGEN_REGLA.MARCA;
  return ORIGEN_REGLA.GLOBAL;
}

export function validarDesactivacionReglasReservadas(codigos) {
  const conflicto = (codigos || []).find((c) =>
    CODIGOS_REGLAS_RESERVADAS.has(c),
  );
  if (conflicto) {
    throw new ApiError(
      403,
      "No se puede desactivar una regla global obligatoria reservada",
      {
        code: "REGLA_OBLIGATORIA_RESERVADA",
        details: [{ codigo: conflicto }],
      },
    );
  }
}
