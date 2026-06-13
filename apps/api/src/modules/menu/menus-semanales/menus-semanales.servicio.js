/**
 * Servicio de menús semanales
 * Lógica de negocio, transacciones y orquestación
 * Spec Etapa 3 - Secciones 8-17
 */

import { v4 as uuid } from "uuid";
import crypto from "node:crypto";
import * as repo from "./menus-semanales.repositorio.js";
import * as util from "./menus-semanales.utilidades.js";
import {
  ESTADOS_VERSION,
  TRANSICIONES_VALIDAS,
  ESTADOS_DIA,
  validarTransicion,
  obtenerTransicionesPermitidas,
} from "./menus-semanales.constantes.js";
import {
  crearSemanaSchema,
  crearVersionSchema,
  actualizarEstadoVersionSchema,
  crearDiaSchema,
  asignarPlatoSchema,
} from "./menus-semanales.validaciones.js";
import { ApiError } from "../../../utils/api-error.js";

/**
 * CREAR SEMANA MENÚ
 * Spec Etapa 3 - Sección 8: Estructura de semana lógica
 */
export async function crearSemanaMenu(db, datosCreacion, usuarioId) {
  // Validar datos
  const datosValidados = crearSemanaSchema.parse(datosCreacion);

  // Verificar que marca existe
  const marca = await db.query("SELECT id FROM marcas WHERE id = $1", [
    datosValidados.marcaId,
  ]);
  if (marca.rows.length === 0) {
    throw new ApiError(
      "MARCA_NO_ENCONTRADA",
      "La marca especificada no existe",
      404,
    );
  }

  if (datosValidados.canalId) {
    const canal = await db.query("SELECT id FROM canales WHERE id = $1", [
      datosValidados.canalId,
    ]);
    if (canal.rows.length === 0) {
      throw new ApiError(
        "CANAL_NO_ENCONTRADO",
        "El canal especificado no existe",
        404,
      );
    }
  }

  if (datosValidados.empresaId) {
    const empresa = await db.query("SELECT id FROM empresas WHERE id = $1", [
      datosValidados.empresaId,
    ]);
    if (empresa.rows.length === 0) {
      throw new ApiError(
        "EMPRESA_NO_ASOCIADA_A_MARCA",
        "La empresa seleccionada no pertenece a la marca",
        409,
      );
    }

    const empresaMarca = await db.query(
      `SELECT 1
       FROM empresas_marcas
       WHERE empresa_id = $1 AND marca_id = $2
       LIMIT 1`,
      [datosValidados.empresaId, datosValidados.marcaId],
    );

    if (empresaMarca.rows.length === 0) {
      throw new ApiError(
        "EMPRESA_NO_ASOCIADA_A_MARCA",
        "La empresa seleccionada no pertenece a la marca",
        409,
      );
    }
  }

  // Verificar unicidad de contexto (marca + canal + empresa + fechaInicio)
  // Spec Etapa 3 - Sección 8
  const existente = await db.query(
    `SELECT id FROM semanas_menu
     WHERE marca_id = $1
     AND COALESCE(canal_id, '00000000-0000-0000-0000-000000000001'::uuid) = COALESCE($2, '00000000-0000-0000-0000-000000000001'::uuid)
     AND COALESCE(empresa_id, '00000000-0000-0000-0000-000000000002'::uuid) = COALESCE($3, '00000000-0000-0000-0000-000000000002'::uuid)
     AND fecha_inicio = $4
     AND eliminado_en IS NULL`,
    [
      datosValidados.marcaId,
      datosValidados.canalId,
      datosValidados.empresaId,
      datosValidados.fechaInicio,
    ],
  );

  if (existente.rows.length > 0) {
    throw new ApiError(
      "SEMANA_DUPLICADA_CONTEXTO",
      "Ya existe una semana para este contexto (marca, canal, empresa) en esta fecha",
      409,
    );
  }

  return db.ejecutarEnTransaccion(async (dbTx) => {
    // Crear semana
    const semana = await repo.crearSemana(dbTx, {
      ...datosValidados,
      creadoPorId: usuarioId,
    });

    // Crear versión inicial (BORRADOR)
    const version = await repo.crearVersion(dbTx, {
      semanaId: semana.id,
      numeroVersion: 1,
      creadoPorId: usuarioId,
      observaciones: datosValidados.observaciones || "Versión inicial",
      motivoCambio: "Creación de semana",
    });

    // Marcar versión como actual
    await repo.marcarVersionActual(dbTx, semana.id, version.id);

    // Crear 7 días automáticamente
    // Spec Etapa 3 - Sección 10: Creación automática de 7 días
    const diasGenerados = util.generarSieteDias(datosValidados.fechaInicio);

    for (const dia of diasGenerados) {
      await repo.crearDia(dbTx, {
        versionId: version.id,
        ...dia,
      });
    }

    // Registrar en auditoría
    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "semanas_menu",
      entidadId: semana.id,
      accion: "CREAR",
      valoresNuevos: {
        marcaId: semana.marca_id,
        fechaInicio: semana.fecha_inicio,
        fechaFin: semana.fecha_fin,
      },
      motivo: "Creación de nueva semana menú",
    });

    return {
      semana,
      versionInicial: version,
      diasCreados: diasGenerados.length,
    };
  });
}

