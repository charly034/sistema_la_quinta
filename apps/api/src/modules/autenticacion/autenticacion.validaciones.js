import { z } from "zod";

const correoSchema = z
  .string()
  .trim()
  .min(1)
  .email()
  .transform((valor) => valor.toLowerCase());

const contrasenaSchema = z
  .string()
  .min(8, "La contrasena debe tener al menos 8 caracteres");

const idSchema = z.string().trim().min(1);

export const iniciarSesionSchema = z.object({
  body: z.object({
    correo: correoSchema,
    contrasena: contrasenaSchema,
  }),
});

export const renovarSesionSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().min(20),
  }),
});

export const cerrarSesionSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().min(20),
  }),
});

export const cambiarContrasenaSchema = z.object({
  body: z.object({
    contrasenaActual: contrasenaSchema,
    nuevaContrasena: contrasenaSchema,
  }),
});

export const usuarioIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});
