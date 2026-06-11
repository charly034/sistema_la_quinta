import { z } from "zod";
const textoNoVacio = z.string().trim().min(1);
export const listarCanalesSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    buscar: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});
export const canalIdSchema = z.object({
  params: z.object({ id: textoNoVacio }),
});
export const crearCanalSchema = z.object({
  body: z.object({
    codigo: textoNoVacio,
    nombre: textoNoVacio,
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});
export const actualizarCanalSchema = z.object({
  body: z.object({
    nombre: textoNoVacio.optional(),
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});
export const cambiarEstadoCanalSchema = z.object({
  body: z.object({ estado: textoNoVacio }),
});
