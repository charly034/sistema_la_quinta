import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../middlewares/autenticacion.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listarMarcasSchema,
  marcaIdSchema,
  crearMarcaSchema,
  actualizarMarcaSchema,
  cambiarEstadoMarcaSchema,
} from "./marcas.validaciones.js";
import {
  listarMarcasControlador,
  obtenerMarcaControlador,
  crearMarcaControlador,
  actualizarMarcaControlador,
  cambiarEstadoMarcaControlador,
} from "./marcas.controlador.js";

const router = Router();

router.get(
  "/marcas",
  autenticar,
  requierePermiso("MARCAS_LEER"),
  validate({ query: listarMarcasSchema.shape.query }),
  listarMarcasControlador,
);
router.get(
  "/marcas/:id",
  autenticar,
  requierePermiso("MARCAS_LEER"),
  validate({ params: marcaIdSchema.shape.params }),
  obtenerMarcaControlador,
);
router.post(
  "/marcas",
  autenticar,
  requierePermiso("MARCAS_GESTIONAR"),
  validate({ body: crearMarcaSchema.shape.body }),
  crearMarcaControlador,
);
router.patch(
  "/marcas/:id",
  autenticar,
  requierePermiso("MARCAS_GESTIONAR"),
  validate({
    params: marcaIdSchema.shape.params,
    body: actualizarMarcaSchema.shape.body,
  }),
  actualizarMarcaControlador,
);
router.patch(
  "/marcas/:id/estado",
  autenticar,
  requierePermiso("MARCAS_GESTIONAR"),
  validate({
    params: marcaIdSchema.shape.params,
    body: cambiarEstadoMarcaSchema.shape.body,
  }),
  cambiarEstadoMarcaControlador,
);

export default router;
