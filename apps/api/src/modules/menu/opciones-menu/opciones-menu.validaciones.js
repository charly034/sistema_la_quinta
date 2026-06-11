import { z } from "zod";
const textoNoVacio = z.string().trim().min(1);
export const listarOpcionesMenuSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    marca: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});
export const opcionMenuIdSchema = z.object({
  params: z.object({ id: textoNoVacio }),
});
export const crearOpcionMenuSchema = z.object({
  body: z.object({
    marcaId: textoNoVacio,
    codigo: textoNoVacio,
    nombre: textoNoVacio,
    descripcion: z.string().trim().optional(),
    orden: z.coerce.number().int().min(0).optional(),
    estado: z.string().trim().optional(),
  }),
});
export const actualizarOpcionMenuSchema = z.object({
  body: z.object({
    nombre: textoNoVacio.optional(),
    descripcion: z.string().trim().optional(),
    orden: z.coerce.number().int().min(0).optional(),
    estado: z.string().trim().optional(),
  }),
});
export const cambiarEstadoOpcionMenuSchema = z.object({
  body: z.object({ estado: textoNoVacio }),
});
export const reordenarOpcionesMenuSchema = z.object({
  body: z.object({
    marcaId: textoNoVacio,
    opciones: z
      .array(
        z.object({ id: textoNoVacio, orden: z.coerce.number().int().min(0) }),
      )
      .min(1),
  }),
});
