import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../../middlewares/autenticacion.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  listarOpcionesMenuSchema,
  opcionMenuIdSchema,
  crearOpcionMenuSchema,
  actualizarOpcionMenuSchema,
  cambiarEstadoOpcionMenuSchema,
  reordenarOpcionesMenuSchema,
} from "./opciones-menu.validaciones.js";
import {
  listarOpcionesMenuControlador,
  obtenerOpcionMenuControlador,
  crearOpcionMenuControlador,
  actualizarOpcionMenuControlador,
  cambiarEstadoOpcionMenuControlador,
  reordenarOpcionesMenuControlador,
} from "./opciones-menu.controlador.js";
const router = Router();
router.get(
  "/menu/opciones",
  autenticar,
  requierePermiso("OPCIONES_MENU_LEER"),
  validate({ query: listarOpcionesMenuSchema.shape.query }),
  listarOpcionesMenuControlador,
);
router.get(
  "/menu/opciones/:id",
  autenticar,
  requierePermiso("OPCIONES_MENU_LEER"),
  validate({ params: opcionMenuIdSchema.shape.params }),
  obtenerOpcionMenuControlador,
);
router.post(
  "/menu/opciones",
  autenticar,
  requierePermiso("OPCIONES_MENU_GESTIONAR"),
  validate({ body: crearOpcionMenuSchema.shape.body }),
  crearOpcionMenuControlador,
);
router.patch(
  "/menu/opciones/:id",
  autenticar,
  requierePermiso("OPCIONES_MENU_GESTIONAR"),
  validate({
    params: opcionMenuIdSchema.shape.params,
    body: actualizarOpcionMenuSchema.shape.body,
  }),
  actualizarOpcionMenuControlador,
);
router.patch(
  "/menu/opciones/:id/estado",
  autenticar,
  requierePermiso("OPCIONES_MENU_GESTIONAR"),
  validate({
    params: opcionMenuIdSchema.shape.params,
    body: cambiarEstadoOpcionMenuSchema.shape.body,
  }),
  cambiarEstadoOpcionMenuControlador,
);
router.put(
  "/menu/opciones/reordenar",
  autenticar,
  requierePermiso("OPCIONES_MENU_GESTIONAR"),
  validate({ body: reordenarOpcionesMenuSchema.shape.body }),
  reordenarOpcionesMenuControlador,
);
export default router;
