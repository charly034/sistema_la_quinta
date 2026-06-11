import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../middlewares/autenticacion.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listarRolesSchema,
  rolIdSchema,
  crearRolSchema,
  actualizarRolSchema,
  asignarPermisosRolSchema,
} from "./roles.validaciones.js";
import {
  listarRolesControlador,
  obtenerRolControlador,
  crearRolControlador,
  actualizarRolControlador,
  reemplazarPermisosRolControlador,
  listarPermisosControlador,
} from "./roles.controlador.js";

const router = Router();

router.get(
  "/roles",
  autenticar,
  requierePermiso("ROLES_LEER"),
  validate({ query: listarRolesSchema.shape.query }),
  listarRolesControlador,
);
router.get(
  "/roles/:id",
  autenticar,
  requierePermiso("ROLES_LEER"),
  validate({ params: rolIdSchema.shape.params }),
  obtenerRolControlador,
);
router.post(
  "/roles",
  autenticar,
  requierePermiso("ROLES_GESTIONAR"),
  validate({ body: crearRolSchema.shape.body }),
  crearRolControlador,
);
router.patch(
  "/roles/:id",
  autenticar,
  requierePermiso("ROLES_GESTIONAR"),
  validate({
    params: rolIdSchema.shape.params,
    body: actualizarRolSchema.shape.body,
  }),
  actualizarRolControlador,
);
router.put(
  "/roles/:id/permisos",
  autenticar,
  requierePermiso("ROLES_GESTIONAR"),
  validate({
    params: rolIdSchema.shape.params,
    body: asignarPermisosRolSchema.shape.body,
  }),
  reemplazarPermisosRolControlador,
);
router.get(
  "/permisos",
  autenticar,
  requierePermiso("ROLES_LEER"),
  listarPermisosControlador,
);

export default router;