/**
 * OBTENER SEMANA CON CONTEXTO COMPLETO
 */
export async function obtenerSemanaCompleta(db, semanaId, usuarioId) {
  const semana = await repo.obtenerSemana(db, semanaId);
  if (!semana) {
    throw new ApiError(
      "SEMANA_NO_ENCONTRADA",
      "La semana especificada no existe",
      404,
    );
  }

  const versiones = await repo.obtenerVersionesPorSemana(db, semanaId);
  const versionActual = await repo.obtenerVersionActual(db, semanaId);
  const versionPublicada = await repo.obtenerVersionPublicada(db, semanaId);

  let diasYOpciones = null;
  if (versionActual) {
    const dias = await repo.obtenerDiasPorVersion(db, versionActual.id);
    diasYOpciones = await Promise.all(
      dias.map(async (dia) => ({
        ...dia,
        opciones: await repo.obtenerOpcionesPorDia(db, dia.id),
      })),
    );
  }

  return {
    semana,
    versiones,
    versionActual,
    versionPublicada,
    diasYOpciones,
  };
}

/**
 * LISTAR SEMANAS CON FILTROS
 */
export async function listarSemanas(db, filtros) {
  const semanas = await repo.listarSemanas(db, filtros);

  // Enriquecer cada semana con su versión actual
  return Promise.all(
    semanas.map(async (semana) => {
      const versionActual = await repo.obtenerVersionActual(db, semana.id);
      const versionPublicada = await repo.obtenerVersionPublicada(
        db,
        semana.id,
      );
      return {
        ...semana,
        versionActualId: versionActual?.id,
        versionActualEstado: versionActual?.estado,
        versionPublicadaId: versionPublicada?.id,
      };
    }),
  );
}

export async function actualizarSemanaMenu(db, semanaId, datos, usuarioId) {
  const semana = await repo.obtenerSemana(db, semanaId);
  if (!semana) {
    throw new ApiError(
      "SEMANA_NO_ENCONTRADA",
      "La semana especificada no existe",
      404,
    );
  }

  const versionActual = await repo.obtenerVersionActual(db, semanaId);
  if (
    versionActual &&
    [ESTADOS_VERSION.PUBLICADO, ESTADOS_VERSION.FINALIZADO].includes(
      versionActual.estado,
    )
  ) {
    throw new ApiError(
      "SEMANA_NO_EDITABLE",
      "La semana tiene una versión publicada o finalizada y no puede editarse",
      409,
    );
  }

  const fechaInicio = datos.fechaInicio || semana.fecha_inicio;
  const fechaFin = datos.fechaFin || semana.fecha_fin;
  if (!util.esSemanValida(fechaInicio, fechaFin)) {
    throw new ApiError(
      "RANGO_FECHA_INVALIDO",
      "El rango de fechas no forma una semana válida",
      400,
    );
  }

  return db.ejecutarEnTransaccion(async (dbTx) => {
    const actualizada = await repo.actualizarSemana(dbTx, semanaId, {
      fechaInicio,
      fechaFin,
    });

    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "semanas_menu",
      entidadId: semanaId,
      accion: "ACTUALIZAR",
      valoresAnteriores: {
        fechaInicio: semana.fecha_inicio,
        fechaFin: semana.fecha_fin,
      },
      valoresNuevos: { fechaInicio, fechaFin },
      motivo: "Edición de semana",
    });

    return actualizada;
  });
}

