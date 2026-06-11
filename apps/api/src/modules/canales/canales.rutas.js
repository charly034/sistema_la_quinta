import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../middlewares/autenticacion.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listarCanalesSchema,
  canalIdSchema,
  crearCanalSchema,
  actualizarCanalSchema,
  cambiarEstadoCanalSchema,
} from "./canales.validaciones.js";
import {
  listarCanalesControlador,
  obtenerCanalControlador,
  crearCanalControlador,
  actualizarCanalControlador,
  cambiarEstadoCanalControlador,
} from "./canales.controlador.js";
const router = Router();
router.get(
  "/canales",
  autenticar,
  requierePermiso("CANALES_LEER"),
  validate({ query: listarCanalesSchema.shape.query }),
  listarCanalesControlador,
);
router.get(
  "/canales/:id",
  autenticar,
  requierePermiso("CANALES_LEER"),
  validate({ params: canalIdSchema.shape.params }),
  obtenerCanalControlador,
);
router.post(
  "/canales",
  autenticar,
  requierePermiso("CANALES_GESTIONAR"),
  validate({ body: crearCanalSchema.shape.body }),
  crearCanalControlador,
);
router.patch(
  "/canales/:id",
  autenticar,
  requierePermiso("CANALES_GESTIONAR"),
  validate({
    params: canalIdSchema.shape.params,
    body: actualizarCanalSchema.shape.body,
  }),
  actualizarCanalControlador,
);
router.patch(
  "/canales/:id/estado",
  autenticar,
  requierePermiso("CANALES_GESTIONAR"),
  validate({
    params: canalIdSchema.shape.params,
    body: cambiarEstadoCanalSchema.shape.body,
  }),
  cambiarEstadoCanalControlador,
);
export default router;
