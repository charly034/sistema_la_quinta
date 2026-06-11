/**
 * Servicio de plantillas y generación de mensajes WhatsApp
 * Spec Etapa 3 - Sección 22
 */

import * as repo from "../menus-semanales/menus-semanales.repositorio.js";
import * as util from "../menus-semanales/menus-semanales.utilidades.js";
import { ESTADOS_DIA } from "../menus-semanales/menus-semanales.constantes.js";
import { ApiError } from "../../../utils/api-error.js";

function formatearDdMm(fecha) {
  const date =
    fecha instanceof Date
      ? new Date(
          Date.UTC(
            fecha.getUTCFullYear(),
            fecha.getUTCMonth(),
            fecha.getUTCDate(),
          ),
        )
      : new Date(`${String(fecha).slice(0, 10)}T00:00:00Z`);
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

function esFinDeSemana(fecha) {
  const date =
    fecha instanceof Date
      ? new Date(
          Date.UTC(
            fecha.getUTCFullYear(),
            fecha.getUTCMonth(),
            fecha.getUTCDate(),
          ),
        )
      : new Date(`${String(fecha).slice(0, 10)}T00:00:00Z`);
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function construirLineaDia(diaRow, configuracion) {
  const mostrarFechaFeriado = configuracion.mostrar_fecha_en_feriados === true;
  const base = diaRow.nombre_dia || diaRow.nombreDia || "Día";

  if (diaRow.estado_dia === ESTADOS_DIA.FERIADO && !mostrarFechaFeriado) {
    return `📍 ${base}`;
  }

  return `📍 ${base} ${formatearDdMm(diaRow.fecha)}`;
}

/**
 * Obtener plantilla para contexto
 * Spec Etapa 3 - Sección 22: Selección por contexto
 */
export async function obtenerPlantillaParaContexto(
  db,
  marcaId,
  canalId,
  empresaId,
  tipo = "WHATSAPP",
) {
  const cantidadEmpatada = await repo.contarPlantillasPrioridadEmpatada(
    db,
    marcaId || null,
    canalId || null,
    empresaId || null,
    tipo,
  );

  if (cantidadEmpatada > 1) {
    throw new ApiError(
      "PLANTILLA_AMBIGUA",
      `Se encontraron múltiples plantillas ${tipo} activas para el mismo nivel de prioridad`,
      409,
    );
  }

  const plantilla = await repo.obtenerPlantillasActivas(
    db,
    marcaId || null,
    canalId || null,
    empresaId || null,
    tipo,
  );

  if (!plantilla) {
    throw new ApiError(
      "PLANTILLA_NO_ENCONTRADA",
      `No hay plantilla ${tipo} disponible para este contexto`,
      404,
    );
  }

  return plantilla;
}

/**
 * Generar mensaje WhatsApp desde plantilla
 * Spec Etapa 3 - Sección 22: Generación de mensaje WhatsApp
 *
 * Variables disponibles en plantilla:
 * - {{rango_semana}}: "13 de octubre - 19 de octubre"
 * - {{contenido_dias}}: Contenido completo de días
 * - {{fecha_generacion}}: Fecha en que se genera
 * - {{nombre_marca}}: Nombre de la marca
 */
export async function generarMensajeWhatsapp(
  db,
  versionId,
  plantillaId,
  marcaId,
  semanaData,
) {
  // Obtener plantilla
  let plantilla;
  if (plantillaId) {
    plantilla = await repo.obtenerPlantilla(db, plantillaId);
  } else {
    plantilla = await obtenerPlantillaParaContexto(
      db,
      marcaId,
      semanaData.canalId || semanaData.canal_id || null,
      semanaData.empresaId || semanaData.empresa_id || null,
      "WHATSAPP",
    );
  }

  if (!plantilla) {
    throw new ApiError(
      "PLANTILLA_NO_ENCONTRADA",
      "No se encontró plantilla para generar mensaje",
      404,
    );
  }

  // Parsear configuración
  const configuracion =
    typeof plantilla.configuracion === "string"
      ? JSON.parse(plantilla.configuracion)
      : plantilla.configuracion;

  // Obtener días y opciones
  const dias = await db.query(
    `SELECT * FROM dias_version_menu WHERE version_semana_id = $1 ORDER BY orden ASC`,
    [versionId],
  );

  // Generar contenido de días
  const bloquesDias = [];
  const fechasIncluidas = [];

  for (const diaRow of dias.rows) {
    const diaEsFinDeSemana = esFinDeSemana(diaRow.fecha);

    if (
      diaEsFinDeSemana &&
      !configuracion.incluir_fin_de_semana &&
      [ESTADOS_DIA.SIN_CONFIGURAR, ESTADOS_DIA.CERRADO].includes(
        diaRow.estado_dia,
      )
    ) {
      continue;
    }

    // Aplicar filtros según configuración
    if (
      diaRow.estado_dia === ESTADOS_DIA.FERIADO &&
      !configuracion.incluir_feriados
    ) {
      continue;
    }
    if (
      diaRow.estado_dia === ESTADOS_DIA.CERRADO &&
      !configuracion.incluir_cerrados
    ) {
      continue;
    }
    if (
      diaRow.estado_dia === ESTADOS_DIA.SIN_CONFIGURAR &&
      !configuracion.incluir_sin_configurar
    ) {
      continue;
    }

    // Obtener opciones del día
    const opciones = await db.query(
      `SELECT
        COALESCE(omm.codigo, CHR((64 + ROW_NUMBER() OVER (ORDER BY odm.orden ASC, odm.creado_en ASC))::int)) AS codigo_opcion,
         p.nombre AS nombre_plato
       FROM opciones_dia_menu odm
       LEFT JOIN opciones_menu_marca omm ON omm.id = odm.opcion_menu_marca_id
       LEFT JOIN platos p ON p.id = odm.plato_id
       WHERE odm.dia_version_menu_id = $1
       ORDER BY odm.orden ASC, odm.creado_en ASC`,
      [diaRow.id],
    );

    const encabezadoDia = construirLineaDia(diaRow, configuracion);

    if (diaRow.estado_dia === ESTADOS_DIA.FERIADO) {
      bloquesDias.push(
        `${encabezadoDia}\n${diaRow.observaciones || "FERIADO"}`,
      );
      fechasIncluidas.push(diaRow.fecha);
      continue;
    }

    if (diaRow.estado_dia === ESTADOS_DIA.CERRADO) {
      bloquesDias.push(
        `${encabezadoDia}\n${diaRow.observaciones || "CERRADO"}`,
      );
      fechasIncluidas.push(diaRow.fecha);
      continue;
    }

    if (diaRow.estado_dia === ESTADOS_DIA.SIN_CONFIGURAR) {
      bloquesDias.push(
        `${encabezadoDia}\n${diaRow.observaciones || "SIN CONFIGURAR"}`,
      );
      fechasIncluidas.push(diaRow.fecha);
      continue;
    }

    const lineasOpciones = opciones.rows.map(
      (opcion) =>
        `${opcion.codigo_opcion}: ${opcion.nombre_plato || "Plato sin nombre"}`,
    );

    if (lineasOpciones.length === 0) {
      continue;
    }

    bloquesDias.push(`${encabezadoDia}\n${lineasOpciones.join("\n")}`);
    fechasIncluidas.push(diaRow.fecha);
  }

  // Reemplazar variables en plantilla
  const fechaInicioRango =
    fechasIncluidas[0] || semanaData.fechaInicio || semanaData.fecha_inicio;
  const fechaFinRango =
    fechasIncluidas[fechasIncluidas.length - 1] ||
    semanaData.fechaFin ||
    semanaData.fecha_fin;
  const rango = `${formatearDdMm(fechaInicioRango)} AL ${formatearDdMm(fechaFinRango)}`;
  const contenidoDias = bloquesDias.join("\n\n");
  let mensaje = plantilla.plantilla
    .replace(/{{rango_semana}}/g, rango)
    .replace(/{{contenido_dias}}/g, contenidoDias)
    .replace(/{{fecha_generacion}}/g, new Date().toLocaleDateString("es-ES"))
    .replace(
      /{{nombre_marca}}/g,
      semanaData.nombreMarca || semanaData.nombre_marca || "La Quinta",
    );

  return {
    mensaje,
    plantilla: plantilla.nombre,
    tipoPlantilla: plantilla.tipo,
    caracteres: mensaje.length,
  };
}

/**
 * Crear plantilla personalizada
 */
export async function crearPlantilla(db, datos, usuarioId) {
  const plantilla = await repo.crearPlantilla(db, {
    ...datos,
    creadoPorId: usuarioId,
  });

  return plantilla;
}

/**
 * Listar plantillas disponibles para marca
 */
export async function listarPlantillasParaMarca(db, marcaId) {
  const plantillas = await db.query(
    `SELECT id, nombre, tipo, estado, es_predeterminada, creado_en
     FROM plantillas_mensaje_menu
     WHERE marca_id = $1 AND eliminado_en IS NULL
     ORDER BY es_predeterminada DESC, creado_en DESC`,
    [marcaId],
  );

  return plantillas.rows;
}

/**
 * Actualizar plantilla
 */
export async function actualizarPlantilla(db, plantillaId, actualizaciones) {
  const query = `UPDATE plantillas_mensaje_menu SET
    nombre = COALESCE($1, nombre),
    plantilla = COALESCE($2, plantilla),
    configuracion = COALESCE($3, configuracion),
    estado = COALESCE($4, estado)
    WHERE id = $5
    RETURNING *`;

  const resultado = await db.query(query, [
    actualizaciones.nombre || null,
    actualizaciones.plantilla || null,
    actualizaciones.configuracion
      ? JSON.stringify(actualizaciones.configuracion)
      : null,
    actualizaciones.estado || null,
    plantillaId,
  ]);

  if (resultado.rows.length === 0) {
    throw new ApiError(
      "PLANTILLA_NO_ENCONTRADA",
      "La plantilla no existe",
      404,
    );
  }

  return resultado.rows[0];
}