/**
 * CREAR NUEVA VERSIÓN
 * Spec Etapa 3 - Sección 9: Versionado
 */
export async function crearNuevaVersion(db, datosCreacion, usuarioId) {
  const datosValidados = crearVersionSchema.parse(datosCreacion);

  const semana = await repo.obtenerSemana(db, datosValidados.semanaId);
  if (!semana) {
    throw new ApiError(
      "SEMANA_NO_ENCONTRADA",
      "La semana especificada no existe",
      404,
    );
  }

  // Obtener número de versión siguiente
  const versiones = await repo.obtenerVersionesPorSemana(
    db,
    datosValidados.semanaId,
  );
  const numeroVersionNueva = (versiones[0]?.numero_version || 0) + 1;

  return db.ejecutarEnTransaccion(async (dbTx) => {
    // Crear nueva versión clonando la versión anterior
    const versionAnterior = versiones[0];
    const versionNueva = await repo.crearVersion(dbTx, {
      semanaId: datosValidados.semanaId,
      numeroVersion: numeroVersionNueva,
      creadoPorId: usuarioId,
      observaciones: datosValidados.observaciones,
      motivoCambio: datosValidados.motivoCambio,
      origenVersionId: versionAnterior?.id,
    });

    // Si existe versión anterior, clonar sus días y opciones
    if (versionAnterior) {
      const diasAnteriores = await repo.obtenerDiasPorVersion(
        dbTx,
        versionAnterior.id,
      );

      for (const diaAnterior of diasAnteriores) {
        const diaNuevo = await repo.crearDia(dbTx, {
          versionId: versionNueva.id,
          numeroDiaIso: diaAnterior.numero_dia_iso,
          nombreDia: diaAnterior.nombre_dia,
          fecha: diaAnterior.fecha,
          estado: diaAnterior.estado_dia,
          orden: diaAnterior.orden,
        });

        // Clonar opciones de los días
        const opcionesAnteriores = await repo.obtenerOpcionesPorDia(
          dbTx,
          diaAnterior.id,
        );
        for (const opcion of opcionesAnteriores) {
          await repo.asignarPlato(dbTx, {
            diaId: diaNuevo.id,
            opcionMenuMarcaId: opcion.opcion_menu_marca_id,
            platoId: opcion.plato_id,
            codigoOpcion: opcion.codigo_opcion,
            nombreOpcion: opcion.nombre_opcion,
            orden: opcion.orden,
            bloqueadoManual: opcion.bloqueado_manual,
            observaciones: opcion.observaciones,
          });
        }
      }
    } else {
      // Si no hay versión anterior, crear 7 días vacíos
      const diasGenerados = util.generarSieteDias(semana.fecha_inicio);
      for (const dia of diasGenerados) {
        await repo.crearDia(dbTx, {
          versionId: versionNueva.id,
          ...dia,
        });
      }
    }

    // Marcar nueva versión como actual
    await repo.marcarVersionActual(
      dbTx,
      datosValidados.semanaId,
      versionNueva.id,
    );

    // Registrar auditoría
    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "versiones_semana_menu",
      entidadId: versionNueva.id,
      accion: "CREAR",
      valoresNuevos: { numeroVersion: numeroVersionNueva },
      motivo: "Nueva versión creada",
    });

    return versionNueva;
  });
}

/**
 * TRANSICIONAR ESTADO DE VERSIÓN
 * Spec Etapa 3 - Sección 9: Máquina de estados
 */
