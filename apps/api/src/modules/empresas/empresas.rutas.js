import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../middlewares/autenticacion.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listarEmpresasSchema,
  empresaIdSchema,
  crearEmpresaSchema,
  actualizarEmpresaSchema,
  cambiarEstadoEmpresaSchema,
  asignarMarcasEmpresaSchema,
} from "./empresas.validaciones.js";
import {
  listarEmpresasControlador,
  obtenerEmpresaControlador,
  crearEmpresaControlador,
  actualizarEmpresaControlador,
  cambiarEstadoEmpresaControlador,
  reemplazarMarcasEmpresaControlador,
} from "./empresas.controlador.js";
const router = Router();
router.get(
  "/empresas",
  autenticar,
  requierePermiso("EMPRESAS_LEER"),
  validate({ query: listarEmpresasSchema.shape.query }),
  listarEmpresasControlador,
);
router.get(
  "/empresas/:id",
  autenticar,
  requierePermiso("EMPRESAS_LEER"),
  validate({ params: empresaIdSchema.shape.params }),
  obtenerEmpresaControlador,
);
router.post(
  "/empresas",
  autenticar,
  requierePermiso("EMPRESAS_GESTIONAR"),
  validate({ body: crearEmpresaSchema.shape.body }),
  crearEmpresaControlador,
);
router.patch(
  "/empresas/:id",
  autenticar,
  requierePermiso("EMPRESAS_GESTIONAR"),
  validate({
    params: empresaIdSchema.shape.params,
    body: actualizarEmpresaSchema.shape.body,
  }),
  actualizarEmpresaControlador,
);
router.patch(
  "/empresas/:id/estado",
  autenticar,
  requierePermiso("EMPRESAS_GESTIONAR"),
  validate({
    params: empresaIdSchema.shape.params,
    body: cambiarEstadoEmpresaSchema.shape.body,
  }),
  cambiarEstadoEmpresaControlador,
);
router.put(
  "/empresas/:id/marcas",
  autenticar,
  requierePermiso("EMPRESAS_GESTIONAR"),
  validate({
    params: empresaIdSchema.shape.params,
    body: asignarMarcasEmpresaSchema.shape.body,
  }),
  reemplazarMarcasEmpresaControlador,
);
export default router;
