import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../middlewares/autenticacion.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listarUsuariosSchema,
  usuarioIdSchema,
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  actualizarEstadoUsuarioSchema,
  actualizarRolesUsuarioSchema,
} from "./usuarios.validaciones.js";
import {
  listarUsuariosControlador,
  obtenerUsuarioControlador,
  crearUsuarioControlador,
  actualizarUsuarioControlador,
  cambiarEstadoUsuarioControlador,
  reemplazarRolesUsuarioControlador,
} from "./usuarios.controlador.js";

const router = Router();

router.get(
  "/usuarios",
  autenticar,
  requierePermiso("USUARIOS_LEER"),
  validate({ query: listarUsuariosSchema.shape.query }),
  listarUsuariosControlador,
);
router.get(
  "/usuarios/:id",
  autenticar,
  requierePermiso("USUARIOS_LEER"),
  validate({ params: usuarioIdSchema.shape.params }),
  obtenerUsuarioControlador,
);
router.post(
  "/usuarios",
  autenticar,
  requierePermiso("USUARIOS_GESTIONAR"),
  validate({ body: crearUsuarioSchema.shape.body }),
  crearUsuarioControlador,
);
router.patch(
  "/usuarios/:id",
  autenticar,
  requierePermiso("USUARIOS_GESTIONAR"),
  validate({
    params: usuarioIdSchema.shape.params,
    body: actualizarUsuarioSchema.shape.body,
  }),
  actualizarUsuarioControlador,
);
router.patch(
  "/usuarios/:id/estado",
  autenticar,
  requierePermiso("USUARIOS_GESTIONAR"),
  validate({
    params: usuarioIdSchema.shape.params,
    body: actualizarEstadoUsuarioSchema.shape.body,
  }),
  cambiarEstadoUsuarioControlador,
);
router.put(
  "/usuarios/:id/roles",
  autenticar,
  requierePermiso("USUARIOS_GESTIONAR"),
  validate({
    params: usuarioIdSchema.shape.params,
    body: actualizarRolesUsuarioSchema.shape.body,
  }),
  reemplazarRolesUsuarioControlador,
);

export default router;