export async function transicionarEstado(db, datos, usuarioId) {
  const datosValidados = actualizarEstadoVersionSchema.parse(datos);

  const version = await repo.obtenerVersion(db, datosValidados.versionId);
  if (!version) {
    throw new ApiError(
      "VERSION_NO_ENCONTRADA",
      "La versión especificada no existe",
      404,
    );
  }

  // Validar transición
  if (!validarTransicion(version.estado, datosValidados.estadoNuevo)) {
    const transicionesPermitidas = obtenerTransicionesPermitidas(
      version.estado,
    );
    throw new ApiError(
      "TRANSICION_ESTADO_INVALIDA",
      `Transición de ${version.estado} a ${datosValidados.estadoNuevo} no permitida. Válidas: ${transicionesPermitidas.join(", ")}`,
      400,
    );
  }

  if (
    [ESTADOS_VERSION.APROBADO, ESTADOS_VERSION.PUBLICADO].includes(
      datosValidados.estadoNuevo,
    )
  ) {
    const diasLaboralesSinOpciones = await repo.obtenerDiasLaboralesSinOpciones(
      db,
      version.id,
    );

    if (diasLaboralesSinOpciones.length > 0) {
      const dias = diasLaboralesSinOpciones
        .map((dia) => `${dia.nombre_dia} (${util.formatoFecha(dia.fecha)})`)
        .join(", ");
      throw new ApiError(
        "DIA_LABORAL_SIN_OPCIONES",
        `No se puede ${datosValidados.estadoNuevo.toLowerCase()} la versión porque hay días laborales sin opciones: ${dias}`,
        409,
      );
    }
  }

  return db.ejecutarEnTransaccion(async (dbTx) => {
    // Actualizar estado
    const versionActualizada = await repo.actualizarEstadoVersion(
      dbTx,
      datosValidados.versionId,
      datosValidados.estadoNuevo,
      usuarioId,
      datosValidados.estadoNuevo === ESTADOS_VERSION.APROBADO,
      datosValidados.estadoNuevo === ESTADOS_VERSION.PUBLICADO,
    );

    // Si es PUBLICADO, actualizar referencias en semana
    if (datosValidados.estadoNuevo === ESTADOS_VERSION.PUBLICADO) {
      await repo.marcarVersionPublicada(
        dbTx,
        version.semana_menu_id,
        datosValidados.versionId,
      );
      await repo.actualizarVersionPublicada(
        dbTx,
        version.semana_menu_id,
        datosValidados.versionId,
      );
    }

    // Registrar auditoría
    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "versiones_semana_menu",
      entidadId: datosValidados.versionId,
      accion: "TRANSICION_ESTADO",
      valoresAnteriores: { estado: version.estado },
      valoresNuevos: { estado: datosValidados.estadoNuevo },
      motivo: datosValidados.motivo || null,
    });

    return versionActualizada;
  });
}

export async function actualizarDiaPorFecha(
  db,
  { versionId, fecha, estado, textoEstado, observaciones },
  usuarioId,
) {
  const version = await repo.obtenerVersion(db, versionId);
  if (!version) {
    throw new ApiError(
      "VERSION_NO_ENCONTRADA",
      "La versión especificada no existe",
      404,
    );
  }

  if (
    [ESTADOS_VERSION.PUBLICADO, ESTADOS_VERSION.FINALIZADO].includes(
      version.estado,
    )
  ) {
    throw new ApiError(
      "VERSION_NO_EDITABLE",
      "La versión está publicada o finalizada y no puede editarse",
      409,
    );
  }

  const dia = await db.query(
    `SELECT * FROM dias_version_menu WHERE version_semana_id = $1 AND fecha = $2 LIMIT 1`,
    [versionId, fecha],
  );

  if (dia.rows.length === 0) {
    throw new ApiError(
      "DIA_NO_ENCONTRADO",
      "El día no existe en la versión",
      404,
    );
  }

  return db.ejecutarEnTransaccion(async (dbTx) => {
    const actualizado = await repo.actualizarDia(dbTx, dia.rows[0].id, {
      estado,
      textoEstado,
      observaciones,
    });

    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "dias_version_menu",
      entidadId: actualizado.id,
      accion: "ACTUALIZAR",
      valoresAnteriores: { estado: dia.rows[0].estado_dia },
      valoresNuevos: {
        estado: estado || dia.rows[0].estado_dia,
        textoEstado,
        observaciones,
      },
      motivo: "Edición de día",
    });

    return actualizado;
  });
}

