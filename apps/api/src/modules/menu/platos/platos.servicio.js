import { ejecutarEnTransaccion } from "../../../utils/transacciones.js";
import { generarIdentificador } from "../../../utils/seguridad.js";
import { obtenerMarcaPorId } from "../../marcas/marcas.repositorio.js";
import { crearAuditoria } from "../../autenticacion/autenticacion.repositorio.js";
import { sanitizarDatosAuditoria } from "../../auditoria/auditoria.utilidades.js";
import {
  errorRecursoNoEncontrado,
  errorPlatoDuplicado,
  errorCicloComponentes,
  errorComponenteInvalido,
  errorAliasDuplicado,
  errorClasificacionInvalida,
  errorConflictoIntegridad,
} from "../../../utils/errores.js";
import {
  CLASIFICACIONES_CONFIG,
  RELACIONES_CONFIG,
  RECURSOS_CLASIFICACION_ALIAS,
} from "./platos.constantes.js";
import {
  estadoArchivado,
  normalizarTextoBusqueda,
} from "./platos.utilidades.js";
import {
  listarPlatosRepositorio,
  obtenerPlatoPorIdRepositorio,
  buscarPlatoDuplicadoRepositorio,
  crearPlatoRepositorio,
  actualizarPlatoRepositorio,
  reemplazarComponentesRepositorio,
  existeCaminoEntrePlatosRepositorio,
  crearAliasPlatoRepositorio,
  eliminarAliasPlatoRepositorio,
  reemplazarRelacionesBasicasRepositorio,
  reemplazarIngredientesRepositorio,
  reemplazarAlergenosRepositorio,
  reemplazarCaracteristicasRepositorio,
  validarIdsCatalogoRepositorio,
  listarClasificacionesRepositorio,
  obtenerClasificacionPorIdRepositorio,
  buscarClasificacionPorCodigoRepositorio,
  crearClasificacionRepositorio,
  actualizarClasificacionRepositorio,
} from "./platos.repositorio.js";

function errorSegunBase(error, porDefecto) {
  if (error?.code === "23505") return porDefecto;
  return error;
}

async function registrarAuditoria(datos, cliente) {
  return crearAuditoria(
    {
      id: generarIdentificador(),
      ...datos,
      datosAnteriores: datos.datosAnteriores
        ? sanitizarDatosAuditoria(datos.datosAnteriores)
        : null,
      datosPosteriores: datos.datosPosteriores
        ? sanitizarDatosAuditoria(datos.datosPosteriores)
        : null,
    },
    cliente,
  );
}

function assertRecursoConfig(recurso) {
  const recursoNormalizado = RECURSOS_CLASIFICACION_ALIAS[recurso] || recurso;
  const config = CLASIFICACIONES_CONFIG[recursoNormalizado];
  if (!config) {
    throw errorRecursoNoEncontrado("Recurso de clasificacion no soportado");
  }
  return { config, recursoNormalizado };
}

async function validarDuplicadoPlato(
  { marcaId, tipo, nombre, excluirId },
  cliente,
) {
  const duplicado = await buscarPlatoDuplicadoRepositorio(
    {
      marcaId,
      tipo,
      nombreNormalizado: normalizarTextoBusqueda(nombre),
      excluirId,
    },
    cliente,
  );

  if (duplicado) {
    throw errorPlatoDuplicado(
      "Ya existe un plato con ese nombre y tipo. Revisa si corresponde restaurar el registro existente.",
    );
  }
}

export async function listarPlatosServicio(filtros) {
  return listarPlatosRepositorio(filtros);
}

export async function obtenerPlatoPorIdServicio(id) {
  const plato = await obtenerPlatoPorIdRepositorio(id);
  if (!plato) throw errorRecursoNoEncontrado("Plato no encontrado");
  return plato;
}

export async function obtenerComponentesPlatoServicio(id) {
  const plato = await obtenerPlatoPorIdServicio(id);
  return plato.componentes;
}

export async function obtenerRelacionesPlatoServicio(id) {
  const plato = await obtenerPlatoPorIdServicio(id);
  return {
    categorias: plato.categorias,
    proteinas: plato.proteinas,
    etiquetas: plato.etiquetas,
    ingredientes: plato.ingredientes,
    alergenos: plato.alergenos,
    "caracteristicas-alimentarias": plato.caracteristicas,
  };
}

