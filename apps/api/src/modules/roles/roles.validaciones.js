import { z } from "zod";

const textoNoVacio = z.string().trim().min(1);

export const listarRolesSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    buscar: z.string().trim().optional(),
  }),
});

export const rolIdSchema = z.object({
  params: z.object({
    id: textoNoVacio,
  }),
});

export const crearRolSchema = z.object({
  body: z.object({
    codigo: textoNoVacio,
    nombre: textoNoVacio,
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});

export const actualizarRolSchema = z.object({
  body: z.object({
    nombre: textoNoVacio.optional(),
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});

export const asignarPermisosRolSchema = z.object({
  body: z.object({
    permisos: z.array(textoNoVacio).min(0),
  }),
});
