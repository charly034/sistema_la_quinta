import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../../middlewares/autenticacion.middleware.js";
import {
  generarPropuestasHandler,
  generarPropuestaPersonalizadaHandler,
  listarPropuestasHandler,
  obtenerPropuestaHandler,
  aprobarPropuestaHandler,
  descartarPropuestaHandler,
  aplicarPropuestaHandler,
} from "./propuestas.controlador.js";

const router = Router();

router.post(
  "/menu/semanas/:id/versiones/:versionId/propuestas/generar",
  autenticar,
  requierePermiso("PROPUESTAS_GENERAR"),
  generarPropuestasHandler,
);

router.post(
  "/menu/semanas/:id/versiones/:versionId/propuestas/generar-personalizada",
  autenticar,
  requierePermiso("PROPUESTAS_GENERAR"),
  generarPropuestaPersonalizadaHandler,
);

router.get(
  "/menu/semanas/:id/versiones/:versionId/propuestas",
  autenticar,
  requierePermiso("PROPUESTAS_LEER"),
  listarPropuestasHandler,
);

router.get(
  "/menu/semanas/:id/versiones/:versionId/propuestas/:propuestaId",
  autenticar,
  requierePermiso("PROPUESTAS_LEER"),
  obtenerPropuestaHandler,
);

router.post(
  "/menu/semanas/:id/versiones/:versionId/propuestas/:propuestaId/aprobar",
  autenticar,
  requierePermiso("PROPUESTAS_APROBAR"),
  aprobarPropuestaHandler,
);

router.post(
  "/menu/semanas/:id/versiones/:versionId/propuestas/:propuestaId/descartar",
  autenticar,
  requierePermiso("PROPUESTAS_APROBAR"),
  descartarPropuestaHandler,
);

router.post(
  "/menu/semanas/:id/versiones/:versionId/propuestas/:propuestaId/aplicar",
  autenticar,
  requierePermiso("PROPUESTAS_APLICAR"),
  aplicarPropuestaHandler,
);

export default router;
