import { z } from "zod";
import {
  ESTADOS_PLATO,
  TIPOS_PLATO,
  FUNCIONES_COMPONENTE,
  TIPOS_PRESENCIA_ALERGENO,
  ESTADOS_VALIDACION_CARACTERISTICA,
  CLASIFICACIONES_CONFIG,
  RECURSOS_CLASIFICACION_PUBLICOS,
  RECURSOS_CLASIFICACION_ALIAS,
} from "./platos.constantes.js";

const textoNoVacio = z.string().trim().min(1);
const uuid = z.string().uuid();

export const platoIdSchema = z.object({
  params: z.object({ id: uuid }),
});

export const listarPlatosSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    marcaId: uuid.optional(),
    tipo: z.enum(TIPOS_PLATO).optional(),
    estado: z.enum(ESTADOS_PLATO).optional(),
    categoriaId: uuid.optional(),
    proteinaId: uuid.optional(),
    favorito: z.coerce.boolean().optional(),
    buscar: z.string().trim().optional(),
    q: z.string().trim().optional(),
    includeArchivados: z.coerce.boolean().optional(),
    sortBy: z
      .enum(["nombre", "creado_en", "actualizado_en", "tipo"])
      .optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  }),
});

export const crearPlatoSchema = z.object({
  body: z.object({
    marcaId: uuid,
    tipo: z.enum(TIPOS_PLATO),
    codigo: z.string().trim().min(1).max(64).optional(),
    nombre: textoNoVacio.max(160),
    descripcionComercial: z.string().trim().max(1000).optional(),
    descripcionInterna: z.string().trim().max(1000).optional(),
    estado: z.enum(ESTADOS_PLATO).optional(),
    favorito: z.boolean().optional(),
    aptoFreezer: z.boolean().optional(),
    esEstacional: z.boolean().optional(),
    temporadaDesde: z.coerce
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .nullable(),
    temporadaHasta: z.coerce
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .nullable(),
    tiempoPreparacionMinutos: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .nullable(),
    dificultad: z.string().trim().max(64).optional().nullable(),
    porcionReferenciaGramos: z.coerce.number().min(0).optional().nullable(),
    costoReferencia: z.coerce.number().min(0).optional().nullable(),
    precioReferencia: z.coerce.number().min(0).optional().nullable(),
    imagenUrl: z.string().trim().url().optional().nullable(),
    observaciones: z.string().trim().max(2000).optional().nullable(),
  }),
});

export const actualizarPlatoSchema = z.object({
  body: crearPlatoSchema.shape.body.partial(),
});

export const actualizarEstadoPlatoSchema = z.object({
  body: z.object({
    estado: z.enum(ESTADOS_PLATO),
    motivoBloqueo: z.string().trim().max(500).optional().nullable(),
    bloqueadoDesde: z.string().datetime().optional().nullable(),
    bloqueadoHasta: z.string().datetime().optional().nullable(),
  }),
});

export const actualizarFavoritoPlatoSchema = z.object({
  body: z.object({ favorito: z.boolean() }),
});

export const reemplazarComponentesSchema = z.object({
  body: z.object({
    componentes: z
      .array(
        z.object({
          platoComponenteId: uuid,
          funcion: z.enum(FUNCIONES_COMPONENTE),
          orden: z.coerce.number().int().min(0).default(0),
          cantidadReferencia: z.coerce.number().min(0).optional().nullable(),
          unidadReferencia: z.string().trim().max(64).optional().nullable(),
          esPrincipal: z.boolean().optional(),
        }),
      )
      .max(60),
  }),
});

export const agregarAliasSchema = z.object({
  body: z.object({ alias: textoNoVacio.max(160) }),
});

export const aliasIdSchema = z.object({
  params: z.object({ id: uuid, aliasId: uuid }),
});

export const componentesPlatoIdSchema = z.object({
  params: z.object({ id: uuid }),
});

export const relacionesPlatoIdSchema = z.object({
  params: z.object({ id: uuid }),
});

export const relacionBasicaSchema = z.object({
  params: z.object({
    id: uuid,
    relacion: z.enum(["categorias", "proteinas", "etiquetas"]),
  }),
});

const idsSchema = z.array(uuid).max(200);

export const reemplazarIdsRelacionSchema = z.object({
  body: z.object({ ids: idsSchema }),
});

export const reemplazarIngredientesSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: uuid,
          cantidadReferencia: z.coerce.number().min(0).optional().nullable(),
          unidadReferencia: z.string().trim().max(64).optional().nullable(),
          esPrincipal: z.boolean().optional(),
          esOpcional: z.boolean().optional(),
          observaciones: z.string().trim().max(300).optional().nullable(),
        }),
      )
      .max(300),
  }),
});

export const reemplazarAlergenosSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: uuid,
          tipoPresencia: z.enum(TIPOS_PRESENCIA_ALERGENO),
          observaciones: z.string().trim().max(300).optional().nullable(),
        }),
      )
      .max(100),
  }),
});

export const reemplazarCaracteristicasSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: uuid,
          estadoValidacion: z
            .enum(ESTADOS_VALIDACION_CARACTERISTICA)
            .optional(),
          observaciones: z.string().trim().max(300).optional().nullable(),
        }),
      )
      .max(100),
  }),
});

const clasificacionEstados = Array.from(
  new Set(
    Object.values(CLASIFICACIONES_CONFIG).flatMap((config) => config.estados),
  ),
);

export const listarClasificacionSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    marcaId: uuid.optional(),
    estado: z.enum(clasificacionEstados).optional(),
    q: z.string().trim().optional(),
    includeArchivadas: z.coerce.boolean().optional(),
  }),
});

export const clasificacionIdSchema = z.object({
  params: z.object({
    recurso: z.enum([
      ...RECURSOS_CLASIFICACION_PUBLICOS,
      ...Object.keys(RECURSOS_CLASIFICACION_ALIAS),
    ]),
    id: uuid,
  }),
});

export const crearClasificacionSchema = z.object({
  body: z.object({
    marcaId: uuid.optional(),
    codigo: textoNoVacio.max(64),
    nombre: textoNoVacio.max(160),
    descripcion: z.string().trim().max(1000).optional().nullable(),
    estado: z.enum(clasificacionEstados).optional(),
    orden: z.coerce.number().int().min(0).optional(),
    tipo: z
      .enum(["ALIMENTARIA", "COMERCIAL", "OPERATIVA", "TEMPORAL", "OTRA"])
      .optional(),
  }),
});

export const actualizarClasificacionSchema = z.object({
  body: crearClasificacionSchema.shape.body.partial(),
});
