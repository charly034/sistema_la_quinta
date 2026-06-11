import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../middlewares/autenticacion.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { listarAuditoriaSchema } from "./auditoria.validaciones.js";
import { listarAuditoriaControlador } from "./auditoria.controlador.js";

const router = Router();

router.get(
  "/auditoria",
  autenticar,
  requierePermiso("AUDITORIA_LEER"),
  validate({ query: listarAuditoriaSchema.shape.query }),
  listarAuditoriaControlador,
);

export default router;