function validarPayloadComponentes(componentes) {
  const ids = componentes.map((item) => item.platoComponenteId);
  const idsUnicos = new Set(ids);
  if (idsUnicos.size !== ids.length) {
    throw errorComponenteInvalido(
      "No se permiten componentes repetidos en el mismo reemplazo",
    );
  }

  const ordenes = componentes.map((item) => item.orden ?? 0);
  if (ordenes.some((orden) => Number(orden) < 0)) {
    throw errorComponenteInvalido("El orden debe ser mayor o igual a cero");
  }

  const ordenesUnicos = new Set(ordenes);
  if (ordenesUnicos.size !== ordenes.length) {
    throw errorComponenteInvalido(
      "No se permiten ordenes duplicados en componentes",
    );
  }
}

export async function crearPlatoServicio({ cuerpo, usuarioAutenticado }) {
  const marca = await obtenerMarcaPorId(cuerpo.marcaId);
  if (!marca) throw errorRecursoNoEncontrado("Marca no encontrada");

  await validarDuplicadoPlato(
    {
      marcaId: cuerpo.marcaId,
      tipo: cuerpo.tipo,
      nombre: cuerpo.nombre,
      excluirId: null,
    },
    null,
  );

  return ejecutarEnTransaccion(async (cliente) => {
    try {
      const creado = await crearPlatoRepositorio(
        {
          ...cuerpo,
          creadoPor: usuarioAutenticado?.id,
          actualizadoPor: usuarioAutenticado?.id,
        },
        cliente,
      );

      await registrarAuditoria(
        {
          usuarioId: usuarioAutenticado?.id,
          accion: "CREAR_PLATO",
          entidad: "platos",
          entidadId: creado.id,
          datosPosteriores: creado,
          direccionIp: usuarioAutenticado?.direccionIp,
          agenteUsuario: usuarioAutenticado?.agenteUsuario,
        },
        cliente,
      );

      return creado;
    } catch (error) {
      throw errorSegunBase(error, errorPlatoDuplicado());
    }
  });
}

export async function actualizarPlatoServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerPlatoPorIdRepositorio(id);
  if (!antes) throw errorRecursoNoEncontrado("Plato no encontrado");

  const marcaId = cuerpo.marcaId || antes.marca_id;
  if (cuerpo.marcaId && cuerpo.marcaId !== antes.marca_id) {
    const marca = await obtenerMarcaPorId(cuerpo.marcaId);
    if (!marca) throw errorRecursoNoEncontrado("Marca no encontrada");
  }

  if (cuerpo.nombre || cuerpo.tipo) {
    await validarDuplicadoPlato(
      {
        marcaId,
        tipo: cuerpo.tipo || antes.tipo,
        nombre: cuerpo.nombre || antes.nombre,
        excluirId: id,
      },
      null,
    );
  }

  return ejecutarEnTransaccion(async (cliente) => {
    try {
      const payload = {
        ...cuerpo,
        actualizadoPor: usuarioAutenticado?.id,
      };

      if (cuerpo.estado && estadoArchivado(cuerpo.estado)) {
        payload.eliminadoEn = new Date().toISOString();
      }
      if (cuerpo.estado && !estadoArchivado(cuerpo.estado)) {
        payload.eliminadoEn = null;
      }

      const despues = await actualizarPlatoRepositorio(id, payload, cliente);

      await registrarAuditoria(
        {
          usuarioId: usuarioAutenticado?.id,
          accion: "ACTUALIZAR_PLATO",
          entidad: "platos",
          entidadId: id,
          datosAnteriores: antes,
          datosPosteriores: despues,
          direccionIp: usuarioAutenticado?.direccionIp,
          agenteUsuario: usuarioAutenticado?.agenteUsuario,
        },
        cliente,
      );

      return despues;
    } catch (error) {
      throw errorSegunBase(error, errorPlatoDuplicado());
    }
  });
}

export async function actualizarComponentesPlatoServicio({
  id,
  componentes,
  usuarioAutenticado,
}) {
  const plato = await obtenerPlatoPorIdRepositorio(id);
  if (!plato) throw errorRecursoNoEncontrado("Plato no encontrado");

  validarPayloadComponentes(componentes);

  for (const componente of componentes) {
    if (componente.platoComponenteId === id) {
      throw errorComponenteInvalido(
        "Un plato no puede ser componente de si mismo",
      );
    }

    const existeCiclo = await existeCaminoEntrePlatosRepositorio(
      componente.platoComponenteId,
      id,
    );
    if (existeCiclo) {
      throw errorCicloComponentes(
        "El reemplazo de componentes generaria un ciclo entre platos",
      );
    }
  }

  return ejecutarEnTransaccion(async (cliente) => {
    const antes = await obtenerPlatoPorIdRepositorio(id, cliente);
    try {
      await reemplazarComponentesRepositorio(id, componentes, cliente);
    } catch (error) {
      if (["23505", "23503", "23514"].includes(error?.code)) {
        throw errorComponenteInvalido(
          "Los componentes enviados no cumplen las reglas de integridad",
        );
      }
      throw error;
    }
    const despues = await obtenerPlatoPorIdRepositorio(id, cliente);

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "REEMPLAZAR_COMPONENTES_PLATO",
        entidad: "componentes_plato",
        entidadId: id,
        datosAnteriores: antes?.componentes,
        datosPosteriores: despues?.componentes,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return despues;
  });
}

