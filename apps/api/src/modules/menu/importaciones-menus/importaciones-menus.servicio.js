/**
 * Servicio de importaciones JSON
 * Spec Etapa 3 - Sección 27: Importación con dry-run y estrategias
 */

import crypto from "node:crypto";
import * as repo from "../menus-semanales/menus-semanales.repositorio.js";
import * as util from "../menus-semanales/menus-semanales.utilidades.js";
import { ESTADOS_DIA } from "../menus-semanales/menus-semanales.constantes.js";
import { ApiError } from "../../../utils/api-error.js";

function normalizarBusqueda(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Calcular hash SHA-256 de contenido
 */
function calcularHashContenido(contenido) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(contenido))
    .digest("hex");
}

/**
 * Validar estructura de datos importados
 */
function validarEstructuraImportacion(datos) {
  const errores = [];

  if (!datos.semanas || !Array.isArray(datos.semanas)) {
    errores.push('Debe contener un array "semanas"');
    return errores;
  }

  datos.semanas.forEach((semana, idx) => {
    if (!semana.marca_id) errores.push(`Semana ${idx}: falta marca_id`);
    if (!semana.fecha_inicio) errores.push(`Semana ${idx}: falta fecha_inicio`);
    if (!semana.fecha_fin) errores.push(`Semana ${idx}: falta fecha_fin`);

    if (!util.esSemanValida(semana.fecha_inicio, semana.fecha_fin)) {
      errores.push(`Semana ${idx}: fechas no forman una semana válida`);
    }

    if (!semana.dias || !Array.isArray(semana.dias)) {
      errores.push(`Semana ${idx}: falta array "dias"`);
    } else {
      if (semana.dias.length !== 7) {
        errores.push(`Semana ${idx}: debe haber exactamente 7 días`);
      }

      semana.dias.forEach((dia, diaIdx) => {
        if (!dia.numero_dia_iso)
          errores.push(`Semana ${idx}, Día ${diaIdx}: falta numero_dia_iso`);
        if (!dia.nombre_dia)
          errores.push(`Semana ${idx}, Día ${diaIdx}: falta nombre_dia`);
        if (!dia.opciones || !Array.isArray(dia.opciones)) {
          errores.push(`Semana ${idx}, Día ${diaIdx}: falta array "opciones"`);
        }
      });
    }
  });

  return errores;
}

/**
 * Detectar conflictos en importación
 * Spec Etapa 3 - Sección 27: Detección de conflictos
 */
async function detectarConflictos(db, datosImportacion, usuarioId) {
  const conflictos = [];
  const advertencias = [];

  for (const semana of datosImportacion.semanas) {
    // Verificar que marca existe
    const marca = await db.query("SELECT id FROM marcas WHERE id = $1", [
      semana.marca_id,
    ]);
    if (marca.rows.length === 0) {
      conflictos.push(`Marca ${semana.marca_id} no existe`);
      continue;
    }

    // Verificar si semana ya existe
    const existente = await db.query(
      `SELECT id FROM semanas_menu
       WHERE marca_id = $1
       AND COALESCE(canal_id, '00000000-0000-0000-0000-000000000001'::uuid) = COALESCE($2, '00000000-0000-0000-0000-000000000001'::uuid)
       AND COALESCE(empresa_id, '00000000-0000-0000-0000-000000000002'::uuid) = COALESCE($3, '00000000-0000-0000-0000-000000000002'::uuid)
       AND fecha_inicio = $4
       AND eliminado_en IS NULL`,
      [
        semana.marca_id,
        semana.canal_id,
        semana.empresa_id,
        semana.fecha_inicio,
      ],
    );

    if (existente.rows.length > 0) {
      conflictos.push({
        tipo: "SEMANA_EXISTENTE",
        semanaId: existente.rows[0].id,
        marcaId: semana.marca_id,
        fechaInicio: semana.fecha_inicio,
      });
    }
  }

  return { conflictos, advertencias };
}

async function validarUsuarioImportacion(db, usuarioId) {
  if (!usuarioId) {
    throw new ApiError(
      "USUARIO_IMPORTACION_REQUERIDO",
      "La importación requiere un usuario explícito",
      400,
    );
  }

  const usuario = await db.query(
    "SELECT id, estado FROM usuarios WHERE id = $1 LIMIT 1",
    [usuarioId],
  );

  if (usuario.rows.length === 0) {
    throw new ApiError(
      "USUARIO_IMPORTACION_INVALIDO",
      "El usuario de importación no existe",
      404,
    );
  }

  if (usuario.rows[0].estado !== "ACTIVO") {
    throw new ApiError(
      "USUARIO_IMPORTACION_INVALIDO",
      "El usuario de importación está inactivo",
      403,
    );
  }
}

