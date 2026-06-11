import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../../middlewares/autenticacion.middleware.js";
import {
  listarReglasHandler,
  obtenerReglaHandler,
  crearReglaHandler,
  actualizarReglaHandler,
  cambiarEstadoReglaHandler,
  duplicarReglaHandler,
  evaluarReglaHandler,
} from "./reglas.controlador.js";

const router = Router();

router.get(
  "/menu/reglas",
  autenticar,
  requierePermiso("REGLAS_LEER"),
  listarReglasHandler,
);
router.get(
  "/menu/reglas/:id",
  autenticar,
  requierePermiso("REGLAS_LEER"),
  obtenerReglaHandler,
);
router.post(
  "/menu/reglas",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  crearReglaHandler,
);
router.patch(
  "/menu/reglas/:id",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  actualizarReglaHandler,
);
router.patch(
  "/menu/reglas/:id/estado",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  cambiarEstadoReglaHandler,
);
router.post(
  "/menu/reglas/:id/duplicar",
  autenticar,
  requierePermiso("REGLAS_GESTIONAR"),
  duplicarReglaHandler,
);
router.post(
  "/menu/reglas/evaluar",
  autenticar,
  requierePermiso("REGLAS_LEER"),
  evaluarReglaHandler,
);

export default router;