export async function actualizarOpcionesPorFecha(
  db,
  { versionId, fecha, opciones },
  usuarioId,
) {
  const version = await repo.obtenerVersion(db, versionId);
  if (!version) {
    throw new ApiError(
      "VERSION_NO_ENCONTRADA",
      "La versión especificada no existe",
      404,
    );
  }

  if (
    [ESTADOS_VERSION.PUBLICADO, ESTADOS_VERSION.FINALIZADO].includes(
      version.estado,
    )
  ) {
    throw new ApiError(
      "VERSION_NO_EDITABLE",
      "La versión está publicada o finalizada y no puede editarse",
      409,
    );
  }

  const dia = await db.query(
    `SELECT * FROM dias_version_menu WHERE version_semana_id = $1 AND fecha = $2 LIMIT 1`,
    [versionId, fecha],
  );

  if (dia.rows.length === 0) {
    throw new ApiError(
      "DIA_NO_ENCONTRADO",
      "El día no existe en la versión",
      404,
    );
  }

  const semana = await db.query(
    `SELECT marca_id FROM semanas_menu WHERE id = $1 LIMIT 1`,
    [version.semana_menu_id],
  );
  const marcaId = semana.rows[0]?.marca_id || null;

  return db.ejecutarEnTransaccion(async (dbTx) => {
    await dbTx.query(
      "DELETE FROM opciones_dia_menu WHERE dia_version_menu_id = $1",
      [dia.rows[0].id],
    );

    const opcionesVistas = new Set();
    const creadas = [];

    for (const opcionEntrada of opciones || []) {
      const opcionMenu = await dbTx.query(
        "SELECT id, codigo, nombre FROM opciones_menu_marca WHERE id = $1",
        [opcionEntrada.opcionMenuMarcaId],
      );

      if (opcionMenu.rows.length === 0) {
        throw new ApiError(
          "OPCION_MENU_INVALIDA",
          `Opción menú no encontrada: ${opcionEntrada.opcionMenuMarcaId}`,
          400,
        );
      }

      const opcion = opcionMenu.rows[0];

      if (opcionesVistas.has(opcion.codigo)) {
        throw new ApiError(
          "OPCION_DUPLICADA_EN_DIA",
          `Opción repetida en día ${fecha}: ${opcion.codigo}`,
          409,
        );
      }

      const plato = await dbTx.query(
        "SELECT id FROM platos WHERE id = $1 AND ($2::uuid IS NULL OR marca_id = $2) AND eliminado_en IS NULL LIMIT 1",
        [opcionEntrada.platoId, marcaId],
      );

      if (plato.rows.length === 0) {
        throw new ApiError(
          "PLATO_NO_DISPONIBLE",
          `El plato no existe o no está disponible: ${opcionEntrada.platoId}`,
          404,
        );
      }

      const creada = await repo.asignarPlato(dbTx, {
        diaId: dia.rows[0].id,
        opcionMenuMarcaId: opcion.id,
        platoId: plato.rows[0].id,
        codigoOpcion: opcion.codigo,
        nombreOpcion: opcion.nombre,
        orden: opcionEntrada.orden || 0,
        bloqueadoManual: Boolean(opcionEntrada.bloqueadoManual),
        observaciones: opcionEntrada.observaciones || null,
      });
      creadas.push(creada);
      opcionesVistas.add(opcion.codigo);
    }

    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "opciones_dia_menu",
      entidadId: dia.rows[0].id,
      accion: "ACTUALIZAR",
      valoresNuevos: { totalOpciones: creadas.length },
      motivo: "Edición de opciones del día",
    });

    return { diaId: dia.rows[0].id, opciones: creadas };
  });
}

/**
 * ASIGNAR PLATO A OPCIÓN EN DÍA
 * Spec Etapa 3 - Sección 11: Asignación de platos
 */
