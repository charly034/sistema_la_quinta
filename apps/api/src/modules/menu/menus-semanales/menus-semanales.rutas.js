import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../../middlewares/autenticacion.middleware.js";
import {
  listarSemanasHandler,
  crearSemanaHandler,
  obtenerSemanaHandler,
  actualizarSemanaHandler,
  duplicarSemanaHandler,
  listarVersionesSemanaHandler,
  obtenerVersionSemanaHandler,
  crearVersionHandler,
  actualizarVersionHandler,
  actualizarDiaPorFechaHandler,
  actualizarOpcionesPorFechaHandler,
  proponerVersionHandler,
  aprobarVersionHandler,
  publicarVersionHandler,
  finalizarVersionHandler,
  cancelarVersionHandler,
  obtenerMensajeWhatsappHandler,
  exportarTextoHandler,
  exportarExcelHandler,
  obtenerHistorialPlatoHandler,
  obtenerHistorialVersionesHandler,
  exportarSemanaHandler,
  importarSemanasHandler,
  transicionarEstadoHandler,
  asignarPlatoHandler,
} from "./menus-semanales.controlador.js";

const router = Router();

// Contrato principal
router.get("/menu/semanas", autenticar, requierePermiso("MENUS_LEER"), listarSemanasHandler);
router.get("/menu/semanas/:id", autenticar, requierePermiso("MENUS_LEER"), obtenerSemanaHandler);
router.post("/menu/semanas", autenticar, requierePermiso("MENUS_GESTIONAR"), crearSemanaHandler);
router.patch("/menu/semanas/:id", autenticar, requierePermiso("MENUS_GESTIONAR"), actualizarSemanaHandler);
router.post("/menu/semanas/:id/duplicar", autenticar, requierePermiso("MENUS_GESTIONAR"), duplicarSemanaHandler);

router.get("/menu/semanas/:id/versiones", autenticar, requierePermiso("MENUS_LEER"), listarVersionesSemanaHandler);
router.get("/menu/semanas/:id/versiones/:versionId", autenticar, requierePermiso("MENUS_LEER"), obtenerVersionSemanaHandler);
router.post("/menu/semanas/:id/versiones", autenticar, requierePermiso("MENUS_GESTIONAR"), crearVersionHandler);
router.put("/menu/semanas/:id/versiones/:versionId", autenticar, requierePermiso("MENUS_GESTIONAR"), actualizarVersionHandler);

router.put("/menu/semanas/:id/versiones/:versionId/dias/:fecha", autenticar, requierePermiso("MENUS_GESTIONAR"), actualizarDiaPorFechaHandler);
router.put("/menu/semanas/:id/versiones/:versionId/dias/:fecha/opciones", autenticar, requierePermiso("MENUS_GESTIONAR"), actualizarOpcionesPorFechaHandler);

router.post("/menu/semanas/:id/versiones/:versionId/proponer", autenticar, requierePermiso("MENUS_GESTIONAR"), proponerVersionHandler);
router.post("/menu/semanas/:id/versiones/:versionId/aprobar", autenticar, requierePermiso("MENUS_APROBAR"), aprobarVersionHandler);
router.post("/menu/semanas/:id/versiones/:versionId/publicar", autenticar, requierePermiso("MENUS_PUBLICAR"), publicarVersionHandler);
router.post("/menu/semanas/:id/versiones/:versionId/finalizar", autenticar, requierePermiso("MENUS_GESTIONAR"), finalizarVersionHandler);
router.post("/menu/semanas/:id/versiones/:versionId/cancelar", autenticar, requierePermiso("MENUS_GESTIONAR"), cancelarVersionHandler);

router.get("/menu/semanas/:id/mensaje-whatsapp", autenticar, requierePermiso("MENUS_EXPORTAR"), obtenerMensajeWhatsappHandler);
router.get("/menu/semanas/:id/exportar/texto", autenticar, requierePermiso("MENUS_EXPORTAR"), exportarTextoHandler);
router.get("/menu/semanas/:id/exportar/excel", autenticar, requierePermiso("MENUS_EXPORTAR"), exportarExcelHandler);

router.get("/menu/platos/:id/historial-uso", autenticar, requierePermiso("MENUS_LEER"), obtenerHistorialPlatoHandler);

// Alias temporal legado
router.get("/menus-semanales", autenticar, requierePermiso("MENUS_LEER"), listarSemanasHandler);
router.post("/menus-semanales", autenticar, requierePermiso("MENUS_GESTIONAR"), crearSemanaHandler);
router.get("/menus-semanales/:semanaId", autenticar, requierePermiso("MENUS_LEER"), obtenerSemanaHandler);
router.get("/menus-semanales/:semanaId/historial-versiones", autenticar, requierePermiso("MENUS_LEER"), obtenerHistorialVersionesHandler);
router.post("/menus-semanales/:semanaId/versiones", autenticar, requierePermiso("MENUS_GESTIONAR"), crearVersionHandler);
router.post("/menus-semanales/versiones/:versionId/transicionar", autenticar, requierePermiso("MENUS_GESTIONAR"), transicionarEstadoHandler);
router.post("/menus-semanales/versiones/:versionId/opciones", autenticar, requierePermiso("MENUS_GESTIONAR"), asignarPlatoHandler);
router.get("/menus-semanales/platos/:platoId/historial", autenticar, requierePermiso("MENUS_LEER"), obtenerHistorialPlatoHandler);
router.post("/menus-semanales/duplicar", autenticar, requierePermiso("MENUS_GESTIONAR"), duplicarSemanaHandler);
router.post("/menus-semanales/exportar", autenticar, requierePermiso("MENUS_EXPORTAR"), exportarSemanaHandler);
router.post("/menus-semanales/importar", autenticar, requierePermiso("MENUS_IMPORTAR"), importarSemanasHandler);

export default router;
