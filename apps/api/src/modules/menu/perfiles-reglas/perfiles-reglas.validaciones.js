import { z } from "zod";

const uuid = z.string().uuid();

export const ESTADOS_PERFIL = ["ACTIVO", "INACTIVO", "ARCHIVADO"];

const detalleReglaSchema = z.object({
  reglaId: uuid,
  orden: z.number().int().min(0).default(0),
  activa: z.boolean().default(true),
  pesoPersonalizado: z.number().optional().nullable(),
  prioridadPersonalizada: z.number().int().min(0).optional().nullable(),
  parametrosPersonalizados: z.record(z.any()).optional().nullable(),
});

export const crearPerfilSchema = z.object({
  body: z.object({
    codigo: z.string().trim().min(1).max(120),
    nombre: z.string().trim().min(1).max(160),
    descripcion: z.string().trim().max(2000).optional().nullable(),
    estado: z.enum(ESTADOS_PERFIL).default("ACTIVO"),
    marcaId: uuid.optional().nullable(),
    canalId: uuid.optional().nullable(),
    empresaId: uuid.optional().nullable(),
    esPredeterminado: z.boolean().default(false),
    reglas: z.array(detalleReglaSchema).optional(),
  }),
});

export const actualizarPerfilSchema = z.object({
  body: crearPerfilSchema.shape.body.partial(),
});

export const listarPerfilesSchema = z.object({
  query: z.object({
    buscar: z.string().trim().optional(),
    estado: z.enum(ESTADOS_PERFIL).optional(),
    marcaId: uuid.optional(),
    canalId: uuid.optional(),
    empresaId: uuid.optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
    ordenCampo: z
      .enum(["codigo", "nombre", "creado_en", "actualizado_en"])
      .default("codigo"),
    ordenDireccion: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export const cambiarEstadoPerfilSchema = z.object({
  body: z.object({ estado: z.enum(ESTADOS_PERFIL) }),
});

export const reemplazarReglasPerfilSchema = z.object({
  body: z.object({ reglas: z.array(detalleReglaSchema).min(1) }),
});