export async function asignarPlatoAOpcion(db, datos, usuarioId) {
  const datosValidados = asignarPlatoSchema.parse(datos);

  // Verificar que el día existe
  const dia = await db.query("SELECT * FROM dias_version_menu WHERE id = $1", [
    datosValidados.diaId,
  ]);
  if (dia.rows.length === 0) {
    throw new ApiError(
      "DIA_NO_ENCONTRADO",
      "El día especificado no existe",
      404,
    );
  }

  const diaData = dia.rows[0];

  // Verificar que la versión existe
  const version = await repo.obtenerVersion(db, diaData.version_semana_id);
  if (!version) {
    throw new ApiError(
      "VERSION_NO_ENCONTRADA",
      "La versión especificada no existe",
      404,
    );
  }

  if (
    [ESTADOS_VERSION.PUBLICADO, ESTADOS_VERSION.FINALIZADO].includes(
      version.estado,
    )
  ) {
    throw new ApiError(
      "VERSION_NO_EDITABLE",
      "La versión está publicada o finalizada y no puede editarse",
      409,
    );
  }

  // Verificar que el plato no está ya en la semana
  // Spec Etapa 3 - Sección 11: Validar que no se repita el mismo plato en la semana
  const platoEnSemana = await repo.verificarPlatoEnSemana(
    db,
    diaData.version_semana_id,
    datosValidados.platoId,
  );
  if (platoEnSemana) {
    throw new ApiError(
      "PLATO_REPETIDO_EN_SEMANA",
      "Este plato ya está asignado en otra opción/día de esta semana",
      409,
    );
  }

  // Obtener información de la opción menú
  const opcionMenu = await db.query(
    "SELECT codigo, nombre FROM opciones_menu_marca WHERE id = $1",
    [datosValidados.opcionMenuMarcaId],
  );
  if (opcionMenu.rows.length === 0) {
    throw new ApiError(
      "OPCION_MENU_NO_ENCONTRADA",
      "La opción de menú especificada no existe",
      404,
    );
  }

  const opcionData = opcionMenu.rows[0];

  return db.ejecutarEnTransaccion(async (dbTx) => {
    const opcion = await repo.asignarPlato(dbTx, {
      ...datosValidados,
      codigoOpcion: opcionData.codigo,
      nombreOpcion: opcionData.nombre,
    });

    // Registrar auditoría
    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "opciones_dia_menu",
      entidadId: opcion.id,
      accion: "CREAR",
      valoresNuevos: {
        diaId: datosValidados.diaId,
        platoId: datosValidados.platoId,
        opcion: opcionData.codigo,
      },
      motivo: "Asignación de plato a opción",
    });

    return opcion;
  });
}

/**
 * OBTENER HISTORIAL DE USO DE PLATO
 * Spec Etapa 3 - Sección 17: Historial sin duplicar
 */
export async function obtenerHistorialUsoPlato(db, platoId, marcaId) {
  const historial = await repo.obtenerHistorialUsoPlato(db, platoId, marcaId);

  // Agrupar por semana para evitar duplicados
  const semanasUnicas = {};
  historial.forEach((uso) => {
    if (!semanasUnicas[uso.semana_id]) {
      semanasUnicas[uso.semana_id] = {
        semanaId: uso.semana_id,
        fechaInicio: uso.fecha_inicio,
        fechaFin: uso.fecha_fin,
        estado: uso.estado,
        diasEnQueSirve: [],
      };
    }
    semanasUnicas[uso.semana_id].diasEnQueSirve.push({
      diaId: uso.dia_id,
      nombreDia: uso.nombre_dia,
      fecha: uso.fecha,
    });
  });

  return Object.values(semanasUnicas);
}

/**
 * OBTENER HISTORIAL DE VERSIONES
 * Spec Etapa 3 - Sección 18: Historial completo de versiones
 */
export async function obtenerHistorialVersiones(db, semanaId) {
  const versiones = await repo.obtenerVersionesPorSemana(db, semanaId);

  return Promise.all(
    versiones.map(async (version) => {
      const dias = await repo.obtenerDiasPorVersion(db, version.id);
      return {
        ...version,
        diasConOpciones: await Promise.all(
          dias.map(async (dia) => ({
            ...dia,
            opciones: await repo.obtenerOpcionesPorDia(db, dia.id),
          })),
        ),
      };
    }),
  );
}

/**
 * DUPLICAR SEMANA
 * Spec Etapa 3 - Sección 12: Duplicación
 */
