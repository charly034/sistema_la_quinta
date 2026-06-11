import { z } from "zod";
import {
  ESTADOS_REGLA,
  NATURALEZAS_REGLA,
  TIPOS_REGLA,
  TIPOS_REGLA_FACTOR,
  TIPOS_REGLA_SIN_PARAMETROS,
} from "./reglas.constantes.js";

const uuid = z.string().uuid();

const schemaVacio = z.object({}).strict();
const schemaAntiguedad = z
  .object({ semanas_minimas: z.number().int().min(0) })
  .strict();
const schemaCategoriaCantidad = z
  .object({ categoria_id: uuid, cantidad: z.number().int().min(0) })
  .strict();
const schemaProteinaCantidad = z
  .object({ proteina_id: uuid, cantidad: z.number().int().min(0) })
  .strict();
const schemaFactor = z
  .object({ factor: z.number().positive().optional() })
  .strict();

export function obtenerSchemaParametrosPorTipo(tipo) {
  if (TIPOS_REGLA_SIN_PARAMETROS.has(tipo)) return schemaVacio;
  if (tipo === "ANTIGUEDAD_MINIMA_PLATO") return schemaAntiguedad;
  if (
    tipo === "MAXIMO_CATEGORIA_SEMANA" ||
    tipo === "MINIMO_CATEGORIA_SEMANA"
  ) {
    return schemaCategoriaCantidad;
  }
  if (tipo === "MAXIMO_PROTEINA_SEMANA" || tipo === "MINIMO_PROTEINA_SEMANA") {
    return schemaProteinaCantidad;
  }
  if (TIPOS_REGLA_FACTOR.has(tipo)) return schemaFactor;
  return null;
}

export function validarParametrosPorTipo(tipo, parametros) {
  const schema = obtenerSchemaParametrosPorTipo(tipo);
  if (!schema)
    return {
      ok: false,
      errores: [{ path: ["tipo"], message: "TIPO_REGLA_INVALIDO" }],
    };
  const parsed = schema.safeParse(parametros || {});
  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    };
  }
  return { ok: true, parametros: parsed.data };
}

const baseReglaSchema = z.object({
  codigo: z.string().trim().min(1).max(120),
  nombre: z.string().trim().min(1).max(160),
  descripcion: z.string().trim().max(2000).optional().nullable(),
  tipo: z.enum(TIPOS_REGLA),
  naturaleza: z.enum(NATURALEZAS_REGLA),
  estado: z.enum(ESTADOS_REGLA).default("ACTIVA"),
  prioridad: z.number().int().min(0).default(0),
  peso: z.number(),
  parametros: z.record(z.any()).default({}),
  marcaId: uuid.optional().nullable(),
  canalId: uuid.optional().nullable(),
  empresaId: uuid.optional().nullable(),
  diaSemanaIso: z.number().int().min(1).max(7).optional().nullable(),
  vigenciaDesde: z.string().date().optional().nullable(),
  vigenciaHasta: z.string().date().optional().nullable(),
  mensajeCumplimiento: z.string().trim().max(300).optional().nullable(),
  mensajeIncumplimiento: z.string().trim().max(300).optional().nullable(),
});

export const crearReglaSchema = z.object({ body: baseReglaSchema });
export const actualizarReglaSchema = z.object({
  body: baseReglaSchema.partial(),
});

export const cambiarEstadoReglaSchema = z.object({
  body: z.object({ estado: z.enum(ESTADOS_REGLA) }),
});

export const listarReglasSchema = z.object({
  query: z.object({
    buscar: z.string().trim().optional(),
    tipo: z.enum(TIPOS_REGLA).optional(),
    naturaleza: z.enum(NATURALEZAS_REGLA).optional(),
    estado: z.enum(ESTADOS_REGLA).optional(),
    marcaId: uuid.optional(),
    canalId: uuid.optional(),
    empresaId: uuid.optional(),
    diaSemanaIso: z.coerce.number().int().min(1).max(7).optional(),
    vigenteEn: z.string().date().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
    ordenCampo: z
      .enum(["prioridad", "codigo", "creado_en", "actualizado_en"])
      .default("prioridad"),
    ordenDireccion: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const evaluarReglasSchema = z.object({
  body: z.object({
    reglaId: uuid.optional(),
    perfilId: uuid.optional(),
    semanaId: uuid.optional(),
    versionId: uuid.optional(),
    platoId: uuid.optional(),
    posicion: z
      .object({
        fecha: z.string().date(),
        opcionMenuMarcaId: uuid,
      })
      .optional(),
    propuestaParcial: z.record(z.any()).optional(),
  }),
});
