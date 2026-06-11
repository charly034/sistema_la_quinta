/**
 * Esquemas de validación Zod para menús semanales
 * Spec Etapa 3 - Sección 34
 */

import { z } from "zod";
import {
  ESTADOS_VERSION,
  ESTADOS_DIA,
  TIPOS_PLANTILLA,
  ESTRATEGIAS_CONFLICTO,
} from "./menus-semanales.constantes.js";
import { esLunes, esDomingo, diasEntre } from "./menus-semanales.utilidades.js";

/**
 * Esquema para crear una semana menú
 * Spec Etapa 3 - Sección 8: Estructura de semana lógica
 */
export const crearSemanaSchema = z
  .object({
    marcaId: z.string().uuid("marcaId debe ser un UUID válido"),
    canalId: z
      .string()
      .uuid("canalId debe ser un UUID válido")
      .nullable()
      .optional(),
    empresaId: z
      .string()
      .uuid("empresaId debe ser un UUID válido")
      .nullable()
      .optional(),
    fechaInicio: z.string().date("fechaInicio debe ser una fecha válida"),
    fechaFin: z.string().date("fechaFin debe ser una fecha válida"),
  })
  .strict()
  .refine((data) => esLunes(data.fechaInicio), {
    message: "fechaInicio debe ser un lunes",
    path: ["fechaInicio"],
  })
  .refine((data) => esDomingo(data.fechaFin), {
    message: "fechaFin debe ser un domingo",
    path: ["fechaFin"],
  })
  .refine((data) => diasEntre(data.fechaInicio, data.fechaFin) === 6, {
    message: "fechaFin debe ser exactamente 6 días después de fechaInicio",
    path: ["fechaFin"],
  });

/**
 * Esquema para crear una versión de menú
 * Spec Etapa 3 - Sección 8: Versiones del menú
 */
export const crearVersionSchema = z
  .object({
    semanaId: z.string().uuid("semanaId debe ser un UUID válido"),
    observaciones: z.string().optional().nullable(),
    motivoCambio: z.string().optional().nullable(),
  })
  .strict();

/**
 * Esquema para actualizar estado de versión
 * Spec Etapa 3 - Sección 9: Transiciones de estado
 */
export const actualizarEstadoVersionSchema = z
  .object({
    versionId: z.string().uuid("versionId debe ser un UUID válido"),
    estadoNuevo: z.enum(Object.values(ESTADOS_VERSION)),
    motivo: z.string().optional(),
  })
  .strict();

/**
 * Esquema para crear día en versión
 * Spec Etapa 3 - Sección 10: Creación automática de días
 */
export const crearDiaSchema = z
  .object({
    versionId: z.string().uuid("versionId debe ser un UUID válido"),
    numeroDiaIso: z
      .number()
      .int()
      .min(1)
      .max(7)
      .describe("Día de la semana ISO (1=lunes, 7=domingo)"),
    nombreDia: z.string().min(1, "nombreDia requerido"),
    fecha: z.string().date("fecha debe ser una fecha válida"),
    estado: z
      .enum(Object.values(ESTADOS_DIA))
      .default(ESTADOS_DIA.SIN_CONFIGURAR),
    orden: z
      .number()
      .int()
      .min(1)
      .max(7)
      .describe("Posición del día en la semana"),
  })
  .strict();

/**
 * Esquema para actualizar día
 */
export const actualizarDiaSchema = z
  .object({
    diaId: z.string().uuid("diaId debe ser un UUID válido"),
    estado: z.enum(Object.values(ESTADOS_DIA)).optional(),
    textoEstado: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
  })
  .strict();

/**
 * Esquema para asignar plato a opción en día
 * Spec Etapa 3 - Sección 11: Asignación de platos
 */
export const asignarPlatoSchema = z
  .object({
    diaId: z.string().uuid("diaId debe ser un UUID válido"),
    opcionMenuMarcaId: z
      .string()
      .uuid("opcionMenuMarcaId debe ser un UUID válido"),
    platoId: z.string().uuid("platoId debe ser un UUID válido"),
    orden: z.number().int().min(0).optional().default(0),
    bloqueadoManual: z.boolean().optional().default(false),
    observaciones: z.string().optional().nullable(),
  })
  .strict();

/**
 * Esquema para crear plantilla de mensaje
 * Spec Etapa 3 - Sección 22: Plantillas WhatsApp
 */
export const crearPlantillaSchema = z
  .object({
    nombre: z.string().min(1, "nombre requerido").max(255),
    tipo: z.enum(Object.values(TIPOS_PLANTILLA)),
    plantilla: z.string().min(1, "plantilla requerida"),
    marcaId: z.string().uuid().nullable().optional(),
    canalId: z.string().uuid().nullable().optional(),
    empresaId: z.string().uuid().nullable().optional(),
    configuracion: z.record(z.any()).optional().default({}),
    estado: z.enum(["ACTIVA", "INACTIVA", "ARCHIVADA"]).default("ACTIVA"),
    esPredeterminada: z.boolean().optional().default(false),
  })
  .strict();

/**
 * Esquema para iniciar importación JSON
 * Spec Etapa 3 - Sección 27: Importación JSON
 */
export const importarJSONSchema = z
  .object({
    datos: z.object({
      semanas: z.array(z.record(z.any())),
    }),
    modoSimulacion: z.boolean().optional().default(false),
    estrategiaConflicto: z
      .enum(Object.values(ESTRATEGIAS_CONFLICTO))
      .optional()
      .default(ESTRATEGIAS_CONFLICTO.ERROR),
    nombreArchivo: z.string().optional(),
  })
  .strict();

/**
 * Esquema para duplicar semana
 * Spec Etapa 3 - Sección 12: Duplicación
 */
export const duplicarSemanaSchema = z
  .object({
    semanaOrigenId: z.string().uuid("semanaOrigenId debe ser un UUID válido"),
    fechaInicio: z.string().date("fechaInicio debe ser una fecha válida"),
  })
  .strict()
  .refine((data) => esLunes(data.fechaInicio), {
    message: "fechaInicio debe ser un lunes",
    path: ["fechaInicio"],
  });

/**
 * Esquema para listar semanas con filtros
 * Spec Etapa 3 - Sección 18: Endpoints GET
 */
export const listarSemanasSchema = z
  .object({
    marcaId: z.string().uuid().optional(),
    canalId: z.string().uuid().optional(),
    empresaId: z.string().uuid().optional(),
    estado: z.enum(Object.values(ESTADOS_VERSION)).optional(),
    desde: z.string().date().optional(),
    hasta: z.string().date().optional(),
    pagina: z.number().int().min(1).optional().default(1),
    limite: z.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

/**
 * Esquema para solicitar exportación
 * Spec Etapa 3 - Sección 24, 25: Exportaciones
 */
export const exportarSemanaSchema = z
  .object({
    versionId: z.string().uuid("versionId debe ser un UUID válido"),
    formato: z.enum(["TEXTO", "EXCEL", "WHATSAPP"]),
    plantillaId: z.string().uuid().optional(),
  })
  .strict();

/**
 * Validar que fecha sea válida para lunes
 */
export function validarFechaLunes(fecha) {
  try {
    const parsed = z.string().date().parse(fecha);
    return esLunes(parsed);
  } catch {
    return false;
  }
}

/**
 * Validar UUID
 */
export function validarUUID(uuid) {
  try {
    z.string().uuid().parse(uuid);
    return true;
  } catch {
    return false;
  }
}
