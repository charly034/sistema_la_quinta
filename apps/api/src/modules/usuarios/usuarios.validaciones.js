import { z } from "zod";

const correoSchema = z
  .string()
  .trim()
  .min(1)
  .email()
  .transform((valor) => valor.toLowerCase());
const textoNoVacio = z.string().trim().min(1);

export const listarUsuariosSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    buscar: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});

export const usuarioIdSchema = z.object({
  params: z.object({ id: textoNoVacio }),
});

export const crearUsuarioSchema = z.object({
  body: z.object({
    correo: correoSchema,
    contrasena: z.string().min(8),
    nombre: textoNoVacio,
    estado: z.string().trim().optional(),
  }),
});

export const actualizarUsuarioSchema = z.object({
  body: z.object({
    nombre: textoNoVacio.optional(),
    correo: correoSchema.optional(),
    estado: z.string().trim().optional(),
  }),
});

export const actualizarEstadoUsuarioSchema = z.object({
  body: z.object({ estado: textoNoVacio }),
});

export const actualizarRolesUsuarioSchema = z.object({
  body: z.object({ roles: z.array(textoNoVacio).min(0) }),
});