async function resolverPlato(db, marcaId, opcionData, usuarioId) {
  if (opcionData.plato_id) {
    const porId = await db.query(
      "SELECT id, nombre FROM platos WHERE id = $1 AND marca_id = $2 AND eliminado_en IS NULL LIMIT 1",
      [opcionData.plato_id, marcaId],
    );
    if (porId.rows[0]) {
      return { platoId: porId.rows[0].id, origen: "ID" };
    }
  }

  if (opcionData.plato_nombre) {
    const nombreNorm = normalizarBusqueda(opcionData.plato_nombre);
    const porNombre = await db.query(
      `SELECT id, nombre
       FROM platos
       WHERE marca_id = $1
         AND eliminado_en IS NULL
         AND nombre_normalizado = $2
       ORDER BY estado = 'ACTIVO' DESC, creado_en ASC
       LIMIT 1`,
      [marcaId, nombreNorm],
    );

    if (porNombre.rows[0]) {
      return { platoId: porNombre.rows[0].id, origen: "NOMBRE" };
    }
  }

  if (opcionData.plato_alias) {
    const aliasNorm = normalizarBusqueda(opcionData.plato_alias);
    const porAlias = await db.query(
      `SELECT p.id, p.nombre
       FROM alias_platos a
       INNER JOIN platos p ON p.id = a.plato_id
       WHERE p.marca_id = $1
         AND p.eliminado_en IS NULL
         AND a.alias_normalizado = $2
       ORDER BY p.estado = 'ACTIVO' DESC, p.creado_en ASC
       LIMIT 1`,
      [marcaId, aliasNorm],
    );

    if (porAlias.rows[0]) {
      return { platoId: porAlias.rows[0].id, origen: "ALIAS" };
    }
  }

  const nombreIncompleto =
    opcionData.plato_nombre ||
    opcionData.plato_alias ||
    "Plato incompleto importado";
  const nombreNorm = normalizarBusqueda(nombreIncompleto);

  const existenteIncompleto = await db.query(
    `SELECT id
     FROM platos
     WHERE marca_id = $1
       AND nombre_normalizado = $2
       AND estado = 'INACTIVO'
       AND eliminado_en IS NULL
     LIMIT 1`,
    [marcaId, nombreNorm],
  );

  if (existenteIncompleto.rows[0]) {
    return {
      platoId: existenteIncompleto.rows[0].id,
      origen: "INCOMPLETO_EXISTENTE",
    };
  }

  const creado = await db.query(
    `INSERT INTO platos (
       id, marca_id, tipo, codigo, nombre, nombre_normalizado, estado,
       observaciones, creado_por, actualizado_por, creado_en, actualizado_en
     ) VALUES (
       $1, $2, 'PLATO_COMPLETO', NULL, $3, $4, 'INACTIVO',
       $5, $6, $6, NOW(), NOW()
     )
     RETURNING id`,
    [
      crypto.randomUUID(),
      marcaId,
      nombreIncompleto,
      nombreNorm,
      "Plato creado por importación. Pendiente de revisión.",
      usuarioId,
    ],
  );

  return { platoId: creado.rows[0].id, origen: "INCOMPLETO_CREADO" };
}

/**
 * Importar JSON (Dry-run o real)
 * Spec Etapa 3 - Sección 27: Importación con transacciones
 */
