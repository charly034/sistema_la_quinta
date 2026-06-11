import { z } from "zod";
import { ESTADOS_PROPUESTA } from "./propuestas.constantes.js";

const uuid = z.string().uuid();

export const generarPropuestasSchema = z.object({
  body: z.object({
    generar_perfiles_iniciales: z.boolean().default(true),
    respetar_platos_existentes: z.boolean().default(true),
    solo_posiciones_vacias: z.boolean().default(true),
    variar_resultados: z.boolean().default(false),
    semilla: z.string().trim().min(1).max(120).optional(),
    posiciones_bloqueadas: z
      .array(
        z.object({
          fecha: z.string().date(),
          opcion_menu_marca_id: uuid,
        }),
      )
      .default([]),
  }),
});

export const generarPropuestaPersonalizadaSchema = z.object({
  body: z.object({
    perfil_id: uuid,
    reglas_adicionales: z.array(uuid).default([]),
    reglas_desactivadas: z.array(z.string()).default([]),
    parametros: z.record(z.any()).default({}),
    semilla: z.string().trim().min(1).max(120).optional(),
    variar_resultados: z.boolean().default(false),
  }),
});

export const listarPropuestasSchema = z.object({
  query: z.object({
    estado: z.enum(ESTADOS_PROPUESTA).optional(),
    perfil_id: uuid.optional(),
    tipo: z
      .enum(["EQUILIBRADA", "HISTORICA", "RENOVACION", "PERSONALIZADA"])
      .optional(),
    creado_desde: z.string().datetime().optional(),
    creado_hasta: z.string().datetime().optional(),
  }),
});

export const descartarPropuestaSchema = z.object({
  body: z.object({
    motivo: z.string().trim().max(500).optional(),
  }),
});
