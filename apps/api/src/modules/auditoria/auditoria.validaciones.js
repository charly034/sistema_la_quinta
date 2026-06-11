import { z } from "zod";

const textoNoVacio = z.string().trim().min(1);

export const listarAuditoriaSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    usuarioId: z.string().trim().optional(),
    accion: z.string().trim().optional(),
    entidad: z.string().trim().optional(),
    entidadId: z.string().trim().optional(),
    desde: z.string().trim().optional(),
    hasta: z.string().trim().optional(),
  }),
});

export const auditoriaIdSchema = z.object({
  params: z.object({ id: textoNoVacio }),
});
