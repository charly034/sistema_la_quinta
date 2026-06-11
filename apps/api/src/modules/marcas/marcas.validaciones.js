import { z } from "zod";

const textoNoVacio = z.string().trim().min(1);

export const listarMarcasSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    buscar: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});

export const marcaIdSchema = z.object({
  params: z.object({ id: textoNoVacio }),
});

export const crearMarcaSchema = z.object({
  body: z.object({
    codigo: textoNoVacio,
    nombre: textoNoVacio,
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});

export const actualizarMarcaSchema = z.object({
  body: z.object({
    nombre: textoNoVacio.optional(),
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});

export const cambiarEstadoMarcaSchema = z.object({
  body: z.object({ estado: textoNoVacio }),
});
