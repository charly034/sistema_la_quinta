import { z } from "zod";

const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const nonEmpty = z.string().trim().min(1);

export const pedidoParamsSchema = z.object({
  id: nonEmpty,
});

export const createPedidoBodySchema = z.object({
  id: nonEmpty,
  fecha: z.string().regex(fechaRegex, "fecha debe tener formato DD/MM/YYYY"),
  hora: z.string().regex(horaRegex, "hora debe tener formato HH:mm o HH:mm:ss"),
  telefono: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((v) => v.length > 0, "telefono es obligatorio"),
  nombre: nonEmpty,
  direccion: z.string().trim().optional(),
  modalidad: nonEmpty,
  productos: nonEmpty,
  estado: z.string().trim().min(1).optional(),
});

export const updatePedidoEstadoBodySchema = z.object({
  estado: nonEmpty,
});