export async function duplicarSemana(db, datosClonacion, usuarioId) {
  const { semanaOrigenId, fechaInicio } = datosClonacion;

  const semanaOrigen = await repo.obtenerSemana(db, semanaOrigenId);
  if (!semanaOrigen) {
    throw new ApiError(
      "SEMANA_ORIGEN_NO_ENCONTRADA",
      "La semana a duplicar no existe",
      404,
    );
  }

  return db.ejecutarEnTransaccion(async (dbTx) => {
    // Crear nueva semana con mismos parámetros de contexto
    const semanaNueva = await repo.crearSemana(dbTx, {
      marcaId: semanaOrigen.marca_id,
      canalId: semanaOrigen.canal_id,
      empresaId: semanaOrigen.empresa_id,
      fechaInicio,
      fechaFin: util.formatoFecha(util.obtenerDomingoDelaSemana(fechaInicio)),
      creadoPorId: usuarioId,
    });

    // Obtener versión publicada de la semana origen
    const versionOrigenPublicada = await repo.obtenerVersionPublicada(
      dbTx,
      semanaOrigenId,
    );
    const versionAuseClone =
      versionOrigenPublicada ||
      (await repo.obtenerVersionActual(dbTx, semanaOrigenId));

    if (!versionAuseClone) {
      throw new ApiError(
        "SIN_VERSION_PARA_CLONAR",
        "No hay versión disponible para clonar",
        400,
      );
    }

    // Crear versión en la semana nueva (BORRADOR)
    const versionNueva = await repo.crearVersion(dbTx, {
      semanaId: semanaNueva.id,
      numeroVersion: 1,
      creadoPorId: usuarioId,
      observaciones: `Clonada de semana ${semanaNueva.fecha_inicio}`,
      motivoCambio: "Duplicación de semana",
      origenVersionId: versionAuseClone.id,
    });

    // Marcar como actual
    await repo.marcarVersionActual(dbTx, semanaNueva.id, versionNueva.id);

    // Clonar días y opciones
    const diasOrigen = await repo.obtenerDiasPorVersion(
      dbTx,
      versionAuseClone.id,
    );

    for (const diaOrigen of diasOrigen) {
      const diaNuevo = await repo.crearDia(dbTx, {
        versionId: versionNueva.id,
        numeroDiaIso: diaOrigen.numero_dia_iso,
        nombreDia: diaOrigen.nombre_dia,
        fecha: util.formatoFecha(
          new Date(
            new Date(diaOrigen.fecha).getTime() +
              (new Date(semanaNueva.fecha_inicio) -
                new Date(semanaOrigen.fecha_inicio)),
          ),
        ),
        estado: diaOrigen.estado_dia,
        orden: diaOrigen.orden,
      });

      const opcionesOrigen = await repo.obtenerOpcionesPorDia(
        dbTx,
        diaOrigen.id,
      );
      for (const opcion of opcionesOrigen) {
        await repo.asignarPlato(dbTx, {
          diaId: diaNuevo.id,
          opcionMenuMarcaId: opcion.opcion_menu_marca_id,
          platoId: opcion.plato_id,
          codigoOpcion: opcion.codigo_opcion,
          nombreOpcion: opcion.nombre_opcion,
          orden: opcion.orden,
          bloqueadoManual: opcion.bloqueado_manual,
          observaciones: opcion.observaciones,
        });
      }
    }

    // Registrar auditoría
    await repo.registrarAuditoria(dbTx, {
      usuarioId,
      entidad: "semanas_menu",
      entidadId: semanaNueva.id,
      accion: "DUPLICAR",
      valoresNuevos: {
        semanaOrigenId,
        fechaInicio,
      },
      motivo: "Duplicación de semana existente",
    });

    return semanaNueva;
  });
}

export async function obtenerSemana(db, semanaId) {
  const semana = await repo.obtenerSemana(db, semanaId);
  if (!semana) {
    throw new ApiError(
      "SEMANA_NO_ENCONTRADA",
      "La semana especificada no existe",
      404,
    );
  }
  return semana;
}

export async function obtenerVersionConContexto(db, versionId) {
  const version = await repo.obtenerVersion(db, versionId);
  if (!version) {
    throw new ApiError(
      "VERSION_NO_ENCONTRADA",
      "La versión especificada no existe",
      404,
    );
  }
  return version;
}

/**
 * Calcular hash SHA-256 para archivo
 */
export function calcularHashArchivo(contenido) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(contenido))
    .digest("hex");
}
