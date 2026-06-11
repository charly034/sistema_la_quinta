/**
 * Módulo de Menús
 * Integración de todos los sub-módulos
 */

import { Router } from "express";
import menusSemanalesRouter from "./menus-semanales/menus-semanales.rutas.js";

const router = Router();

// Rutas de menús semanales
router.use("/menus-semanales", menusSemanalesRouter);

export default router;
