import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../../middlewares/autenticacion.middleware.js";
import {
  listarPerfilesHandler,
  obtenerPerfilHandler,
  crearPerfilHandler,
  actualizarPerfilHandler,
  cambiarEstadoPerfilHandler,
  reemplazarReglasPerfilHandler,
  duplicarPerfilHandler,
} from "./perfiles-reglas.controlador.js";

const router = Router();

router.get(
  "/menu/perfiles-reglas",
  autenticar,
  requierePermiso("REGLAS_LEER"),
  listarPerfilesHandler,
);
router.get(
  "/menu/perfiles-reglas/:id",
  autenticar,
  requierePermiso("REGLAS_LEER"),
  obtenerPerfilHandler,
);
router.post(
  "/menu/perfiles-reglas",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  crearPerfilHandler,
);
router.patch(
  "/menu/perfiles-reglas/:id",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  actualizarPerfilHandler,
);
router.patch(
  "/menu/perfiles-reglas/:id/estado",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  cambiarEstadoPerfilHandler,
);
router.put(
  "/menu/perfiles-reglas/:id/reglas",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  reemplazarReglasPerfilHandler,
);
router.post(
  "/menu/perfiles-reglas/:id/duplicar",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  duplicarPerfilHandler,
);

export default router;
