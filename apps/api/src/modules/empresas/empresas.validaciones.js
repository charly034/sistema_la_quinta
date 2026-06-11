import { z } from "zod";
const textoNoVacio = z.string().trim().min(1);
export const listarEmpresasSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().min(1).optional(),
    tamano: z.coerce.number().int().min(1).max(100).optional(),
    buscar: z.string().trim().optional(),
    estado: z.string().trim().optional(),
    marca: z.string().trim().optional(),
  }),
});
export const empresaIdSchema = z.object({
  params: z.object({ id: textoNoVacio }),
});
export const crearEmpresaSchema = z.object({
  body: z.object({
    codigo: textoNoVacio,
    nombre: textoNoVacio,
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});
export const actualizarEmpresaSchema = z.object({
  body: z.object({
    nombre: textoNoVacio.optional(),
    descripcion: z.string().trim().optional(),
    estado: z.string().trim().optional(),
  }),
});
export const cambiarEstadoEmpresaSchema = z.object({
  body: z.object({ estado: textoNoVacio }),
});
export const asignarMarcasEmpresaSchema = z.object({
  body: z.object({ marcas: z.array(textoNoVacio).min(0) }),
});