export async function importarJSON(
  db,
  datosImportacion,
  usuarioId,
  modoSimulacion = false,
  estrategiaConflicto = "ERROR",
) {
  await validarUsuarioImportacion(db, usuarioId);

  // Validar estructura
  const erroresValidacion = validarEstructuraImportacion(
    datosImportacion.datos,
  );
  if (erroresValidacion.length > 0) {
    throw new ApiError(
      "IMPORTACION_INVALIDA",
      `Errores en datos: ${erroresValidacion.join("; ")}`,
      400,
    );
  }

  // Calcular hash del archivo
  const hashArchivo = calcularHashContenido(datosImportacion.datos);

  // Detectar si ya existe una importación real activa o exitosa.
  // Las simulaciones y fallidas no bloquean un nuevo intento.
  if (!modoSimulacion) {
    const yaImportado = await repo.verificarHashImportado(db, hashArchivo);
    if (yaImportado) {
      throw new ApiError(
        "IMPORTACION_DUPLICADA",
        `Este archivo ya fue importado con ID: ${yaImportado.id}`,
        409,
      );
    }
  }

  // Detectar conflictos
  const { conflictos, advertencias } = await detectarConflictos(
    db,
    datosImportacion.datos,
    usuarioId,
  );

  if (conflictos.length > 0 && estrategiaConflicto === "ERROR") {
    throw new ApiError(
      "CONFLICTO_IMPORTACION",
      `Se detectaron conflictos: ${JSON.stringify(conflictos)}`,
      409,
    );
  }

  // Crear registro de importación
  let importacion;
  try {
    importacion = await repo.crearImportacion(db, {
      nombreArchivo: datosImportacion.nombreArchivo || "sin-nombre.json",
      hashArchivo,
      modoSimulacion,
      estrategiaConflicto,
      ejecutadoPorId: usuarioId,
    });
  } catch (error) {
    if (
      error?.code === "23505" &&
      (String(error?.constraint || "").includes(
        "importaciones_menu_hash_unico",
      ) ||
        String(error?.constraint || "").includes(
          "idx_importaciones_menu_hash_real_activa_unica",
        ))
    ) {
      const duplicada = await repo.verificarHashImportado(db, hashArchivo);
      throw new ApiError(
        "IMPORTACION_DUPLICADA",
        `Este archivo ya fue importado con ID: ${duplicada?.id || "desconocido"}`,
        409,
      );
    }
    throw error;
  }

  // Si es simulación, terminar aquí
  if (modoSimulacion) {
    await repo.actualizarEstadoImportacion(
      db,
      importacion.id,
      "SIMULADA",
      {
        semanasAImportar: datosImportacion.datos.semanas.length,
      },
      advertencias,
      conflictos,
    );

    return {
      importacionId: importacion.id,
      estado: "SIMULADA",
      resumen: {
        semanasAImportar: datosImportacion.datos.semanas.length,
        conflictos: conflictos.length,
        advertencias: advertencias.length,
      },
      conflictos,
      advertencias,
    };
  }

  // Importar realmente
  try {
    return await db.ejecutarEnTransaccion(async (dbTx) => {
      let semanasCreadas = 0;
      let versionesCreadas = 0;

      for (const semanaData of datosImportacion.datos.semanas) {
        const existente = await dbTx.query(
          `SELECT id FROM semanas_menu
           WHERE marca_id = $1
             AND COALESCE(canal_id, '00000000-0000-0000-0000-000000000001'::uuid) = COALESCE($2, '00000000-0000-0000-0000-000000000001'::uuid)
             AND COALESCE(empresa_id, '00000000-0000-0000-0000-000000000002'::uuid) = COALESCE($3, '00000000-0000-0000-0000-000000000002'::uuid)
             AND fecha_inicio = $4
             AND eliminado_en IS NULL
           LIMIT 1`,
          [
            semanaData.marca_id,
            semanaData.canal_id || null,
            semanaData.empresa_id || null,
            semanaData.fecha_inicio,
          ],
        );

        let semana;
        if (existente.rows[0]) {
          if (estrategiaConflicto === "OMITIR") {
            advertencias.push(
              `Semana omitida por conflicto: ${semanaData.fecha_inicio} (${semanaData.marca_id})`,
            );
            continue;
          }

          if (estrategiaConflicto === "CREAR_VERSION") {
            semana = await repo.obtenerSemana(dbTx, existente.rows[0].id);
          } else {
            throw new ApiError(
              "CONFLICTO_IMPORTACION",
              `La semana ${semanaData.fecha_inicio} ya existe para el contexto indicado`,
              409,
            );
          }
        } else {
          semana = await repo.crearSemana(dbTx, {
            marcaId: semanaData.marca_id,
            canalId: semanaData.canal_id || null,
            empresaId: semanaData.empresa_id || null,
            fechaInicio: semanaData.fecha_inicio,
            fechaFin: semanaData.fecha_fin,
            creadoPorId: usuarioId,
          });
          semanasCreadas++;
        }

        // Crear versión
        const versionesSemana = await repo.obtenerVersionesPorSemana(
          dbTx,
          semana.id,
        );
        const numeroVersion = (versionesSemana[0]?.numero_version || 0) + 1;
        const version = await repo.crearVersion(dbTx, {
          semanaId: semana.id,
          numeroVersion,
          creadoPorId: usuarioId,
          observaciones: "Importada desde JSON",
          motivoCambio: `Importación: ${datosImportacion.nombreArchivo}`,
        });
        versionesCreadas++;

        // Marcar como actual
        await repo.marcarVersionActual(dbTx, semana.id, version.id);

        // Crear días y opciones
        for (const diaData of semanaData.dias) {
          const dia = await repo.crearDia(dbTx, {
            versionId: version.id,
            numeroDiaIso: diaData.numero_dia_iso,
            nombreDia: diaData.nombre_dia,
            fecha: diaData.fecha,
            estado: diaData.estado || ESTADOS_DIA.SIN_CONFIGURAR,
            orden: diaData.numero_dia_iso,
          });

          const opcionesAsignadasEnDia = new Set();

          // Asignar platos a opciones
          for (const opcionData of diaData.opciones) {
            if (opcionesAsignadasEnDia.has(opcionData.opcion_menu_marca_id)) {
              throw new ApiError(
                "OPCION_DUPLICADA_EN_DIA",
                `Opción repetida en día ${diaData.nombre_dia}: ${opcionData.opcion_menu_marca_id}`,
                409,
              );
            }

            const opcionMenu = await dbTx.query(
              "SELECT id, codigo, nombre FROM opciones_menu_marca WHERE id = $1",
              [opcionData.opcion_menu_marca_id],
            );

            if (opcionMenu.rows.length === 0) {
              throw new ApiError(
                "OPCION_MENU_INVALIDA",
                `Opción menú no encontrada: ${opcionData.opcion_menu_marca_id}`,
                400,
              );
            }

            const opcion = opcionMenu.rows[0];

            const platoResuelto = await resolverPlato(
              dbTx,
              semanaData.marca_id,
              opcionData,
              usuarioId,
            );

            try {
              await repo.asignarPlato(dbTx, {
                diaId: dia.id,
                opcionMenuMarcaId: opcion.id,
                platoId: platoResuelto.platoId,
                codigoOpcion: opcion.codigo,
                nombreOpcion: opcion.nombre,
                orden: opcionData.orden || 0,
                bloqueadoManual: false,
              });
            } catch (error) {
              if (
                error?.code === "23505" &&
                String(error?.constraint || "").includes(
                  "opciones_dia_menu_opcion_unica_por_dia",
                )
              ) {
                throw new ApiError(
                  "OPCION_DUPLICADA_EN_DIA",
                  `Opción repetida en día ${diaData.nombre_dia}: ${opcionData.opcion_menu_marca_id}`,
                  409,
                );
              }
              throw error;
            }

            opcionesAsignadasEnDia.add(opcionData.opcion_menu_marca_id);
          }
        }

        // Registrar auditoría
        await repo.registrarAuditoria(dbTx, {
          usuarioId,
          entidad: "semanas_menu",
          entidadId: semana.id,
          accion: "IMPORTAR_JSON",
          valoresNuevos: { fechaInicio: semana.fecha_inicio },
          motivo: `Importada desde ${datosImportacion.nombreArchivo}`,
        });
      }

      // Exitosa
      await repo.actualizarEstadoImportacion(
        dbTx,
        importacion.id,
        "COMPLETADA",
        {
          semanasCreadas,
          versionesCreadas,
          totalSemanasImportadas: datosImportacion.datos.semanas.length,
        },
        advertencias,
        [],
      );

      return {
        importacionId: importacion.id,
        estado: "COMPLETADA",
        resumen: {
          semanasCreadas,
          conflictos: conflictos.length,
          advertencias: advertencias.length,
        },
      };
    });
  } catch (error) {
    const detalles = error?.details || {};
    await repo.actualizarEstadoImportacion(
      db,
      importacion.id,
      "FALLIDA",
      {
        semanasCreadas: detalles.semanasCreadas || 0,
        versionesCreadas: detalles.versionesCreadas || 0,
        totalSemanasIntentadas:
          detalles.totalSemanasIntentadas ||
          datosImportacion.datos.semanas.length,
      },
      detalles.advertencias || advertencias,
      detalles.erroresImportacion || [String(error?.message || error)],
    );
    throw error;
  }
}

/**
 * Obtener estado de importación
 */
export async function obtenerEstadoImportacion(db, importacionId) {
  const importacion = await repo.obtenerImportacion(db, importacionId);

  if (!importacion) {
    throw new ApiError(
      "IMPORTACION_NO_ENCONTRADA",
      "La importación no existe",
      404,
    );
  }

  return {
    id: importacion.id,
    estado: importacion.estado,
    nombreArchivo: importacion.nombre_archivo,
    modoSimulacion: importacion.modo_simulacion,
    resumen:
      typeof importacion.resumen === "string"
        ? JSON.parse(importacion.resumen)
        : importacion.resumen,
    advertencias:
      typeof importacion.advertencias === "string"
        ? JSON.parse(importacion.advertencias)
        : importacion.advertencias,
    errores:
      typeof importacion.errores === "string"
        ? JSON.parse(importacion.errores)
        : importacion.errores,
    iniciado: importacion.iniciado_en,
    finalizado: importacion.finalizado_en,
  };
}