export async function crearAliasPlatoServicio({
  id,
  alias,
  usuarioAutenticado,
}) {
  const plato = await obtenerPlatoPorIdRepositorio(id);
  if (!plato) throw errorRecursoNoEncontrado("Plato no encontrado");

  return ejecutarEnTransaccion(async (cliente) => {
    try {
      const creado = await crearAliasPlatoRepositorio(id, alias, cliente);
      const despues = await obtenerPlatoPorIdRepositorio(id, cliente);
      await registrarAuditoria(
        {
          usuarioId: usuarioAutenticado?.id,
          accion: "CREAR_ALIAS_PLATO",
          entidad: "alias_platos",
          entidadId: creado.id,
          datosPosteriores: creado,
          direccionIp: usuarioAutenticado?.direccionIp,
          agenteUsuario: usuarioAutenticado?.agenteUsuario,
        },
        cliente,
      );
      return despues;
    } catch (error) {
      throw errorSegunBase(
        error,
        errorAliasDuplicado("Ese alias ya existe para el plato"),
      );
    }
  });
}

export async function eliminarAliasPlatoServicio({
  id,
  aliasId,
  usuarioAutenticado,
}) {
  const plato = await obtenerPlatoPorIdRepositorio(id);
  if (!plato) throw errorRecursoNoEncontrado("Plato no encontrado");

  return ejecutarEnTransaccion(async (cliente) => {
    const eliminado = await eliminarAliasPlatoRepositorio(aliasId, cliente);
    if (!eliminado) throw errorRecursoNoEncontrado("Alias no encontrado");

    const despues = await obtenerPlatoPorIdRepositorio(id, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ELIMINAR_ALIAS_PLATO",
        entidad: "alias_platos",
        entidadId: aliasId,
        datosPosteriores: { eliminado: true },
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return despues;
  });
}

async function validarRelaciones(platoId, tipoRelacion, ids, cliente) {
  const config = RELACIONES_CONFIG[tipoRelacion];
  if (!config) {
    throw errorClasificacionInvalida("Relacion no soportada");
  }

  const plato = await obtenerPlatoPorIdRepositorio(platoId, cliente);
  if (!plato) throw errorRecursoNoEncontrado("Plato no encontrado");

  const esValido = await validarIdsCatalogoRepositorio(
    config.tablaCatalogo,
    ids,
    {
      marcaId: config.tablaCatalogo === "alergenos" ? null : plato.marca_id,
      columnaEstado: config.columnaEstadoCatalogo,
    },
    cliente,
  );

  if (!esValido) {
    throw errorClasificacionInvalida(
      "Alguna clasificacion no existe, esta archivada o pertenece a otra marca",
    );
  }

  return { plato, config };
}

export async function reemplazarRelacionBasicaPlatoServicio({
  id,
  tipoRelacion,
  ids,
  usuarioAutenticado,
}) {
  return ejecutarEnTransaccion(async (cliente) => {
    const { config } = await validarRelaciones(id, tipoRelacion, ids, cliente);
    const antes = await obtenerPlatoPorIdRepositorio(id, cliente);
    await reemplazarRelacionesBasicasRepositorio(id, config, ids, cliente);
    const despues = await obtenerPlatoPorIdRepositorio(id, cliente);

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: `REEMPLAZAR_RELACION_${String(tipoRelacion).toUpperCase()}`,
        entidad: config.tablaRelacion,
        entidadId: id,
        datosAnteriores: antes,
        datosPosteriores: despues,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return despues;
  });
}

export async function reemplazarIngredientesPlatoServicio({
  id,
  items,
  usuarioAutenticado,
}) {
  return ejecutarEnTransaccion(async (cliente) => {
    const ids = items.map((item) => item.id);
    await validarRelaciones(id, "ingredientes", ids, cliente);

    const antes = await obtenerPlatoPorIdRepositorio(id, cliente);
    await reemplazarIngredientesRepositorio(id, items, cliente);
    const despues = await obtenerPlatoPorIdRepositorio(id, cliente);

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "REEMPLAZAR_INGREDIENTES_PLATO",
        entidad: "platos_ingredientes",
        entidadId: id,
        datosAnteriores: antes?.ingredientes,
        datosPosteriores: despues?.ingredientes,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return despues;
  });
}

export async function reemplazarAlergenosPlatoServicio({
  id,
  items,
  usuarioAutenticado,
}) {
  return ejecutarEnTransaccion(async (cliente) => {
    const ids = items.map((item) => item.id);
    await validarRelaciones(id, "alergenos", ids, cliente);

    const antes = await obtenerPlatoPorIdRepositorio(id, cliente);
    await reemplazarAlergenosRepositorio(id, items, cliente);
    const despues = await obtenerPlatoPorIdRepositorio(id, cliente);

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "REEMPLAZAR_ALERGENOS_PLATO",
        entidad: "platos_alergenos",
        entidadId: id,
        datosAnteriores: antes?.alergenos,
        datosPosteriores: despues?.alergenos,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return despues;
  });
}

export async function reemplazarCaracteristicasPlatoServicio({
  id,
  items,
  usuarioAutenticado,
}) {
  return ejecutarEnTransaccion(async (cliente) => {
    const ids = items.map((item) => item.id);
    await validarRelaciones(id, "caracteristicas-alimentarias", ids, cliente);

    const antes = await obtenerPlatoPorIdRepositorio(id, cliente);
    await reemplazarCaracteristicasRepositorio(id, items, cliente);
    const despues = await obtenerPlatoPorIdRepositorio(id, cliente);

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "REEMPLAZAR_CARACTERISTICAS_PLATO",
        entidad: "platos_caracteristicas",
        entidadId: id,
        datosAnteriores: antes?.caracteristicas,
        datosPosteriores: despues?.caracteristicas,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return despues;
  });
}

export async function listarClasificacionesServicio(recurso, filtros) {
  const { config } = assertRecursoConfig(recurso);
  return listarClasificacionesRepositorio(config, filtros);
}

export async function obtenerClasificacionPorIdServicio(recurso, id) {
  const { config } = assertRecursoConfig(recurso);
  const registro = await obtenerClasificacionPorIdRepositorio(config, id);
  if (!registro) throw errorRecursoNoEncontrado("Clasificacion no encontrada");
  return registro;
}

export async function crearClasificacionServicio({
  recurso,
  cuerpo,
  usuarioAutenticado,
}) {
  const { config } = assertRecursoConfig(recurso);

  if (config.tieneMarca) {
    if (!cuerpo.marcaId) {
      throw errorClasificacionInvalida(
        "marcaId es obligatorio para este recurso",
      );
    }
    const marca = await obtenerMarcaPorId(cuerpo.marcaId);
    if (!marca) throw errorRecursoNoEncontrado("Marca no encontrada");
  }

  const existente = await buscarClasificacionPorCodigoRepositorio(
    config,
    {
      codigo: cuerpo.codigo,
      marcaId: cuerpo.marcaId,
      excluirId: null,
    },
    null,
  );

  if (existente) {
    throw errorClasificacionInvalida("Ya existe un registro con ese codigo");
  }

  return ejecutarEnTransaccion(async (cliente) => {
    try {
      const creado = await crearClasificacionRepositorio(
        config,
        cuerpo,
        cliente,
      );
      await registrarAuditoria(
        {
          usuarioId: usuarioAutenticado?.id,
          accion: `CREAR_${config.entidad.toUpperCase()}`,
          entidad: config.entidad,
          entidadId: creado.id,
          datosPosteriores: creado,
          direccionIp: usuarioAutenticado?.direccionIp,
          agenteUsuario: usuarioAutenticado?.agenteUsuario,
        },
        cliente,
      );
      return creado;
    } catch (error) {
      throw errorSegunBase(error, errorConflictoIntegridad("Codigo duplicado"));
    }
  });
}

export async function actualizarClasificacionServicio({
  recurso,
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const { config } = assertRecursoConfig(recurso);
  const antes = await obtenerClasificacionPorIdRepositorio(config, id);
  if (!antes) throw errorRecursoNoEncontrado("Clasificacion no encontrada");

  if (cuerpo.codigo) {
    const existente = await buscarClasificacionPorCodigoRepositorio(
      config,
      {
        codigo: cuerpo.codigo,
        marcaId: cuerpo.marcaId || antes.marca_id,
        excluirId: id,
      },
      null,
    );
    if (existente) {
      throw errorClasificacionInvalida("Ya existe un registro con ese codigo");
    }
  }

  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await actualizarClasificacionRepositorio(
      config,
      id,
      cuerpo,
      cliente,
    );

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: `ACTUALIZAR_${config.entidad.toUpperCase()}`,
        entidad: config.entidad,
        entidadId: id,
        datosAnteriores: antes,
        datosPosteriores: despues,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return despues;
  });
}
